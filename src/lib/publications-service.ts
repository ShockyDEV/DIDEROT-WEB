import type { Publication, PublicationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PUBLICATION_TYPES,
  normalizeDoi,
} from "@/lib/content/publication-types";
import { safeHttpUrl } from "@/lib/members-service";

/**
 * Lecturas públicas de la producción científica (/publicaciones y portada).
 * Las publicaciones se dan de alta en el panel o se importan de ORCID; aquí
 * solo se leen las marcadas como publicadas (`published`).
 *
 * Todas las funciones toleran la BD caída (listas vacías / cero) para que
 * la página pinte su estado vacío en vez de romperse.
 */

/** Publicación lista para pintar: textos limpios y enlaces saneados. */
export interface PublicPublication {
  id: string;
  title: string;
  authors: string;
  year: number;
  type: PublicationType;
  venue: string | null;
  details: string | null;
  /** DOI normalizado, sin prefijo (10.xxxx/…). */
  doi: string | null;
  url: string | null;
  abstract: string | null;
  openAccess: boolean;
  featured: boolean;
}

/**
 * Valor de cada tipo en la URL (?tipo=articulo). En español también en /en,
 * como las categorías de Noticias: la URL es un identificador, no un texto.
 */
export const PUBLICATION_TYPE_SLUGS: Record<PublicationType, string> = {
  ARTICLE: "articulo",
  BOOK: "libro",
  CHAPTER: "capitulo",
  CONFERENCE: "congreso",
  THESIS: "tesis",
  OTHER: "otros",
};

/** Tipo a partir del parámetro ?tipo= (slug o valor del enum); null si no vale. */
export function parsePublicationType(
  raw: string | null | undefined,
): PublicationType | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  const hit = PUBLICATION_TYPES.find(
    (t) =>
      PUBLICATION_TYPE_SLUGS[t.value] === value ||
      t.value.toLowerCase() === value,
  );
  return hit ? hit.value : null;
}

export interface PublicationFilters {
  type: PublicationType | null;
  year: number | null;
  /** Texto libre (título, autores o revista/editorial). */
  q: string;
}

export interface PublicationSearch {
  /** Publicaciones de la página pedida. */
  items: PublicPublication[];
  /** Cuántas cumplen TODOS los filtros. */
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  /** Recuento por tipo con los filtros de año y texto (chips con contador). */
  typeCounts: Partial<Record<PublicationType, number>>;
  /** Total del chip «Todas» (filtros de año y texto, sin tipo). */
  allTypesCount: number;
  /** Años con publicaciones (filtros de tipo y texto), del más reciente. */
  yearCounts: Array<{ year: number; count: number }>;
  /** Publicadas en total, sin filtros (distingue «catálogo vacío» de «sin resultados»). */
  grandTotal: number;
  /** La BD no respondió. */
  unavailable: boolean;
}

