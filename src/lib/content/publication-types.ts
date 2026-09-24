import type { PublicationType } from "@prisma/client";

/**
 * Rótulos de la tipología de publicaciones (compartidos por la página
 * pública /publicaciones y el panel). El orden es el de los filtros.
 */
export const PUBLICATION_TYPES: ReadonlyArray<{
  value: PublicationType;
  label: string;
  labelEn: string;
  /** Plural para los filtros («Artículos», «Libros»…). */
  plural: string;
  pluralEn: string;
}> = [
  { value: "ARTICLE", label: "Artículo", labelEn: "Article", plural: "Artículos", pluralEn: "Articles" },
  { value: "BOOK", label: "Libro", labelEn: "Book", plural: "Libros", pluralEn: "Books" },
  { value: "CHAPTER", label: "Capítulo de libro", labelEn: "Book chapter", plural: "Capítulos", pluralEn: "Chapters" },
  { value: "CONFERENCE", label: "Congreso", labelEn: "Conference paper", plural: "Congresos", pluralEn: "Conference papers" },
  { value: "THESIS", label: "Tesis", labelEn: "Thesis", plural: "Tesis", pluralEn: "Theses" },
  { value: "OTHER", label: "Otros", labelEn: "Other", plural: "Otros", pluralEn: "Other" },
];

export function publicationTypeLabel(
  type: PublicationType,
  locale: "es" | "en",
): string {
  const t = PUBLICATION_TYPES.find((p) => p.value === type);
  if (!t) return type;
  return locale === "en" ? t.labelEn : t.label;
}

/** Normaliza un DOI (sin prefijo https://doi.org/ ni «doi:»), en minúsculas. */
export function normalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const doi = raw
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim()
    .toLowerCase();
  return /^10\.\d{4,9}\/\S+$/.test(doi) ? doi : null;
}

/** Enlace resoluble de un DOI. */
export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}
