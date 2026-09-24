import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Eye,
  FlaskConical,
  FolderOpen,
  Inbox,
  Newspaper,
  TrendingUp,
  Users,
} from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

/** Consulta tolerante a fallos: si la BD no responde, el valor por defecto. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** Visitantes distintos (el identificador cambia cada día). */
async function uniqueVisitors(since: Date): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT COUNT(DISTINCT "visitorId") AS n FROM "PageView" WHERE "date" >= ${since}`;
  return Number(rows[0]?.n ?? 0);
}

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const count = (fn: () => Promise<number>) => safe(fn, 0);

  const [
    viewsToday,
    viewsWeek,
    viewsMonth,
    visitorsToday,
    visitorsWeek,
    visitorsMonth,
    newsPublished,
    newsTotal,
    members,
    publications,
    publicationsHidden,
    projects,
    upcomingEvents,
    files,
    newMessages,
  ] = await Promise.all([
    count(() => prisma.pageView.count({ where: { date: { gte: startOfDay } } })),
    count(() => prisma.pageView.count({ where: { date: { gte: startOfWeek } } })),
    count(() => prisma.pageView.count({ where: { date: { gte: startOfMonth } } })),
    count(() => uniqueVisitors(startOfDay)),
    count(() => uniqueVisitors(startOfWeek)),
    count(() => uniqueVisitors(startOfMonth)),
    count(() => prisma.news.count({ where: { status: "PUBLISHED" } })),
    count(() => prisma.news.count()),
    count(() => prisma.member.count({ where: { active: true } })),
    count(() => prisma.publication.count()),
    count(() => prisma.publication.count({ where: { published: false } })),
    count(() => prisma.project.count({ where: { active: true } })),
    count(() => prisma.event.count({ where: { status: "UPCOMING", startsAt: { gte: startOfDay } } })),
    count(() => prisma.fileAsset.count()),
    count(() => prisma.contactMessage.count({ where: { status: "NEW" } })),
  ]);

  const [topPages, referrers] = await Promise.all([
    safe(
      () =>
        prisma.pageView.groupBy({
          by: ["path"],
          where: { date: { gte: last30 } },
          _count: { _all: true },
          orderBy: { _count: { path: "desc" } },
          take: 8,
        }),
      [],
    ),
    safe(
      () =>
        prisma.pageView.groupBy({
          by: ["referrer"],
          where: { date: { gte: last30 } },
          _count: { _all: true },
          orderBy: { _count: { referrer: "desc" } },
          take: 7,
        }),
      [],
    ),
  ]);
  // Las visitas sin referente (directas o navegación interna) aparte.
  const direct = await count(() =>
    prisma.pageView.count({ where: { date: { gte: last30 }, referrer: null } }),
  );

  return {
    views: { today: viewsToday, week: viewsWeek, month: viewsMonth },
    visitors: { today: visitorsToday, week: visitorsWeek, month: visitorsMonth },
    newsPublished,
    newsTotal,
    members,
    publications,
    publicationsHidden,
    projects,
    upcomingEvents,
    files,
    newMessages,
    topPages: topPages.map((p) => ({ path: p.path, count: p._count._all })),
    referrers: referrers
      .filter((r) => r.referrer)
      .slice(0, 6)
      .map((r) => ({ origin: r.referrer as string, count: r._count._all })),
    direct,
  };
}

function StatCard({
  icon: Icon,
  iconClass,
  label,
  value,
  detail,
  href,
}: Readonly<{
  icon: typeof Eye;
  iconClass: string;
  label: string;
  value: number | string;
  detail?: string;
  href?: string;
}>) {
  const body = (
    <>
      <span className={cn("flex h-12 w-12 flex-none items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {detail ? <p className="truncate text-xs text-gray-500">{detail}</p> : null}
      </div>
    </>
  );
  const cls =
    "flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-gray-300 hover:bg-gray-50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function hostOf(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

function RankList({
  title,
  rows,
  empty,
}: Readonly<{
  title: string;
  rows: Array<{ label: string; count: number; muted?: boolean }>;
  empty: string;
}>) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-6 pt-6">
        <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">Últimos 30 días</p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2.5 px-6 pb-6 pt-4">
        {rows.length === 0 ? (
          <li className="text-sm text-gray-500">{empty}</li>
        ) : (
          rows.map((r) => (
            <li key={r.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className={cn("truncate", r.muted ? "text-gray-500" : "text-gray-700")}>
                  {r.label}
                </span>
                <span className="font-medium tabular-nums text-gray-900">
                  {r.count.toLocaleString("es-ES")}
                </span>
              </div>
              <span className="h-1.5 rounded-full bg-gray-100" aria-hidden="true">
                <span
                  className="block h-1.5 rounded-full bg-diderot-violet/70"
                  style={{ width: `${Math.max(3, (r.count / max) * 100)}%` }}
                />
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [user, stats] = await Promise.all([getCurrentAdmin(), getStats()]);
  const firstName = user?.name?.split(" ")[0] ?? "";
  const n = (value: number) => value.toLocaleString("es-ES");

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-[22px] font-bold text-gray-900">
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Resumen del panel de administración de la web de DIDEROT.
        </p>
      </div>

      {/* Analítica (sin cookies: páginas vistas y visitantes únicos por día) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Eye}
          iconClass="bg-[#EFF6FF] text-[#2563EB]"
          label="Visitas hoy"
          value={n(stats.views.today)}
          detail={`${n(stats.visitors.today)} visitantes`}
        />
        <StatCard
          icon={TrendingUp}
          iconClass="bg-[#ECFDF5] text-[#059669]"
          label="Esta semana"
          value={n(stats.views.week)}
          detail={`${n(stats.visitors.week)} visitantes (únicos por día)`}
        />
        <StatCard
          icon={BarChart3}
          iconClass="bg-[#FFFBEB] text-[#D97706]"
          label="Este mes"
          value={n(stats.views.month)}
          detail={`${n(stats.visitors.month)} visitantes (únicos por día)`}
        />
      </div>

      {/* Recuentos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Newspaper}
          iconClass="bg-[#F0FDF4] text-[#16A34A]"
          label="Noticias publicadas"
          value={n(stats.newsPublished)}
          detail={`${n(stats.newsTotal)} en total`}
          href="/backstage/news"
        />
        <StatCard
          icon={Users}
          iconClass="bg-[#FAF5FF] text-[#9333EA]"
          label="Miembros del equipo"
          value={n(stats.members)}
          detail="activos"
          href="/backstage/members"
        />
        <StatCard
          icon={BookOpen}
          iconClass="bg-diderot-pale text-diderot-indigo"
          label="Publicaciones"
          value={n(stats.publications)}
          detail={
            stats.publicationsHidden > 0 ? `${n(stats.publicationsHidden)} ocultas` : "todas visibles"
          }
          href="/backstage/publications"
        />
        <StatCard
          icon={FlaskConical}
          iconClass="bg-[#FFF7ED] text-[#EA580C]"
          label="Proyectos"
          value={n(stats.projects)}
          detail="visibles en la web"
          href="/backstage/projects"
        />
        <StatCard
          icon={Calendar}
          iconClass="bg-[#FEF2F2] text-diderot-amber"
          label="Eventos próximos"
          value={n(stats.upcomingEvents)}
          href="/backstage/events"
        />
        <StatCard
          icon={FolderOpen}
          iconClass="bg-[#ECFEFF] text-[#0891B2]"
          label="Archivos subidos"
          value={n(stats.files)}
          href="/backstage/files"
        />
        <StatCard
          icon={Inbox}
          iconClass="bg-diderot-pale text-diderot-indigo"
          label="Mensajes nuevos"
          value={n(stats.newMessages)}
          detail="sin responder"
          href="/backstage/messages"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-6">
          <h3 className="text-base font-semibold text-gray-900">Acciones rápidas</h3>
        </div>
        <div className="flex flex-wrap gap-3 px-6 pb-6 pt-5">
          <Link href="/backstage/news/new" className={buttonClassName({ variant: "primary" })}>
            + Nueva noticia
          </Link>
          <Link
            href="/backstage/publications?accion=nueva"
            className={buttonClassName({ variant: "secondary" })}
          >
            + Nueva publicación
          </Link>
          <Link
            href="/backstage/publications?accion=orcid"
            className={buttonClassName({ variant: "outline" })}
          >
            Importar desde ORCID
          </Link>
          <Link
            href="/backstage/events?accion=nuevo"
            className={buttonClassName({ variant: "secondary" })}
          >
            + Nuevo evento
          </Link>
          <Link href="/backstage/pages" className={buttonClassName({ variant: "ghost" })}>
            Editar contenido de páginas
          </Link>
        </div>
      </div>

      {/* Páginas más vistas y referentes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankList
          title="Páginas más vistas"
          rows={stats.topPages.map((p) => ({ label: p.path, count: p.count }))}
          empty="Sin visitas registradas todavía."
        />
        <RankList
          title="Principales referentes"
          rows={[
            ...stats.referrers.map((r) => ({ label: hostOf(r.origin), count: r.count })),
            ...(stats.direct > 0
              ? [{ label: "Directo o navegación interna", count: stats.direct, muted: true }]
              : []),
          ]}
          empty="Sin datos de tráfico todavía."
        />
      </div>
      <p className="-mt-3 text-xs text-gray-500">
        Analítica propia sin cookies: no se guardan IP ni datos personales, y se
        respeta la opción «No rastrear» del navegador.
      </p>
    </div>
  );
}
