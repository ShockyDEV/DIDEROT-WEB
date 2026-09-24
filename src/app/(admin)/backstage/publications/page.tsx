import { prisma } from "@/lib/prisma";
import { publicationListQuerySchema } from "@/lib/admin-schemas";
import { listPublications } from "@/lib/publications-admin";
import { parseOrcidId } from "@/lib/orcid-import";
import {
  PublicationsSection,
  type OrcidMemberOption,
  type PublicationRow,
} from "@/components/admin/publications-section";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPublicationsPage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const raw = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  // Filtros de la URL validados (lo que no cuadra vuelve a su valor por defecto).
  const query = publicationListQuerySchema.parse(raw);

  const [list, years, bySource, total, hidden, featured, members] = await Promise.all([
    listPublications(query),
    prisma.publication.groupBy({
      by: ["year"],
      _count: { _all: true },
      orderBy: { year: "desc" },
    }),
    prisma.publication.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.publication.count(),
    prisma.publication.count({ where: { published: false } }),
    prisma.publication.count({ where: { featured: true } }),
    prisma.member.findMany({
      where: { orcid: { not: null } },
      orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, orcid: true, active: true },
    }),
  ]);

  const rows: PublicationRow[] = list.items.map((p) => ({
    id: p.id,
    title: p.title,
    authors: p.authors,
    year: p.year,
    type: p.type,
    venue: p.venue,
    details: p.details,
    doi: p.doi,
    url: p.url,
    abstract: p.abstract,
    openAccess: p.openAccess,
    featured: p.featured,
    published: p.published,
    source: p.source,
  }));

  const orcidMembers: OrcidMemberOption[] = members.flatMap((m) => {
    const orcid = parseOrcidId(m.orcid);
    return orcid ? [{ id: m.id, name: m.name, orcid, active: m.active }] : [];
  });

  const action = raw.accion === "nueva" ? "new" : raw.accion === "orcid" ? "orcid" : null;

  return (
    <PublicationsSection
      rows={rows}
      total={list.total}
      page={list.page}
      pageCount={list.pageCount}
      pageSize={list.pageSize}
      filters={{
        q: query.q ?? "",
        type: query.type ?? "",
        year: query.year ? String(query.year) : "",
        visible: query.visible ?? "",
        source: query.source ?? "",
      }}
      years={years.map((y) => ({ year: y.year, count: y._count._all }))}
      stats={{
        total,
        hidden,
        featured,
        bySource: bySource.map((s) => ({ source: s.source, count: s._count._all })),
      }}
      orcidMembers={orcidMembers}
      initialAction={action}
    />
  );
}
