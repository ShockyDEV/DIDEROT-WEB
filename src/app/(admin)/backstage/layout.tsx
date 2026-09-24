import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = {
  title: "Panel de administración",
  robots: { index: false, follow: false },
};

// Cada página del panel lee la sesión y datos vivos: nunca en caché.
export const dynamic = "force-dynamic";

/**
 * Shell del panel de administración (patrón mupes): sidebar fija de 260px,
 * header sticky de 64px y main sobre gris. El panel es SOLO tema claro
 * (clase theme-light). El middleware ya exige sesión; aquí se re-verifica
 * contra la BD (una cuenta borrada o sin rol no entra aunque su JWT siga
 * vigente).
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentAdmin();
  if (!user) {
    redirect("/auth/signin?callbackUrl=/backstage");
  }

  const newMessages = await prisma.contactMessage
    .count({ where: { status: "NEW" } })
    .catch(() => 0);

  return (
    <div className="theme-light min-h-screen bg-gray-50 text-gray-600">
      <AdminSidebar newMessages={newMessages} />
      <div className="pl-[260px]">
        <AdminHeader userName={user.name} userEmail={user.email} userRole={user.role} />
        <main className="max-w-[1200px] p-8">{children}</main>
      </div>
    </div>
  );
}
