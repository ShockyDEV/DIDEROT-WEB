import { doiUrl } from "@/lib/content/publication-types";
import { pick, type Locale } from "@/lib/locale";
import type { PublicPublication } from "@/lib/publications-service";

/**
 * Utilidades de presentación de una referencia bibliográfica, compartidas
 * por el listado de /publicaciones y las tarjetas de la portada.
 */

/** Punto final solo si el texto no acaba ya en puntuación («¿…?», «…!»). */
export function withPeriod(text: string): string {
  return /[.?!…]["”»')\]]?$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

/**
 * Autores tal cual los guarda el panel («A; B; C»). Con más de 20 (grandes
 * consorcios) se abrevia con «et al.», como hace APA 7.
 */
export function formatAuthors(authors: string): string {
  const list = authors
    .split(";")
    .map((a) => a.trim())
    .filter(Boolean);
  if (list.length > 20) return `${list.slice(0, 19).join("; ")} et al.`;
  return list.join("; ");
}

/** Enlaces de una publicación: DOI y, si es otra dirección, su URL. */
export function publicationLinks(pub: PublicPublication): {
  doiHref: string | null;
  url: string | null;
} {
  const doiHref = pub.doi ? doiUrl(pub.doi) : null;
  const sameAsDoi =
    pub.url && doiHref
      ? pub.url.replace(/^https?:\/\/(dx\.)?/i, "").toLowerCase() ===
        doiHref.replace(/^https?:\/\//i, "").toLowerCase()
      : false;
  return { doiHref, url: sameAsDoi ? null : pub.url };
}

/** Rótulo del enlace según el sitio: «Ver en eusal.es», «Ficha en el Portal USAL». */
export function urlLabel(url: string, locale: Locale): string {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return pick(locale, "Ver la publicación", "View the publication");
  }
  if (host === "produccioncientifica.usal.es") {
    return pick(locale, "Ficha en el Portal USAL", "Record on the USAL Portal");
  }
  if (host === "gredos.usal.es") {
    return pick(locale, "Ver en GREDOS (USAL)", "View on GREDOS (USAL)");
  }
  if (host === "hdl.handle.net") {
    return pick(locale, "Ver en el repositorio", "View in the repository");
  }
  return pick(locale, `Ver en ${host}`, `View on ${host}`);
}

/** Primer enlace útil de una publicación (tarjetas de la portada). */
export function primaryHref(pub: PublicPublication): string | null {
  const { doiHref, url } = publicationLinks(pub);
  return doiHref ?? url;
}
