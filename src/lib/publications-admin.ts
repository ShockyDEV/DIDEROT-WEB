import type { Prisma, Publication } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PublicationListQuery } from "@/lib/admin-schemas";

/**
 * Listado paginado de publicaciones para el panel (página y API). La
 * búsqueda ignora mayúsculas y TILDES («gonzalez» encuentra «González»):
 * PostgreSQL no lo hace sin la extensión unaccent, así que el texto se
 * filtra aquí sobre una selección ligera y luego se pagina por id. Para el
 * volumen de un grupo de investigación (cientos de registros) es inmediato.
 */

export const PUBLICATIONS_PAGE_SIZE = 50;

/** Minúsculas y sin diacríticos, para comparar textos. */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function filtersWhere(query: PublicationListQuery): Prisma.PublicationWhereInput {
  const and: Prisma.PublicationWhereInput[] = [];
  if (query.type) and.push({ type: query.type });
  if (query.year) and.push({ year: query.year });
  if (query.visible === "visible") and.push({ published: true });
  if (query.visible === "hidden") and.push({ published: false });
  if (query.visible === "featured") and.push({ featured: true });
  if (query.source) and.push({ source: query.source });
  return and.length > 0 ? { AND: and } : {};
}

export interface PublicationListResult {
  items: Publication[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

export async function listPublications(
  query: PublicationListQuery,
): Promise<PublicationListResult> {
  let where = filtersWhere(query);

  const terms = foldText(query.q ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length > 0) {
    const pool = await prisma.publication.findMany({
      where,
      select: { id: true, title: true, authors: true, venue: true, doi: true, year: true },
    });
    const ids = pool
      .filter((p) => {
        const haystack = foldText(
          `${p.title} ${p.authors} ${p.venue ?? ""} ${p.doi ?? ""} ${p.year}`,
        );
        return terms.every((t) => haystack.includes(t));
      })
      .map((p) => p.id);
    where = { AND: [where, { id: { in: ids } }] };
  }

  const total = await prisma.publication.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PUBLICATIONS_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const items = await prisma.publication.findMany({
    where,
    orderBy: [{ year: "desc" }, { title: "asc" }],
    skip: (page - 1) * PUBLICATIONS_PAGE_SIZE,
    take: PUBLICATIONS_PAGE_SIZE,
  });

  return { items, total, page, pageCount, pageSize: PUBLICATIONS_PAGE_SIZE };
}
