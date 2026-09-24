/**
 * Últimos artículos de la dirección del IUCE, leídos de la API PÚBLICA de
 * ORCID (pub.orcid.org, sin clave). Cada respuesta se cachea 24 horas con el
 * `revalidate` de fetch, de modo que la banda de Publicaciones se renueva
 * sola cuando la dirección publica algo nuevo, sin cron ni edición manual.
 *
 * Si ORCID no responde, algún miembro no tiene ORCID o no hay resultados,
 * se devuelve null y la página cae a la lista editable del panel
 * (investigacion · list:publicaciones), que queda como reserva.
 */
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locale";

const CARGOS_DIRECCION = ["Directora", "Subdirector", "Secretario Académico"];
const CARGO_EN: Record<string, string> = {
  Directora: "Director",
  Subdirector: "Deputy Director",
  "Secretario Académico": "Academic Secretary",
};

const ORCID_API = "https://pub.orcid.org/v3.0";
const FETCH_OPTS = {
  headers: { Accept: "application/json" },
  next: { revalidate: 86400 }, // 24 h
} as const;

export interface ArticuloDireccion {
  eyebrow: string;
  titulo: string;
  autores: string;
  revista: string;
  enlace: string;
}

/* Formas mínimas de la respuesta de ORCID que se consumen. */
interface OrcidDatePart {
  value?: string;
}
interface OrcidWorkSummary {
  "put-code"?: number;
  title?: { title?: { value?: string } };
  "journal-title"?: { value?: string };
  url?: { value?: string };
  "publication-date"?: {
    year?: OrcidDatePart;
    month?: OrcidDatePart;
    day?: OrcidDatePart;
  };
  "external-ids"?: {
    "external-id"?: Array<{
      "external-id-type"?: string;
      "external-id-value"?: string;
      "external-id-url"?: { value?: string };
    }>;
  };
}
interface OrcidWorks {
  group?: Array<{ "work-summary"?: OrcidWorkSummary[] }>;
}
interface OrcidWorkDetail {
  contributors?: {
    contributor?: Array<{ "credit-name"?: { value?: string } }>;
  };
}

/** Extrae el identificador 0000-0000-0000-0000 de la URL guardada en la ficha. */
function orcidIdFrom(url: string | null): string | null {
  const m = /(\d{4}-\d{4}-\d{4}-[\dX]{4})/.exec(url ?? "");
  return m ? m[1] : null;
}

/** Última obra publicada de un ORCID (título, revista, enlace, autores, año). */
async function latestWorkFor(orcidId: string): Promise<{
  titulo: string;
  revista: string;
  enlace: string;
  autores: string;
  year: number;
} | null> {
  const res = await fetch(`${ORCID_API}/${orcidId}/works`, {
    ...FETCH_OPTS,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as OrcidWorks;
  const summaries = (json.group ?? []).flatMap((g) => g["work-summary"] ?? []);
  const dated = summaries
    .map((s) => {
      const d = s["publication-date"];
      const year = Number(d?.year?.value ?? 0);
      const month = Number(d?.month?.value ?? 1);
      const day = Number(d?.day?.value ?? 1);
      return { s, year, key: year * 10000 + month * 100 + day };
    })
    .filter((x) => x.year > 0)
    .sort((a, b) => b.key - a.key);
  const top = dated[0];
  if (!top) return null;

  const s = top.s;
  const titulo = s.title?.title?.value ?? "";
  if (!titulo) return null;
  const revista = s["journal-title"]?.value ?? "";
  const ids = s["external-ids"]?.["external-id"] ?? [];
  const doi = ids.find((i) => i["external-id-type"] === "doi");
  const enlace =
    doi?.["external-id-url"]?.value ??
    (doi?.["external-id-value"]
      ? `https://doi.org/${doi["external-id-value"]}`
      : (s.url?.value ?? `https://orcid.org/${orcidId}`));

  // Los autores solo están en el detalle de la obra.
  let autores = "";
  const putCode = s["put-code"];
  if (putCode !== undefined) {
    try {
      const det = await fetch(`${ORCID_API}/${orcidId}/work/${putCode}`, {
        ...FETCH_OPTS,
        signal: AbortSignal.timeout(8000),
      });
      if (det.ok) {
        const w = (await det.json()) as OrcidWorkDetail;
        const names = (w.contributors?.contributor ?? [])
          .map((c) => c["credit-name"]?.value)
          .filter((n): n is string => Boolean(n));
        if (names.length > 0) {
          autores =
            names.length > 6
              ? `${names.slice(0, 6).join("; ")} et al.`
              : names.join("; ");
        }
      }
    } catch {
      // sin autores: la tarjeta se muestra igual
    }
  }
  return { titulo, revista, enlace, autores, year: top.year };
}

/**
 * Un artículo (el más reciente) por cada miembro de la dirección con ORCID,
 * en el orden institucional. null si no se pudo obtener ninguno.
 */
export async function getArticulosDireccion(
  locale: Locale,
): Promise<ArticuloDireccion[] | null> {
  try {
    const direccion = await prisma.member.findMany({
      where: { active: true, role: { in: CARGOS_DIRECCION } },
      select: { role: true, orcid: true },
    });
    const ordenada = CARGOS_DIRECCION.flatMap((cargo) => {
      const m = direccion.find((d) => d.role === cargo);
      return m ? [{ cargo, orcid: m.orcid }] : [];
    });

    const items: ArticuloDireccion[] = [];
    for (const d of ordenada) {
      const id = orcidIdFrom(d.orcid);
      if (!id) continue;
      const w = await latestWorkFor(id);
      if (!w) continue;
      const cargo = locale === "en" ? (CARGO_EN[d.cargo] ?? d.cargo) : d.cargo;
      items.push({
        eyebrow: `${cargo} · ${w.year}`,
        titulo: w.titulo,
        autores: w.autores,
        revista: w.revista,
        enlace: w.enlace,
      });
    }
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}
