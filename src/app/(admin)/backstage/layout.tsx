import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

/**
 * Shell del panel de administración (patrón mupes): sidebar fija de 260px,
 * header sticky de 64px y main sobre gris. El panel es SOLO tema claro
 * (clase theme-light). El middleware ya exige sesión; aquí se re-verifica.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/backstage");
  }

  return (
    <div className="theme-light min-h-screen bg-gray-50 text-gray-600">
      <AdminSidebar />
      <div className="pl-[260px]">
        <AdminHeader
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={String(session.user.role)}
        />
        <main className="max-w-[1200px] p-8">{children}</main>
      </div>
    </div>
  );
}
