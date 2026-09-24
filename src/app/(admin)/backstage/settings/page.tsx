import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SettingsSection,
  type AccountRow,
  type SiteData,
} from "@/components/admin/settings-section";

export const dynamic = "force-dynamic";

const SITE_DEFAULTS: SiteData = {
  name: "IUCE — Universidad de Salamanca",
  email: "iuce@usal.es",
  phone: "+34 923 294 634",
  reservasUrl: "https://reservas.iuce.usal.es",
  seoDescription:
    "Instituto Universitario de Ciencias de la Educación de la Universidad de Salamanca: investigación, formación del profesorado y doctorado en Educación.",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  const [users, blocks] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true },
    }),
    prisma.contentBlock.findMany({ where: { pageSlug: "_site" } }),
  ]);

  const blockMap = Object.fromEntries(
    blocks.map((b) => [b.blockKey, b.content]),
  );
  const site: SiteData = {
    name: blockMap["name"] ?? SITE_DEFAULTS.name,
    email: blockMap["email"] ?? SITE_DEFAULTS.email,
    phone: blockMap["phone"] ?? SITE_DEFAULTS.phone,
    reservasUrl: blockMap["reservas-url"] ?? SITE_DEFAULTS.reservasUrl,
    seoDescription:
      blockMap["seo-description"] ?? SITE_DEFAULTS.seoDescription,
  };

  const accounts: AccountRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  }));

  return (
    <SettingsSection
      site={site}
      accounts={accounts}
      isSuperAdmin={session?.user?.role === "SUPER_ADMIN"}
    />
  );
}
