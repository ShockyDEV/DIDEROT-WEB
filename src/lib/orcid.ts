/**
 * Cliente de la API PÚBLICA de ORCID (pub.orcid.org v3.0, sin credenciales)
 * para importar publicaciones desde el panel (Publicaciones → Importar desde
 * ORCID). Solo lectura de datos públicos; la conversión a publicaciones y la
 * deduplicación son funciones puras en orcid-import.ts.
 *
 * Por cada ORCID se hacen: 1 petición de obras (/works), 1 de datos
 * personales (/personal-details, para escribir bien el nombre del titular)
 * y 1 por cada 100 obras para el detalle en bloque (/works/{pc1,pc2…}),
 * que es donde vienen los autores. Cada petición tiene su timeout
 * (AbortController) y el resultado se guarda 10 minutos en memoria para que
 * «vista previa → importar» no descargue todo dos veces.
 */
import {
  ownerFromPersonalDetails,
  preferredSummary,
  type OrcidBulkResponse,
  type OrcidOwner,
  type OrcidPersonalDetails,
  type OrcidWork,
  type OrcidWorksResponse,
} from "@/lib/orcid-import";

const ORCID_API = "https://pub.orcid.org/v3.0";
const TIMEOUT_MS = 10_000;
/** Máximo de put-codes por petición de detalle en bloque (límite de ORCID). */
const BULK_SIZE = 100;
/** Tope de obras por ORCID (protege al servidor de perfiles enormes). */
const MAX_WORKS = 600;
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX = 50;

/** Error de ORCID con un mensaje apto para mostrarlo en el panel. */
export class OrcidError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function orcidGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ORCID_API}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 404) {
      throw new OrcidError("Ese ORCID iD no existe o no tiene datos públicos", 404);
    }
    if (!res.ok) {
      throw new OrcidError(`ORCID respondió con un error (${res.status})`, 502);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof OrcidError) throw err;
    if (controller.signal.aborted) {
      throw new OrcidError("ORCID no respondió a tiempo; inténtalo de nuevo", 504);
    }
    throw new OrcidError("No se pudo conectar con ORCID", 502);
  } finally {
    clearTimeout(timer);
  }
}

export interface OrcidRecord {
  orcid: string;
  owner: OrcidOwner;
  works: OrcidWorksResponse;
  /** Detalle de cada obra por put-code (puede faltar alguno). */
  details: Map<number, OrcidWork>;
  /** true si el perfil tenía más obras que MAX_WORKS. */
  truncated: boolean;
}

const cache = new Map<string, { at: number; record: OrcidRecord }>();

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Obras públicas de un ORCID iD (ya validado) con su detalle. Lanza
 * OrcidError si la lista de obras no se puede obtener; si falla el detalle o
 * los datos personales, sigue con lo que haya (autores = titular).
 */
export async function fetchOrcidRecord(
  orcid: string,
  fallbackName: string | null = null,
): Promise<OrcidRecord> {
  const hit = cache.get(orcid);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return {
      ...hit.record,
      owner: { ...hit.record.owner, fallbackName: fallbackName ?? hit.record.owner.fallbackName },
    };
  }

  const [works, personal] = await Promise.all([
    orcidGet<OrcidWorksResponse>(`/${orcid}/works`),
    orcidGet<OrcidPersonalDetails>(`/${orcid}/personal-details`).catch(() => null),
  ]);

  const groups = works.group ?? [];
  const truncated = groups.length > MAX_WORKS;
  const kept: OrcidWorksResponse = { group: groups.slice(0, MAX_WORKS) };

  const putCodes = (kept.group ?? [])
    .map((g) => preferredSummary(g)?.["put-code"])
    .filter((pc): pc is number => typeof pc === "number");

  const details = new Map<number, OrcidWork>();
  for (const part of chunks(putCodes, BULK_SIZE)) {
    try {
      const bulk = await orcidGet<OrcidBulkResponse>(`/${orcid}/works/${part.join(",")}`);
      // La respuesta no respeta el orden pedido: se indexa por put-code.
      for (const item of bulk.bulk ?? []) {
        const pc = item.work?.["put-code"];
        if (item.work && typeof pc === "number") details.set(pc, item.work);
      }
    } catch {
      // Sin detalle: las obras se importan con los datos del resumen.
    }
  }

  const record: OrcidRecord = {
    orcid,
    owner: ownerFromPersonalDetails(orcid, personal, fallbackName),
    works: kept,
    details,
    truncated,
  };

  if (cache.size >= CACHE_MAX) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(orcid, { at: Date.now(), record });
  return record;
}

export interface OrcidFetchResult {
  orcid: string;
  record: OrcidRecord | null;
  /** Mensaje para el panel si no se pudo leer ese ORCID. */
  error: string | null;
}

/**
 * Varios ORCID a la vez, de 3 en 3 (ORCID limita las peticiones por
 * segundo). Los fallos de uno no impiden leer los demás.
 */
export async function fetchOrcidRecords(
  sources: ReadonlyArray<{ orcid: string; name: string | null }>,
  concurrency = 3,
): Promise<OrcidFetchResult[]> {
  const results: OrcidFetchResult[] = new Array(sources.length);
  let next = 0;
  async function worker() {
    while (next < sources.length) {
      const i = next++;
      const { orcid, name } = sources[i];
      try {
        results[i] = { orcid, record: await fetchOrcidRecord(orcid, name), error: null };
      } catch (err) {
        results[i] = {
          orcid,
          record: null,
          error: err instanceof OrcidError ? err.message : "No se pudo consultar ORCID",
        };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, sources.length) }, () => worker()),
  );
  return results;
}
