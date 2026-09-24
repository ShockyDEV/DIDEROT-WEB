/**
 * Importación de publicaciones desde ORCID: funciones PURAS (sin red ni BD)
 * que convierten la respuesta de la API pública de ORCID v3.0 en
 * publicaciones del panel y deciden cuáles ya existen. La descarga vive en
 * src/lib/orcid.ts; aquí solo hay datos → datos, con tests en
 * src/lib/__tests__/orcid-import.test.ts.
 *
 * Seguro también en el cliente (el panel valida los ORCID iD al escribirlos).
 */
import { normalizeDoi } from "@/lib/content/publication-types";
import type { PublicationTypeValue } from "@/lib/admin-options";

/* ── ORCID iD ───────────────────────────────────────────────────────────── */

const ORCID_ID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/**
 * Dígito de control de un ORCID iD (ISO 7064 MOD 11-2) a partir de sus
 * 15 primeros dígitos. «10» se escribe «X».
 */
export function orcidCheckDigit(base15: string): string {
  let total = 0;
  for (const ch of base15) total = (total + Number(ch)) * 2;
  const result = (12 - (total % 11)) % 11;
  return result === 10 ? "X" : String(result);
}

/** ¿Es un ORCID iD bien formado y con el dígito de control correcto? */
export function isValidOrcidId(id: string): boolean {
  if (!ORCID_ID_RE.test(id)) return false;
  const digits = id.replace(/-/g, "");
  return orcidCheckDigit(digits.slice(0, 15)) === digits[15];
}

/**
 * Extrae un ORCID iD válido de lo que se pegue en el panel: el iD suelto
 * («0000-0003-1828-5182»), la URL («https://orcid.org/0000-…») o los 16
 * caracteres sin guiones. Devuelve el iD normalizado o null.
 */
export function parseOrcidId(input: string | null | undefined): string | null {
  if (!input) return null;
  const m =
    /^(?:https?:\/\/)?(?:www\.)?(?:orcid\.org\/)?(\d{4})-?(\d{4})-?(\d{4})-?(\d{3}[\dXx])\/?$/.exec(
      input.trim(),
    );
  if (!m) return null;
  const id = `${m[1]}-${m[2]}-${m[3]}-${m[4].toUpperCase()}`;
  return isValidOrcidId(id) ? id : null;
}

/** URL canónica de un ORCID iD (formato con el que se guarda en el equipo). */
export function orcidUrl(id: string): string {
  return `https://orcid.org/${id}`;
}

/* ── Forma (mínima) de la respuesta de la API pública v3.0 ──────────────── */

interface OrcidValue {
  value?: string | null;
}

export interface OrcidExternalId {
  "external-id-type"?: string | null;
  "external-id-value"?: string | null;
  "external-id-normalized"?: OrcidValue | null;
  "external-id-url"?: OrcidValue | null;
  "external-id-relationship"?: string | null;
}

export interface OrcidExternalIds {
  "external-id"?: OrcidExternalId[] | null;
}

export interface OrcidWorkSummary {
  "put-code"?: number | null;
  title?: {
    title?: OrcidValue | null;
    subtitle?: OrcidValue | null;
  } | null;
  "external-ids"?: OrcidExternalIds | null;
  url?: OrcidValue | null;
  type?: string | null;
  "publication-date"?: {
    year?: OrcidValue | null;
    month?: OrcidValue | null;
    day?: OrcidValue | null;
  } | null;
  "journal-title"?: OrcidValue | null;
  "display-index"?: string | null;
}

export interface OrcidWorkGroup {
  "external-ids"?: OrcidExternalIds | null;
  "work-summary"?: OrcidWorkSummary[] | null;
}

/** GET /v3.0/{orcid}/works */
export interface OrcidWorksResponse {
  group?: OrcidWorkGroup[] | null;
}

export interface OrcidContributor {
  "contributor-orcid"?: { path?: string | null; uri?: string | null } | null;
  "credit-name"?: OrcidValue | null;
  "contributor-attributes"?: {
    "contributor-sequence"?: string | null;
    "contributor-role"?: string | null;
  } | null;
}

