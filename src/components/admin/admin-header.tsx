"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const TITLES: Array<[prefix: string, title: string]> = [
  ["/backstage/news/new", "Nueva noticia"],
  ["/backstage/news/", "Editar noticia"],
  ["/backstage/news", "Noticias"],
  ["/backstage/pages", "Contenido de páginas"],
  ["/backstage/visualizacion", "Visualización"],
  ["/backstage/members", "Equipo y miembros"],
  ["/backstage/groups", "Grupos de investigación"],
  ["/backstage/projects", "Proyectos de investigación"],
  ["/backstage/events", "Eventos"],
  ["/backstage/files", "Archivos"],
  ["/backstage/messages", "Mensajes de contacto"],
  ["/backstage/settings", "Configuración"],
  ["/backstage/intranet/users", "Área de miembros — Usuarios autorizados"],
  ["/backstage/intranet/files", "Área de miembros — Documentos internos"],
  ["/backstage", "Dashboard"],
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administración",
  ADMIN: "Administración",
};

interface AdminHeaderProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

export function AdminHeader({
  userName,
  userEmail,
  userRole,
}: Readonly<AdminHeaderProps>) {
  const pathname = usePathname();
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Admin";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6 shadow-sm">
      <h1 className="text-[17px] font-semibold text-gray-900">{title}</h1>
      <div className="flex-1" />
      <div className="text-right">
        <p className="text-[13px] font-medium text-gray-700">{userName}</p>
        <p className="text-[11px] text-gray-500">
          {userEmail} · {ROLE_LABELS[userRole] ?? userRole}
        </p>
      </div>
      <button
        type="button"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </header>
  );
}
