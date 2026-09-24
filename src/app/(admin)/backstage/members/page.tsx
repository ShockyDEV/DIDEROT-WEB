import { prisma } from "@/lib/prisma";
import {
  MembersSection,
  type MemberRow,
} from "@/components/admin/members-section";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const [members, groups] = await Promise.all([
    prisma.member.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { group: { select: { acronym: true } } },
    }),
    prisma.researchGroup.findMany({
      orderBy: { acronym: "asc" },
      select: { id: true, acronym: true },
    }),
  ]);

  const rows: MemberRow[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    area: m.area,
    email: m.email,
    extension: m.extension,
    role: m.role,
    photo: m.photo,
    portalUrl: m.portalUrl,
    orcid: m.orcid,
    scopus: m.scopus,
    active: m.active,
    order: m.order,
    groupId: m.groupId,
    groupAcronym: m.group?.acronym ?? null,
  }));

  return <MembersSection rows={rows} groups={groups} />;
}
