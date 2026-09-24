import { prisma } from "@/lib/prisma";
import { MembersSection, type MemberRow } from "@/components/admin/members-section";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const members = await prisma.member.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
  });

  const rows: MemberRow[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    role: m.role,
    roleEn: m.roleEn,
    affiliation: m.affiliation,
    area: m.area,
    bio: m.bio,
    bioEn: m.bioEn,
    email: m.email,
    photo: m.photo,
    portalUrl: m.portalUrl,
    orcid: m.orcid,
    scopus: m.scopus,
    scholar: m.scholar,
    website: m.website,
    active: m.active,
    order: m.order,
  }));

  return <MembersSection rows={rows} />;
}
