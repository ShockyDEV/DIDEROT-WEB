"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  Calendar,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
}

const NAV_GROUPS: Array<{ title: string | null; items: NavItem[] }> = [
  {
    title: null,
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/backstage" }],
  },
  {
    title: "Contenido",
    items: [
      { label: "Noticias", icon: Newspaper, href: "/backstage/news" },
      { label: "Páginas", icon: FileText, href: "/backstage/pages" },
      { label: "Archivos", icon: FolderOpen, href: "/backstage/files" },
    ],
  },
  {
    title: "Investigación",
    items: [
      { label: "Equipo", icon: Users, href: "/backstage/members" },
      { label: "Publicaciones", icon: BookOpen, href: "/backstage/publications" },
      { label: "Proyectos", icon: FlaskConical, href: "/backstage/projects" },
    ],
  },
  {
    title: "Actividad",
    items: [{ label: "Eventos", icon: Calendar, href: "/backstage/events" }],
  },
  {
    title: "Sistema",
    items: [
      { label: "Visualización", icon: Eye, href: "/backstage/visualizacion" },
      { label: "Configuración", icon: Settings, href: "/backstage/settings" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/backstage") return pathname === "/backstage";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-30 flex w-[260px] flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-[18px]">
        <Link href="/backstage" className="flex flex-col gap-1">
          <Image
            src="/images/diderot-logo.png"
            alt="DIDEROT"
            width={1023}
            height={295}
            priority
            className="h-[30px] w-auto self-start"
          />
          <span className="text-[11px] text-gray-500">Panel de administración</span>
        </Link>
      </div>

      <nav
        aria-label="Navegación del panel"
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4"
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.title ?? gi}>
            {group.title ? (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[.06em] text-gray-500">
                {group.title}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-[9px] text-sm font-medium transition-colors",
                      active
                        ? "bg-diderot-amber/[.08] text-diderot-amber"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-gray-100 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" />
          Volver al sitio
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
