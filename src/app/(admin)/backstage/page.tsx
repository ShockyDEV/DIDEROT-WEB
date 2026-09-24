import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Eye,
  FolderOpen,
  Inbox,
  Microscope,
  Newspaper,
  TrendingUp,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonClassName } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/** Recuento tolerante a fallos: si la BD no responde, muestra 0. */
async function safeCount(fn: () => Promise<number>): Promise<number> {
  try {
    return await fn();
  } catch {
    return 0;
  }
}

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    visitsToday,
    visitsWeek,
    visitsMonth,
    newsCount,
    memberCount,
    groupCount,
    upcomingEvents,
    fileCount,
    newMessages,
  ] = await Promise.all([
    safeCount(() => prisma.pageView.count({ where: { date: { gte: startOfDay } } })),
    safeCount(() => prisma.pageView.count({ where: { date: { gte: startOfWeek } } })),
    safeCount(() => prisma.pageView.count({ where: { date: { gte: startOfMonth } } })),
    safeCount(() => prisma.news.count({ where: { status: "PUBLISHED" } })),
    safeCount(() => prisma.member.count({ where: { active: true } })),
    safeCount(() => prisma.researchGroup.count()),
    safeCount(() => prisma.event.count({ where: { status: "UPCOMING" } })),
    safeCount(() => prisma.fileAsset.count()),
    safeCount(() => prisma.contactMessage.count({ where: { status: "NEW" } })),
  ]);

  let sources: Array<{ referrer: string | null; _count: number }> = [];
  try {
    const grouped = await prisma.pageView.groupBy({
      by: ["referrer"],
      _count: true,
      orderBy: { _count: { referrer: "desc" } },
      take: 4,
    });
    sources = grouped.map((g) => ({ referrer: g.referrer, _count: g._count }));
  } catch {
    sources = [];
  }

  return {
    visitsToday,
    visitsWeek,
    visitsMonth,
    newsCount,
    memberCount,
    groupCount,
    upcomingEvents,
    fileCount,
    newMessages,
    sources,
  };
}

function StatCard({
  icon: Icon,
  iconClass,
  label,
  value,
}: Readonly<{
  icon: typeof Eye;
  iconClass: string;
  label: string;
  value: number | string;
}>) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[13px] text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const stats = await getStats();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-[22px] font-bold text-gray-900">
          {firstName ? `Bienvenida, ${firstName}` : "Bienvenida"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Resumen del panel de administración del IUCE.
        </p>
      </div>

      {/* Analítica */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Eye}
          iconClass="bg-[#EFF6FF] text-[#2563EB]"
          label="Visitantes hoy"
          value={stats.visitsToday}
        />
        <StatCard
          icon={TrendingUp}
          iconClass="bg-[#ECFDF5] text-[#059669]"
          label="Esta semana"
          value={stats.visitsWeek}
        />
        <StatCard
          icon={BarChart3}
          iconClass="bg-[#FFFBEB] text-[#D97706]"
          label="Este mes"
          value={stats.visitsMonth}
        />
      </div>

      {/* Recuentos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Newspaper}
          iconClass="bg-[#F0FDF4] text-[#16A34A]"
          label="Noticias publicadas"
          value={stats.newsCount}
        />
        <StatCard
          icon={Users}
          iconClass="bg-[#FAF5FF] text-[#9333EA]"
          label="Miembros"
          value={stats.memberCount}
        />
        <StatCard
          icon={Microscope}
          iconClass="bg-[#FFF7ED] text-[#EA580C]"
          label="Grupos de investigación"
          value={stats.groupCount}
        />
        <StatCard
          icon={Calendar}
          iconClass="bg-[#FEF2F2] text-diderot-amber"
          label="Eventos próximos"
          value={stats.upcomingEvents}
        />
        <StatCard
          icon={FolderOpen}
          iconClass="bg-[#ECFEFF] text-[#0891B2]"
          label="Archivos subidos"
          value={stats.fileCount}
        />
        <StatCard
          icon={Inbox}
          iconClass="bg-diderot-pale text-diderot-indigo"
          label="Mensajes sin responder"
          value={stats.newMessages}
        />
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-semibold text-gray-900">
            Acciones rápidas
          </h3>
        </div>
        <div className="flex flex-wrap gap-3 px-6 pb-6 pt-5">
          <Link
            href="/backstage/news/new"
            className={buttonClassName({ variant: "primary" })}
          >
            + Nueva noticia
          </Link>
          <Link
            href="/backstage/events"
            className={buttonClassName({ variant: "secondary" })}
          >
            Nuevo evento
          </Link>
          <Link
            href="/backstage/files"
            className={buttonClassName({ variant: "outline" })}
          >
            Subir archivo
          </Link>
          <Link
            href="/backstage/pages"
            className={buttonClassName({ variant: "ghost" })}
          >
            Editar contenido de páginas
          </Link>
        </div>
      </div>

      {/* Fuentes de tráfico */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-[15px] font-semibold text-gray-900">
            Principales fuentes de tráfico
          </h3>
        </div>
        <div className="flex flex-col px-6 pb-5 pt-4">
          {stats.sources.length === 0 ? (
            <p className="py-2 text-sm text-gray-500">
              Sin datos de tráfico todavía.
            </p>
          ) : (
            stats.sources.map((s) => (
              <div
                key={s.referrer ?? "directo"}
                className="flex items-center justify-between py-[7px] text-sm"
              >
                <span className="text-gray-600">{s.referrer ?? "Directo"}</span>
                <span className="font-medium text-gray-900">{s._count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