/** Detalle de una obra (cada elemento de /v3.0/{orcid}/works/{put-codes}). */
export interface OrcidWork extends OrcidWorkSummary {
  "short-description"?: string | null;
  contributors?: { contributor?: OrcidContributor[] | null } | null;
}

/** GET /v3.0/{orcid}/works/{pc1,pc2,…} (máx. 100 put-codes). */
export interface OrcidBulkResponse {
  bulk?: Array<{ work?: OrcidWork | null; error?: unknown }> | null;
}

/** GET /v3.0/{orcid}/personal-details */
export interface OrcidPersonalDetails {
  name?: {
    "given-names"?: OrcidValue | null;
    "family-name"?: OrcidValue | null;
    "credit-name"?: OrcidValue | null;
  } | null;
}

/** Titular del ORCID que se importa (para formatear su nombre). */
export interface OrcidOwner {
  orcid: string;
  given: string | null;
  family: string | null;
  /** Nombre de la ficha del equipo, si el ORCID es de un miembro. */
  fallbackName: string | null;
}

export function ownerFromPersonalDetails(
  orcid: string,
  details: OrcidPersonalDetails | null | undefined,
  fallbackName: string | null = null,
): OrcidOwner {
  const given = cleanText(details?.name?.["given-names"]?.value ?? "") || null;
  const family = cleanText(details?.name?.["family-name"]?.value ?? "") || null;
  return { orcid, given, family, fallbackName };
}

/* ── Limpieza de textos ─────────────────────────────────────────────────── */

/**
 * Repara el «mojibake» típico de algunos depósitos (UTF-8 leído como
 * Latin-1: «GonzÃ¡lez» → «González»). Si el texto no lo parece o no se
 * puede reinterpretar, se devuelve tal cual.
 */
export function fixMojibake(text: string): string {
  if (!/[Â-ô][\u0080-¿]/.test(text)) return text;
  if (/[^\u0000-ÿ]/.test(text)) return text; // ya hay caracteres >U+00FF
  try {
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return text;
  }
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Texto plano limpio: sin etiquetas (Crossref mete <i>, <sub>, JATS…), con
 * las entidades decodificadas, sin mojibake y con los espacios colapsados.
 */
export function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  const noTags = value.replace(/<[^>]*>/g, " ");
  const decoded = noTags.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ref: string) => {
    if (ref[0] === "#") {
      const code =
        ref[1].toLowerCase() === "x" ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : "";
    }
    return ENTITIES[ref.toLowerCase()] ?? m;
  });
  return fixMojibake(decoded).replace(/\s+/g, " ").trim();
}

/**
 * Título normalizado para comparar publicaciones: minúsculas, sin tildes,
 * sin puntuación ni etiquetas y con espacios simples.
 */
