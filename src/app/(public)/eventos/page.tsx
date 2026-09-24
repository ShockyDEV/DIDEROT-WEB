import { metadataBilingue } from "@/lib/metadata";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquarePlus,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { EventPoster } from "@/components/eventos/event-poster";
import { buttonClassName } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SoundWave } from "@/components/ui/sound-wave";
import { getBlock } from "@/lib/content-blocks-service";
import {
  dateBlock,
  formatEventDate,
  formatEventDateLong,
  formatEventTime,
  getPublicEvents,
  type PublicEvent,
} from "@/lib/events-service";
import { cn } from "@/lib/cn";
import { withLocale, type Locale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";

export const generateMetadata = metadataBilingue(
  {
    title: "Eventos",
    description:
      "Seminarios, jornadas, congresos y otras actividades organizadas por DIDEROT, grupo de investigación de la Universidad de Salamanca, o con su participación.",
  },
  {
    title: "Events",
    description:
      "Seminars, study days, conferences and other activities organised by DIDEROT, a research group at the University of Salamanca, or with its participation.",
  },
);

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (los bloques editables y los
// eventos llegan ya traducidos desde sus servicios).
const T = {
  es: {
    inicio: "Inicio",
    eventos: "Eventos",
    agenda: "Agenda",
    filtrarTipo: "Filtrar por tipo de evento",
    todos: "Todos",
    seminarioTitulo: "Seminario Internacional",
    conocerSeminario: "Conocer el Seminario",
    destacado: "Próximo evento",
    proximo: "Próximo",
    cancelado: "Cancelado",
    celebrado: "Celebrado",
    webEvento: "Web del evento",
    nuevaVentana: "(se abre en una ventana nueva)",
    leerCronica: "Leer la crónica",
    proximos: "Próximos",
    masProximos: "Más adelante",
    celebrados: "Celebrados",
    sinProximosTitulo: "No hay eventos programados ahora mismo",
    sinProximosTexto:
      "Los próximos seminarios, jornadas y actividades del grupo se anunciarán aquí y en las noticias.",
    verNoticias: "Ver las noticias",
    sinCelebrados: "No hay eventos celebrados registrados.",
    sinEventosTitulo: "Todavía no hay eventos publicados",
    sinEventosTexto:
      "Muy pronto encontrarás aquí los seminarios, jornadas, conciertos y talleres de DIDEROT.",
    sinTipo: "No hay eventos de este tipo.",
    verTodos: "Ver todos los eventos",
    cartel: "Cartel",
    ampliarCartel: "Ver el cartel a tamaño completo (se abre en una pestaña nueva)",
    ctaTitulo: "¿Quieres participar en un evento o proponernos una actividad?",
    ctaTexto:
      "Escríbenos para colaborar en seminarios, jornadas, conciertos o talleres del grupo.",
    contactar: "Contactar",
  },
  en: {
    inicio: "Home",
    eventos: "Events",
    agenda: "Agenda",
    filtrarTipo: "Filter by event type",
    todos: "All",
    seminarioTitulo: "International Seminar",
    conocerSeminario: "Discover the Seminar",
    destacado: "Next event",
    proximo: "Upcoming",
    cancelado: "Cancelled",
    celebrado: "Past",
    webEvento: "Event website",
    nuevaVentana: "(opens in a new window)",
    leerCronica: "Read the report",
    proximos: "Upcoming",
    masProximos: "Later on",
    celebrados: "Past events",
    sinProximosTitulo: "No events scheduled right now",
    sinProximosTexto:
      "The group's upcoming seminars, study days and activities will be announced here and in the news.",
    verNoticias: "See the news",
    sinCelebrados: "No past events on record.",
    sinEventosTitulo: "No events published yet",
    sinEventosTexto:
      "DIDEROT's seminars, study days, concerts and workshops will soon be listed here.",
    sinTipo: "There are no events of this type.",
    verTodos: "See all events",
    cartel: "Poster",
    ampliarCartel: "View the full-size poster (opens in a new tab)",
    ctaTitulo: "Would you like to take part in an event or propose an activity?",
    ctaTexto:
      "Write to us to collaborate on the group's seminars, study days, concerts or workshops.",
    contactar: "Contact us",
  },
} as const;

interface PageProps {
  searchParams: { tipo?: string };
}

/** «16:00 h» (es) / «16:00» (en), o null si el evento no tiene hora. */
function timeLabel(e: PublicEvent, locale: Locale): string | null {
  const time = formatEventTime(e.startsAt, locale);
  if (!time) return null;
  return locale === "es" ? `${time} h` : time;
}

/** Chip de estado: cancelado (rojo) o el indicado (índigo / gris). */
function StatusChip({
  cancelled,
  label,
  cancelledLabel,
  tone,
}: Readonly<{
  cancelled: boolean;
  label: string;
  cancelledLabel: string;
  tone: "upcoming" | "past";
}>) {
  if (cancelled) {
    return (
      <span className="rounded-full bg-danger-50 px-3 py-[3px] text-xs font-semibold text-danger-700">
        {cancelledLabel}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-3 py-[3px] text-xs font-medium",
        tone === "upcoming"
          ? "bg-diderot-indigo text-white"
          : "bg-gray-100 text-gray-700",
      )}
    >
      {label}
    </span>
  );
}

export default async function EventosPage({
  searchParams,
}: Readonly<PageProps>) {
  await assertVisible("eventos");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);

  const [intro, seminario, eventos] = await Promise.all([
    getBlock("eventos", "intro"),
    getBlock("eventos", "seminario"),
    getPublicEvents(locale),
  ]);

  // Chips de tipo: solo con dos o más tipos distintos (con un único tipo, el
  // filtro no aporta nada). El tipo del filtro se valida contra los reales.
  const all = [...eventos.upcoming, ...eventos.past];
  const tipos = [...new Map(all.map((e) => [e.type, e.typeLabel])).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const tipo = tipos.find((x) => x.value === searchParams.tipo)?.value ?? null;
  const byType = (e: PublicEvent) => !tipo || e.type === tipo;

  const upcoming = eventos.upcoming.filter(byType);
  const past = eventos.past.filter(byType);

  // Destacado: el próximo evento no cancelado; el resto de próximos va en la
  // lista de debajo, con su bloque de fecha.
  const featured = upcoming.find((e) => !e.cancelled) ?? null;
  const upcomingRest = upcoming.filter((e) => e.id !== featured?.id);

  const hayEventos = all.length > 0;
  const hrefTipo = (value: string | null) =>
    href(value ? `/eventos?tipo=${encodeURIComponent(value)}` : "/eventos");
  const cronicaHref = (e: PublicEvent) =>
    e.newsSlug ? href(`/noticias/${e.newsSlug}`) : null;
  const metaLine = (e: PublicEvent) =>
    [timeLabel(e, locale), e.location].filter(Boolean).join(" · ");
  // Rutas internas con prefijo de idioma; externas, tal cual.
  const webHref = (url: string) => (url.startsWith("/") ? href(url) : url);

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.eventos },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.agenda}
          </p>
          <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.eventos}
          </h1>
          <div
            className="page-block max-w-[70ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
          {tipos.length > 1 ? (
            <nav
              className="mt-6 flex flex-wrap gap-2"
              aria-label={t.filtrarTipo}
            >
              {[{ value: null, label: t.todos }, ...tipos].map((x) => {
                const active = tipo === x.value;
                return (
                  <Link
                    key={x.value ?? "todos"}
                    href={hrefTipo(x.value)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-[34px] items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
                      active
                        ? "border-diderot-indigo bg-diderot-indigo text-white"
                        : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-ink",
                    )}
                  >
                    {x.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </section>

      {/* Seminario Internacional: el encuentro propio del grupo */}
      {seminario ? (
        <section className="border-b border-gray-200 bg-surface-tinted">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4 sm:items-center">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-diderot-indigo text-diderot-gold">
                <SoundWave bars={4} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {t.seminarioTitulo}
                </h2>
                <div
                  className="page-block max-w-[70ch] text-sm leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: seminario }}
                />
              </div>
            </div>
            <Link
              href={href("/formacion#seminario")}
              className={cn(buttonClassName(), "flex-none gap-1.5")}
            >
              {t.conocerSeminario}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}

      {!hayEventos ? (
        /* Sin eventos (o sin BD): estado vacío en lugar de secciones huecas */
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal from="scale">
              <div className="staff-lines flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-surface-card px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-diderot-pale text-ink">
                  <CalendarDays className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  {t.sinEventosTitulo}
                </h2>
                <p className="max-w-[52ch] text-sm leading-relaxed text-gray-600">
                  {t.sinEventosTexto}
                </p>
                <Link
                  href={href("/noticias")}
                  className="mt-1 text-sm font-medium text-diderot-violet hover:underline"
                >
                  {t.verNoticias} →
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        <>
          {/* Filtro sin resultados */}
          {tipo && upcoming.length === 0 && past.length === 0 ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pt-12">
                <p className="text-sm text-gray-500">
                  {t.sinTipo}{" "}
                  <Link
                    href={hrefTipo(null)}
                    className="font-medium text-diderot-violet hover:underline"
                  >
                    {t.verTodos}
                  </Link>
                </p>
              </div>
            </section>
          ) : null}

          {/* Próximo evento (destacado, con cartel) */}
          {featured ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-2 pt-12">
                <h2 className="mb-[18px] text-xl font-bold text-gray-900">
                  {t.destacado}
                </h2>
                <Reveal from="scale">
                  <article className="grid overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm lg:grid-cols-[1.35fr_1fr]">
                    <div className="flex flex-col gap-3.5 p-8">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="rounded-full bg-diderot-pale px-3 py-[3px] text-xs font-medium text-ink">
                          {featured.typeLabel}
                        </span>
                        <StatusChip
                          cancelled={false}
                          label={t.proximo}
                          cancelledLabel={t.cancelado}
                          tone="upcoming"
                        />
                      </div>
                      <h3 className="text-balance text-2xl font-bold leading-snug text-ink">
                        {featured.title}
                      </h3>
                      {featured.description ? (
                        <p className="text-base leading-relaxed text-gray-600">
                          {featured.description}
                        </p>
                      ) : null}
                      <ul className="flex flex-col gap-2 text-sm text-gray-600">
                        <li className="inline-flex items-start gap-2">
                          <CalendarDays
                            className="mt-0.5 h-[15px] w-[15px] flex-none text-diderot-amber"
                            aria-hidden="true"
                          />
                          <span>
                            {formatEventDateLong(
                              featured.startsAt,
                              featured.endsAt,
                              locale,
                            )}
                          </span>
                        </li>
                        {timeLabel(featured, locale) ? (
                          <li className="inline-flex items-start gap-2">
                            <Clock
                              className="mt-0.5 h-[15px] w-[15px] flex-none text-diderot-amber"
                              aria-hidden="true"
                            />
                            <span>{timeLabel(featured, locale)}</span>
                          </li>
                        ) : null}
                        {featured.location ? (
                          <li className="inline-flex items-start gap-2">
                            <MapPin
                              className="mt-0.5 h-[15px] w-[15px] flex-none text-diderot-amber"
                              aria-hidden="true"
                            />
                            <span>{featured.location}</span>
                          </li>
                        ) : null}
                      </ul>
                      {featured.url || cronicaHref(featured) ? (
                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                          {featured.url ? (
                            <a
                              href={webHref(featured.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                buttonClassName({ variant: "outline" }),
                                "gap-1.5",
                              )}
                            >
                              {t.webEvento}
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t.nuevaVentana}</span>
                            </a>
                          ) : null}
                          {cronicaHref(featured) ? (
                            <Link
                              href={cronicaHref(featured) as string}
                              className={buttonClassName({ variant: "outline" })}
                            >
                              {t.leerCronica} →
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <EventPoster
                      src={featured.image}
                      alt={`${t.cartel}: ${featured.title}`}
                      zoomLabel={t.ampliarCartel}
                      sizes="(max-width: 1024px) 100vw, 460px"
                      priority
                      className="min-h-[340px] border-t border-gray-200 lg:min-h-[440px] lg:border-l lg:border-t-0"
                    />
                  </article>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* Sin próximos: aviso breve (los celebrados siguen debajo) */}
          {!tipo && upcoming.length === 0 ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-2 pt-12">
                <h2 className="mb-[18px] text-xl font-bold text-gray-900">
                  {t.proximos}
                </h2>
                <Reveal>
                  <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-gray-300 bg-surface-card px-6 py-6 sm:flex-row sm:items-center">
                    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-diderot-pale text-ink">
                      <CalendarClock className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900">
                        {t.sinProximosTitulo}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
                        {t.sinProximosTexto}
                      </p>
                    </div>
                    <Link
                      href={href("/noticias")}
                      className="flex-none text-sm font-medium text-diderot-violet hover:underline"
                    >
                      {t.verNoticias} →
                    </Link>
                  </div>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* Resto de próximos, con bloque de fecha */}
          {upcomingRest.length > 0 ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-2 pt-10">
                <h2 className="mb-[18px] text-xl font-bold text-gray-900">
                  {featured ? t.masProximos : t.proximos}
                </h2>
                <div className="flex flex-col gap-3">
                  {upcomingRest.map((e, i) => {
                    const fecha = dateBlock(e.startsAt, locale);
                    const cronica = cronicaHref(e);
                    return (
                      <Reveal key={e.id} delay={Math.min(i, 5) * 90}>
                        <article className="card-lift flex items-start gap-[18px] rounded-xl border border-gray-200 bg-surface-card px-[22px] py-[18px] shadow-sm hover:shadow-md sm:items-center">
                          <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-md bg-diderot-indigo text-white">
                            <span className="text-base font-bold leading-none">
                              {fecha.day}
                            </span>
                            <span className="mt-0.5 text-[10px] tracking-[.06em] opacity-85">
                              {fecha.month}
                            </span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 text-xs font-medium text-ink">
                                {e.typeLabel}
                              </span>
                              {e.cancelled ? (
                                <StatusChip
                                  cancelled
                                  label=""
                                  cancelledLabel={t.cancelado}
                                  tone="upcoming"
                                />
                              ) : null}
                            </div>
                            <h3
                              className={cn(
                                "mb-[3px] text-base font-semibold text-gray-900",
                                e.cancelled && "line-through decoration-gray-400",
                              )}
                            >
                              {e.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {formatEventDate(e.startsAt, e.endsAt, locale)}
                              {metaLine(e) ? ` · ${metaLine(e)}` : ""}
                              {cronica ? (
                                <>
                                  {" · "}
                                  <Link
                                    href={cronica}
                                    className="font-medium text-diderot-violet hover:underline"
                                  >
                                    {t.leerCronica} →
                                  </Link>
                                </>
                              ) : null}
                            </p>
                            {e.description ? (
                              <p className="mt-1.5 line-clamp-2 max-w-[90ch] text-sm leading-relaxed text-gray-600">
                                {e.description}
                              </p>
                            ) : null}
                          </div>
                          {e.url ? (
                            <a
                              href={webHref(e.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-diderot-pale hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
                            >
                              <ArrowUpRight className="h-[18px] w-[18px]" aria-hidden="true" />
                              <span className="sr-only">
                                {t.webEvento}: {e.title} {t.nuevaVentana}
                              </span>
                            </a>
                          ) : null}
                        </article>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {/* Celebrados: rejilla con el cartel en miniatura */}
          {past.length > 0 || !tipo ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-14 pt-10">
                <h2 className="mb-[18px] text-xl font-bold text-gray-900">
                  {t.celebrados}
                </h2>
                {past.length === 0 ? (
                  <p className="py-6 text-sm text-gray-500">{t.sinCelebrados}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {past.map((e, i) => {
                      const cronica = cronicaHref(e);
                      return (
                        <Reveal
                          key={e.id}
                          delay={(i % 3) * 80}
                          className="h-full"
                        >
                          <article className="card-lift flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm hover:shadow-md">
                            <EventPoster
                              src={e.image}
                              alt={`${t.cartel}: ${e.title}`}
                              zoomLabel={t.ampliarCartel}
                              className="h-64 border-b border-gray-200"
                            />
                            <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-[18px]">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 font-medium text-ink">
                                  {e.typeLabel}
                                </span>
                                <StatusChip
                                  cancelled={e.cancelled}
                                  label={t.celebrado}
                                  cancelledLabel={t.cancelado}
                                  tone="past"
                                />
                              </div>
                              <p className="text-xs uppercase tracking-wider text-gray-500">
                                <time dateTime={e.startsAt.toISOString()}>
                                  {formatEventDate(e.startsAt, e.endsAt, locale)}
                                </time>
                              </p>
                              <h3 className="text-base font-semibold leading-snug text-gray-900">
                                {e.title}
                              </h3>
                              {metaLine(e) ? (
                                <p className="text-xs leading-relaxed text-gray-500">
                                  {metaLine(e)}
                                </p>
                              ) : null}
                              {cronica ? (
                                <Link
                                  href={cronica}
                                  className="mt-auto inline-flex w-fit items-center gap-1 pt-1 text-sm font-medium text-diderot-violet hover:underline"
                                >
                                  {t.leerCronica} →
                                </Link>
                              ) : null}
                            </div>
                          </article>
                        </Reveal>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* Llamada final: participar o proponer una actividad */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-[18px]">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-md bg-diderot-indigo text-white">
              <MessageSquarePlus className="h-[22px] w-[22px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold text-gray-900">
                {t.ctaTitulo}
              </p>
              <p className="text-sm text-gray-600">{t.ctaTexto}</p>
            </div>
          </div>
          <Link
            href={href("/contacto?asunto=eventos")}
            className={cn(buttonClassName(), "flex-none")}
          >
            {t.contactar}
          </Link>
        </div>
      </section>
    </>
  );
}
