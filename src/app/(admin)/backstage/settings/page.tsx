import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { SettingsSection, type AccountRow } from "@/components/admin/settings-section";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const me = await getCurrentAdmin();
  if (!me) redirect("/auth/signin?callbackUrl=/backstage/settings");

  const [users, site] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
    getSiteSettings(),
  ]);

  const accounts: AccountRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <SettingsSection
      site={site}
      accounts={accounts}
      currentUserId={me.id}
      isSuperAdmin={me.role === "SUPER_ADMIN"}
    />
  );
}