/** Comparación sin tildes ni mayúsculas (la búsqueda es «merchan» = «Merchán»). */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Carácter de una entidad numérica (&#233; / &#xE9;); espacio si no es válida. */
function fromCodePoint(code: number): string {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff
    ? String.fromCodePoint(code)
    : " ";
}

/**
 * Texto plano a partir de lo que llega de ORCID/Crossref: quita etiquetas
 * (JATS, <i>…) y decodifica entidades básicas. React lo pinta como texto,
 * así que nada de esto puede inyectar HTML.
 */
function plainText(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?\/?>/gi, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      const lower = code.toLowerCase();
      if (lower.startsWith("#x")) return fromCodePoint(parseInt(lower.slice(2), 16));
      if (lower.startsWith("#")) return fromCodePoint(parseInt(lower.slice(1), 10));
      return ENTITIES[lower] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function toPublic(p: Publication): PublicPublication {
  return {
    id: p.id,
    title: plainText(p.title) ?? p.title,
    authors: plainText(p.authors) ?? "",
    year: p.year,
    type: p.type,
    venue: plainText(p.venue),
    details: plainText(p.details),
    doi: normalizeDoi(p.doi),
    url: safeHttpUrl(p.url),
    abstract: plainText(p.abstract),
    openAccess: p.openAccess,
    featured: p.featured,
  };
}

// Orden del listado: año descendente; dentro del año, las destacadas primero.
const ORDER = [
  { year: "desc" as const },
  { featured: "desc" as const },
  { title: "asc" as const },
];

/**
 * Listado filtrado y paginado para /publicaciones, con las facetas de los
 * filtros. Se filtra en memoria sobre un índice ligero (id, título, autores,
 * revista, año, tipo) para que la búsqueda ignore tildes —Postgres no lo
 * hace sin la extensión unaccent— y solo se cargan completas las de la
 * página actual. Con los cientos de referencias de un grupo, sobra.
 */
export async function searchPublications(
  filters: PublicationFilters,
  page: number,
  pageSize = 20,
): Promise<PublicationSearch> {
  const empty: PublicationSearch = {
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    pageSize,
    typeCounts: {},
    allTypesCount: 0,
    yearCounts: [],
    grandTotal: 0,
    unavailable: false,
  };
  try {
    const index = await prisma.publication.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        authors: true,
        venue: true,
        year: true,
        type: true,
      },
      orderBy: ORDER,
    });

    // Todas las palabras buscadas deben aparecer (en cualquier orden).
    const terms = normalize(filters.q).split(/\s+/).filter(Boolean);
    const byText =
      terms.length === 0
        ? index
        : index.filter((p) => {
            const hay = normalize(`${p.title} ${p.authors} ${p.venue ?? ""}`);
            return terms.every((term) => hay.includes(term));
          });

    // Facetas: cada filtro cuenta con los DEMÁS filtros aplicados, así el
    // contador de un chip dice cuántas verías al pulsarlo.
    const typeCounts: Partial<Record<PublicationType, number>> = {};
    const years = new Map<number, number>();
    for (const p of byText) {
      if (filters.year === null || p.year === filters.year) {
        typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;
      }
      if (filters.type === null || p.type === filters.type) {
        years.set(p.year, (years.get(p.year) ?? 0) + 1);
      }
    }
    const allTypesCount = Object.values(typeCounts).reduce(
      (sum, n) => sum + (n ?? 0),
      0,
    );

    const matching = byText.filter(
      (p) =>
        (filters.type === null || p.type === filters.type) &&
        (filters.year === null || p.year === filters.year),
    );
    const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
    const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
    const pageIds = matching
      .slice((current - 1) * pageSize, current * pageSize)
      .map((p) => p.id);

    const rows =
      pageIds.length > 0
        ? await prisma.publication.findMany({ where: { id: { in: pageIds } } })
        : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items = pageIds.flatMap((id) => {
      const row = byId.get(id);
      return row ? [toPublic(row)] : [];
    });

    return {
      items,
      total: matching.length,
      page: current,
      totalPages,
      pageSize,
      typeCounts,
      allTypesCount,
      yearCounts: [...years.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([year, count]) => ({ year, count })),
      grandTotal: index.length,
      unavailable: false,
    };
  } catch {
    return { ...empty, unavailable: true };
  }
}

/** Publicaciones destacadas (portada), las más recientes primero. */
export async function getFeaturedPublications(
  limit = 3,
): Promise<PublicPublication[]> {
  try {
    const rows = await prisma.publication.findMany({
      where: { published: true, featured: true },
      orderBy: ORDER,
      take: limit,
    });
    return rows.map(toPublic);
  } catch {
    return [];
  }
}

/** Número de publicaciones visibles (cifras de la portada). */
export async function countPublishedPublications(): Promise<number> {
  try {
    return await prisma.publication.count({ where: { published: true } });
  } catch {
    return 0;
  }
}