export function normalizeTitle(title: string): string {
  return cleanText(title)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/* ── Tipos de obra ──────────────────────────────────────────────────────── */

const TYPE_MAP: Record<string, PublicationTypeValue> = {
  "journal-article": "ARTICLE",
  book: "BOOK",
  "edited-book": "BOOK",
  "book-chapter": "CHAPTER",
  "conference-paper": "CONFERENCE",
  "conference-abstract": "CONFERENCE",
  "conference-poster": "CONFERENCE",
  "dissertation-thesis": "THESIS",
  dissertation: "THESIS", // nombre antiguo (API 2.x)
};

/** Tipo de ORCID («journal-article», «book-chapter»…) → tipo del panel. */
export function mapOrcidType(type: string | null | undefined): PublicationTypeValue {
  return TYPE_MAP[(type ?? "").trim().toLowerCase().replace(/_/g, "-")] ?? "OTHER";
}

/* ── Autores ────────────────────────────────────────────────────────────── */

/** Partículas que forman parte del apellido («de la Fuente», «van Dijk»). */
const PARTICLES = new Set([
  "de", "del", "la", "las", "los", "da", "das", "do", "dos", "di", "du",
  "van", "von", "der", "den", "ter", "le", "della", "degli", "dei",
  "y", "i", "e",
]);
/** Conjunciones de apellidos compuestos («Ortega y Gasset»). */
const CONJUNCTIONS = new Set(["y", "i", "e"]);

/** Máximo de autores que se guardan; el resto se resume con «et al.». */
const MAX_AUTHORS = 40;

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * ¿Es un bloque de iniciales pegadas («J», «JF»)? Solo 1-2 mayúsculas y,
 * si son dos, sin vocales: «XU» o «LI» son apellidos o nombres, no iniciales.
 */
function isInitialsBlock(word: string): boolean {
  return (
    /^\p{Lu}{1,2}$/u.test(word) &&
    (word.length === 1 || !/[AEIOUÁÉÍÓÚÜ]/.test(word))
  );
}

/** Palabras normalizadas (sin tildes ni signos) para comparar nombres. */
function nameTokens(text: string): string[] {
  return normalizeTitle(text).split(" ").filter(Boolean);
}

/** Iniciales de los nombres de pila: «Javier Félix» → «J. F.», «Jean-Pierre» → «J.-P.». */
export function initialsOf(given: string): string {
  return words(cleanText(given))
    .filter((w) => !PARTICLES.has(w.toLowerCase()))
    .map((w) => {
      // «JF» o «J.F.» ya son iniciales
      if (isInitialsBlock(w)) return [...w].map((l) => `${l}.`).join(" ");
      if (/^(\p{L}\.){2,}$/u.test(w)) {
        return w.split(".").filter(Boolean).map((l) => `${l.toUpperCase()}.`).join(" ");
      }
      return w
        .split("-")
        .map((part) => {
          const letter = /\p{L}/u.exec(part)?.[0];
          return letter ? `${letter.toUpperCase()}.` : "";
        })
        .filter(Boolean)
        .join("-");
    })
    .filter(Boolean)
    .join(" ");
}

/** «Apellidos, N.» a partir de nombre y apellidos por separado. */
export function formatPersonName(given: string | null, family: string | null): string {
  const f = cleanText(family ?? "");
  const initials = initialsOf(given ?? "");
  if (f && initials) return `${f}, ${initials}`;
  return f || cleanText(given ?? "");
}

export type NameOrder = "given-first" | "family-first";

/**
 * Da formato «Apellidos, N.» a un nombre tal como viene en ORCID. Casos:
 * - «Apellidos, Nombre» (con coma): el orden es explícito.
 * - «Merchán JF» (iniciales en mayúsculas al final): apellido + iniciales.
 * - «Nombre Apellido» (lo habitual): el apellido es la última palabra junto
 *   con sus partículas («María de la Fuente» → «de la Fuente, M.»).
 * - «Apellidos Nombre» si `order` es "family-first" (algunas editoriales).
 * Los apellidos dobles sin guion («Sara González Gutiérrez») no se pueden
 * distinguir de dos nombres de pila: se revisan después en el panel.
 */
export function formatAuthorName(raw: string, order: NameOrder = "given-first"): string {
  const name = cleanText(raw);
  if (!name) return "";
  if (name.includes(",")) {
    const [family, ...rest] = name.split(",");
    return formatPersonName(rest.join(" "), family);
  }
  const tokens = words(name);
  if (tokens.length === 1) return tokens[0];

  const last = tokens[tokens.length - 1];
  if (isInitialsBlock(last) && !isInitialsBlock(tokens[0])) {
    return formatPersonName(last, tokens.slice(0, -1).join(" "));
  }
  if (order === "family-first") {
    return formatPersonName(last, tokens.slice(0, -1).join(" "));
  }

  let i = tokens.length - 1;
  while (i > 1 && PARTICLES.has(tokens[i - 1].toLowerCase())) {
    i--;
    if (CONJUNCTIONS.has(tokens[i].toLowerCase()) && i > 1) i--;
  }
  return formatPersonName(tokens.slice(0, i).join(" "), tokens.slice(i).join(" "));
}

/** ¿Este contribuidor es el titular del ORCID? (por iD o por su nombre) */
function isOwnerContributor(
  contributor: OrcidContributor,
  creditName: string,
  owner: OrcidOwner,
): boolean {
  const path = contributor["contributor-orcid"]?.path;
  if (path && path === owner.orcid) return true;
  if (!owner.family) return false;
  const credit = new Set(nameTokens(creditName));
  const family = nameTokens(owner.family);
  if (family.length === 0 || !family.every((t) => credit.has(t))) return false;
  const initial = nameTokens(owner.given ?? "")[0]?.[0];
  if (!initial) return true;
  return [...credit].some((t) => !family.includes(t) && t.startsWith(initial));
}

/**
 * Orden de los nombres en una obra, deducido de cómo aparece el titular:
 * si su nombre empieza por su apellido («Merchán Sánchez-Jara Javier»), la
 * editorial escribe «Apellidos Nombre» y así se leen también los coautores.
 */
function detectOrder(ownerCredit: string, owner: OrcidOwner): NameOrder {
  if (ownerCredit.includes(",") || !owner.family) return "given-first";
  const first = nameTokens(words(ownerCredit)[0] ?? "");
  const family = nameTokens(owner.family);
  return first.length > 0 && first.every((t) => family.includes(t))
    ? "family-first"
    : "given-first";
}

/** Nombre del titular para cuando la obra no trae contribuidores. */
export function ownerDisplayName(owner: OrcidOwner | null): string {
  if (!owner) return "";
  if (owner.family) return formatPersonName(owner.given, owner.family);
  return cleanText(owner.fallbackName ?? "");
}

/**
 * Lista de autores «Apellidos, N.; Apellidos, N.» a partir de los
 * contribuidores de ORCID (solo los de rol autor si los hay: en un capítulo
 * los editores del libro no son autores). Sin contribuidores, el titular.
 */
export function formatContributors(
  contributors: OrcidContributor[] | null | undefined,
  owner: OrcidOwner | null,
): string {
  const named = (contributors ?? [])
    .map((c) => ({ c, name: cleanText(c["credit-name"]?.value ?? "") }))
    .filter((x) => x.name !== "");
  if (named.length === 0) return ownerDisplayName(owner);

  const authors = named.filter(({ c }) => {
    const role = c["contributor-attributes"]?.["contributor-role"]?.toLowerCase();
    return !role || role === "author";
  });
  const people = authors.length > 0 ? authors : named;

  const ownerIdx = owner
    ? people.findIndex(({ c, name }) => isOwnerContributor(c, name, owner))
    : -1;
  const order =
    owner && ownerIdx >= 0 ? detectOrder(people[ownerIdx].name, owner) : "given-first";

  const out: string[] = [];
  const seen = new Set<string>();
  people.forEach(({ name }, idx) => {
    const formatted =
      idx === ownerIdx && owner?.family
        ? formatPersonName(owner.given, owner.family)
        : formatAuthorName(name, order);
    const key = normalizeTitle(formatted);
    if (!formatted || seen.has(key)) return;
    seen.add(key);
    out.push(formatted);
  });

  if (out.length > MAX_AUTHORS) {
    return `${out.slice(0, MAX_AUTHORS).join("; ")} et al.`;
  }
  return out.join("; ");
}

/* ── De ORCID a candidatas ──────────────────────────────────────────────── */

export interface OrcidCandidate {
  /** «<orcid>:<put-code>» (se guarda en Publication.orcidPutCode). */
  key: string;
  orcid: string;
  putCode: number;
  /** Put-codes de todas las versiones de la misma obra en ese ORCID. */
  groupPutCodes: number[];
  title: string;
  authors: string;
  year: number | null;
  type: PublicationTypeValue;
  /** Tipo original de ORCID (informativo en la vista previa). */
  orcidType: string | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
}

/**
 * Versión preferida de una obra: ORCID agrupa las copias de distintas
 * fuentes (Crossref, la editorial…); la de mayor display-index es la que el
 * titular ha elegido mostrar.
 */
export function preferredSummary(group: OrcidWorkGroup): OrcidWorkSummary | null {
  const list = (group["work-summary"] ?? []).filter(
    (s) => typeof s["put-code"] === "number",
  );
  let best: OrcidWorkSummary | null = null;
  let bestIndex = -Infinity;
  for (const s of list) {
    const idx = Number(s["display-index"] ?? 0) || 0;
    if (idx > bestIndex) {
      best = s;
      bestIndex = idx;
    }
  }
  return best;
}

/**
 * DOIs propios de la obra (relación «self»). Se descartan los «part-of»:
 * son del libro o la revista que la contiene y harían coincidir capítulos
 * distintos de un mismo libro.
 */
export function selfDois(...sources: Array<OrcidExternalIds | null | undefined>): string[] {
  const out: string[] = [];
  for (const source of sources) {
    for (const id of source?.["external-id"] ?? []) {
      if ((id["external-id-type"] ?? "").toLowerCase() !== "doi") continue;
      const rel = (id["external-id-relationship"] ?? "self").toLowerCase();
      if (rel !== "self") continue;
      const doi =
        normalizeDoi(id["external-id-normalized"]?.value) ??
        normalizeDoi(id["external-id-value"]) ??
        normalizeDoi(id["external-id-url"]?.value);
      if (doi && !out.includes(doi)) out.push(doi);
    }
  }
  return out;
}

function httpUrlOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const href = u.toString();
    return href.length <= 500 ? href : null;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function yearOf(work: OrcidWorkSummary | null | undefined): number | null {
  const year = Number.parseInt(work?.["publication-date"]?.year?.value ?? "", 10);
  return Number.isInteger(year) && year > 0 ? year : null;
}

/**
 * Candidatas a importar de un ORCID: una por obra (grupo), con los datos
 * del detalle cuando lo hay (autores, resumen) y los del resumen si no.
 * Ordenadas de la más reciente a la más antigua.
 */
export function buildCandidates(
  orcid: string,
  works: OrcidWorksResponse | null | undefined,
  details: ReadonlyMap<number, OrcidWork>,
  owner: OrcidOwner | null,
): OrcidCandidate[] {
  const out: OrcidCandidate[] = [];
  for (const group of works?.group ?? []) {
    const summary = preferredSummary(group);
    if (!summary) continue;
    const putCode = summary["put-code"] as number;
    const detail = details.get(putCode);
    const work: OrcidWorkSummary = detail ?? summary;

    const baseTitle = cleanText(work.title?.title?.value ?? summary.title?.title?.value);
    if (!baseTitle) continue;
    const subtitle = cleanText(work.title?.subtitle?.value);
    const title =
      subtitle && !normalizeTitle(baseTitle).endsWith(normalizeTitle(subtitle))
        ? `${baseTitle}: ${subtitle}`
        : baseTitle;

    const doi = selfDois(work["external-ids"], summary["external-ids"], group["external-ids"])[0] ?? null;
    const venue = cleanText(work["journal-title"]?.value ?? summary["journal-title"]?.value);
    const abstract = cleanText(detail?.["short-description"]);
    const orcidType = (work.type ?? summary.type ?? "").trim() || null;

    out.push({
      key: `${orcid}:${putCode}`,
      orcid,
      putCode,
      groupPutCodes: (group["work-summary"] ?? [])
        .map((s) => s["put-code"])
        .filter((pc): pc is number => typeof pc === "number"),
      title: truncate(title, 1000),
      authors: truncate(formatContributors(detail?.contributors?.contributor, owner), 4000),
      year: yearOf(work) ?? yearOf(summary),
      type: mapOrcidType(orcidType),
      orcidType,
      venue: venue ? truncate(venue, 500) : null,
      doi,
      url: httpUrlOrNull(work.url?.value ?? summary.url?.value),
      abstract: abstract ? truncate(abstract, 10_000) : null,
    });
  }
  return out.sort(
    (a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title, "es"),
  );
}

/* ── Deduplicación ──────────────────────────────────────────────────────── */

/** Lo mínimo de una publicación del panel para compararla. */
export interface ExistingPublication {
  id: string;
  title: string;
  year: number;
  doi: string | null;
  orcidPutCode: string | null;
}

export type CandidateStatus =
  | "new" // no está: se marca para importar
  | "exists" // ya está en el panel (mismo DOI, put-code o título + año)
  | "possible-duplicate" // título casi igual y año ±1: lo decide la administración
  | "batch-duplicate" // repetida en esta misma importación (p. ej. coautores)
  | "incomplete"; // sin año válido: no se puede importar

export interface ClassifiedCandidate extends OrcidCandidate {
  status: CandidateStatus;
  reason: string | null;
  /** Publicación del panel con la que coincide (si la hay). */
  match: { id: string; title: string } | null;
  importable: boolean;
  /** Marcada por defecto en la vista previa. */
  selected: boolean;
}

/** Longitud mínima para considerar coincidencia por prefijo del título. */
const MIN_PREFIX = 30;

function similarTitle(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= MIN_PREFIX && long.startsWith(short);
}

function quoted(title: string): string {
  return `«${truncate(title, 80)}»`;
}

/**
 * Clasifica las candidatas frente a las publicaciones del panel (de
 * cualquier procedencia: manual, ORCID o Portal USAL) y entre sí, en orden:
 * la primera aparición de una obra repetida en el lote es la que cuenta.
 */
export function classifyCandidates(
  candidates: readonly OrcidCandidate[],
  existing: readonly ExistingPublication[],
  currentYear = new Date().getFullYear(),
): ClassifiedCandidate[] {
  const byDoi = new Map<string, ExistingPublication>();
  const byPutCode = new Map<string, ExistingPublication>();
  const byTitleYear = new Map<string, ExistingPublication>();
  const normalized = existing.map((p) => ({ p, title: normalizeTitle(p.title) }));
  for (const { p, title } of normalized) {
    const doi = normalizeDoi(p.doi);
    if (doi) byDoi.set(doi, p);
    if (p.orcidPutCode) byPutCode.set(p.orcidPutCode, p);
    if (title) byTitleYear.set(`${title}|${p.year}`, p);
  }

  const batchDoi = new Set<string>();
  const batchTitleYear = new Set<string>();

  return candidates.map((c) => {
    const title = normalizeTitle(c.title);
    const titleYear = c.year !== null && title ? `${title}|${c.year}` : null;
    let status: CandidateStatus = "new";
    let reason: string | null = null;
    let match: ExistingPublication | null = null;

    const byGroup = c.groupPutCodes
      .map((pc) => byPutCode.get(`${c.orcid}:${pc}`))
      .find((p): p is ExistingPublication => Boolean(p));

    if (c.year === null || c.year < 1900 || c.year > currentYear + 1) {
      status = "incomplete";
      reason =
        c.year === null
          ? "ORCID no indica el año de publicación"
          : `Año fuera de rango (${c.year})`;
    } else if (c.doi && byDoi.has(c.doi)) {
      status = "exists";
      match = byDoi.get(c.doi) ?? null;
      reason = "Ya está en el panel (mismo DOI)";
    } else if (byPutCode.has(c.key) || byGroup) {
      status = "exists";
      match = byPutCode.get(c.key) ?? byGroup ?? null;
      reason = "Ya se importó desde este ORCID";
    } else if (titleYear && byTitleYear.has(titleYear)) {
      status = "exists";
      match = byTitleYear.get(titleYear) ?? null;
      reason = "Ya está en el panel (mismo título y año)";
    } else if (c.doi && batchDoi.has(c.doi)) {
      status = "batch-duplicate";
      reason = "Repetida en esta importación (mismo DOI)";
    } else if (titleYear && batchTitleYear.has(titleYear)) {
      status = "batch-duplicate";
      reason = "Repetida en esta importación (mismo título y año)";
    } else if (title && c.year !== null) {
      const year = c.year;
      const similar = normalized.find(
        (e) => Math.abs(e.p.year - year) <= 1 && similarTitle(e.title, title),
      );
      if (similar) {
        status = "possible-duplicate";
        match = similar.p;
        reason = `Posible duplicado de ${quoted(similar.p.title)} (${similar.p.year})`;
      }
    }

    if (c.doi) batchDoi.add(c.doi);
    if (titleYear) batchTitleYear.add(titleYear);

    const importable = status === "new" || status === "possible-duplicate";
    return {
      ...c,
      status,
      reason,
      match: match ? { id: match.id, title: match.title } : null,
      importable,
      selected: status === "new",
    };
  });
}

/** Datos de Prisma para crear la publicación importada. */
export function toPublicationData(c: OrcidCandidate) {
  return {
    title: c.title,
    authors: c.authors,
    year: c.year ?? 0,
    type: c.type,
    venue: c.venue,
    details: null,
    doi: c.doi,
    url: c.url,
    abstract: c.abstract,
    openAccess: false,
    featured: false,
    published: true,
    source: "orcid",
    orcidPutCode: c.key,
  };
}
