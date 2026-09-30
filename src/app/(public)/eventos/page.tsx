import { metadataBilingue } from "@/lib/metadata";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock,
  FileText,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EventPoster } from "@/components/eventos/event-poster";
import { buttonClassName } from "@/components/ui/button";
import { Gota } from "@/components/ui/eyebrow";
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
import { columnasSinHuecos } from "@/lib/grid";
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
    resumen: (proximos: number, celebrados: number) =>
      proximos > 0
        ? `${proximos} ${proximos === 1 ? "evento próximo" : "eventos próximos"} y ${celebrados} ${celebrados === 1 ? "celebrado" : "celebrados"}`
        : `${celebrados} ${celebrados === 1 ? "evento celebrado" : "eventos celebrados"}`,
    filtrarTipo: "Filtrar por tipo de evento",
    todos: "Todos",
    seminarioTitulo: "Seminario Internacional",
    conocerSeminario: "Conocer el Seminario",
    destacado: "Próximo evento",
    proximo: "Próximo",
    cancelado: "Cancelado",
    celebrado: "celebrado",
    webEvento: "Web del evento",
    programa: "Programa (PDF)",
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
    resumen: (proximos: number, celebrados: number) =>
      proximos > 0
        ? `${proximos} upcoming ${proximos === 1 ? "event" : "events"} and ${celebrados} past`
        : `${celebrados} past ${celebrados === 1 ? "event" : "events"}`,
    filtrarTipo: "Filter by event type",
    todos: "All",
    seminarioTitulo: "International Seminar",
    conocerSeminario: "Discover the Seminar",
    destacado: "Next event",
    proximo: "Upcoming",
    cancelado: "Cancelled",
    celebrado: "past event",
    webEvento: "Event website",
    programa: "Programme (PDF)",
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

/**
 * Títulos escritos como «Jornada I · Encuentro…»: la primera parte pasa a
 * antetítulo en cursiva y el resto queda como título, sin el punto medio.
 */
function partes(titulo: string): { kicker: string | null; title: string } {
  const i = titulo.indexOf(" · ");
  if (i <= 0 || i > 40) return { kicker: null, title: titulo };
  return { kicker: titulo.slice(0, i).trim(), title: titulo.slice(i + 3).trim() };
}

function EventTitle({
  titulo,
  className,
  as: Tag = "h3",
}: Readonly<{ titulo: string; className?: string; as?: "h2" | "h3" }>) {
  const { kicker, title } = partes(titulo);
  return (
    <Tag className={className}>
      {kicker ? (
        <span className="mb-1 block font-serif text-[17px] font-normal italic text-diderot-amber">
          {kicker}
        </span>
      ) : null}
      {title}
    </Tag>
  );
}

/** Tipo del evento, salvo que el antetítulo ya lo diga («Jornada I»). */
function mostrarTipo(e: PublicEvent): boolean {
  const { kicker } = partes(e.title);
  return !(kicker && kicker.toLowerCase().startsWith(e.typeLabel.toLowerCase()));
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

  // Pestañas de tipo: solo con dos o más tipos distintos (con un único tipo,
  // el filtro no aporta nada). El tipo del filtro se valida contra los reales.
  const all = [...eventos.upcoming, ...eventos.past];
  const tipos = [...new Map(all.map((e) => [e.type, e.typeLabel])).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  const tipo = tipos.find((x) => x.value === searchParams.tipo)?.value ?? null;
  const byType = (e: PublicEvent) => !tipo || e.type === tipo;

  const upcoming = eventos.upcoming.filter(byType);
  const past = eventos.past.filter(byType);

  // Destacado: el próximo evento no cancelado; el resto de próximos va en la
  // lista de debajo, con su fecha.
  const featured = upcoming.find((e) => !e.cancelled) ?? null;
  const upcomingRest = upcoming.filter((e) => e.id !== featured?.id);

  const hayEventos = all.length > 0;
  const hrefTipo = (value: string | null) =>
    href(value ? `/eventos?tipo=${encodeURIComponent(value)}` : "/eventos");
  const cronicaHref = (e: PublicEvent) =>
    e.newsSlug ? href(`/noticias/${e.newsSlug}`) : null;
  // Hora y lugar, separados por coma (sin «·»).
  const metaLine = (e: PublicEvent) =>
    [timeLabel(e, locale), e.location].filter(Boolean).join(", ");
  // Rutas internas con prefijo de idioma; externas, tal cual.
  const webHref = (url: string) => (url.startsWith("/") ? href(url) : url);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.eventos }]}
        eyebrow={hayEventos ? t.resumen(eventos.upcoming.length, eventos.past.length) : undefined}
        title={t.eventos}
        intro={intro}
        className={tipos.length > 1 ? "pb-8" : undefined}
      >
        {tipos.length > 1 ? (
          <nav className="tabs mt-8" aria-label={t.filtrarTipo}>
            {[{ value: null, label: t.todos }, ...tipos].map((x) => (
              <Link
                key={x.value ?? "todos"}
                href={hrefTipo(x.value)}
                aria-current={tipo === x.value ? "page" : undefined}
                className="tab"
              >
                {x.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </PageHeader>

      {/* Seminario Internacional: el encuentro propio del grupo */}
      {seminario ? (
        <section className="staff-lines border-b border-gray-200 bg-surface-tinted">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mb-2 flex items-center gap-3 text-xl font-semibold text-gray-900">
                <SoundWave bars={4} className="text-diderot-gold" />
                {t.seminarioTitulo}
              </h2>
              <div
                className="page-block max-w-[70ch] text-[15px] leading-relaxed text-gray-600"
                dangerouslySetInnerHTML={{ __html: seminario }}
              />
            </div>
            <Link
              href={href("/formacion#seminario")}
              className={cn(buttonClassName(), "flex-none gap-2")}
            >
              {t.conocerSeminario}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}

      {!hayEventos ? (
        /* Sin eventos (o sin BD): estado vacío en lugar de secciones huecas */
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="border-y border-gray-200 px-6 py-14 text-center">
              <h2 className="text-xl font-semibold text-gray-900">{t.sinEventosTitulo}</h2>
              <p className="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-gray-600">
                {t.sinEventosTexto}
              </p>
              <Link href={href("/noticias")} className="link-sub mt-4 inline-block text-sm font-medium">
                {t.verNoticias}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Filtro sin resultados */}
          {tipo && upcoming.length === 0 && past.length === 0 ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pt-12">
                <p className="text-[15px] text-gray-600">
                  <span className="note">{t.sinTipo}</span>{" "}
                  <Link href={hrefTipo(null)} className="link-sub font-medium">
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
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-900">
                  {t.destacado}
                </h2>
                <Reveal>
                  <article className="grid gap-8 border-t-2 border-diderot-gold pt-6 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
                    <div className="flex flex-col gap-4">
                      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="status">
                          <Gota className="text-diderot-violet" />
                          {t.proximo}
                        </span>
                        {mostrarTipo(featured) ? (
                          <span className="status">
                            <Gota className="text-diderot-gold" />
                            {featured.typeLabel}
                          </span>
                        ) : null}
                      </p>
                      <EventTitle
                        titulo={featured.title}
                        className="text-balance text-[28px] font-semibold leading-snug text-ink"
                      />
                      {featured.description ? (
                        <p className="text-[17px] leading-relaxed text-gray-600">
                          {featured.description}
                        </p>
                      ) : null}
                      <ul className="flex list-none flex-col gap-2 p-0 text-[15px] text-gray-700">
                        <li className="inline-flex items-start gap-2.5">
                          <CalendarDays className="mt-0.5 h-4 w-4 flex-none text-diderot-amber" aria-hidden="true" />
                          <span>{formatEventDateLong(featured.startsAt, featured.endsAt, locale)}</span>
                        </li>
                        {timeLabel(featured, locale) ? (
                          <li className="inline-flex items-start gap-2.5">
                            <Clock className="mt-0.5 h-4 w-4 flex-none text-diderot-amber" aria-hidden="true" />
                            <span className="tabular-nums">{timeLabel(featured, locale)}</span>
                          </li>
                        ) : null}
                        {featured.location ? (
                          <li className="inline-flex items-start gap-2.5">
                            <MapPin className="mt-0.5 h-4 w-4 flex-none text-diderot-amber" aria-hidden="true" />
                            <span>{featured.location}</span>
                          </li>
                        ) : null}
                      </ul>
                      {featured.url || featured.programUrl || cronicaHref(featured) ? (
                        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
                          {featured.url ? (
                            <a
                              href={webHref(featured.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(buttonClassName(), "gap-1.5")}
                            >
                              {t.webEvento}
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                              <span className="sr-only">{t.nuevaVentana}</span>
                            </a>
                          ) : null}
                          {featured.programUrl ? (
                            <a
                              href={featured.programUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(buttonClassName({ variant: "outline" }), "gap-1.5")}
                            >
                              <FileText className="h-4 w-4" aria-hidden="true" />
                              {t.programa}
                              <span className="sr-only">{t.nuevaVentana}</span>
                            </a>
                          ) : null}
                          {cronicaHref(featured) ? (
                            <Link href={cronicaHref(featured) as string} className="link-sub text-sm font-medium">
                              {t.leerCronica}
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
                      className="min-h-[340px] rounded lg:min-h-[440px]"
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
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-900">
                  {t.proximos}
                </h2>
                <div className="flex flex-col items-start gap-3 border-y border-gray-200 py-6 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="font-serif text-xl italic text-gray-800">{t.sinProximosTitulo}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-gray-600">{t.sinProximosTexto}</p>
                  </div>
                  <Link href={href("/noticias")} className="link-sub flex-none text-sm font-medium">
                    {t.verNoticias}
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {/* Resto de próximos, con la fecha en serif */}
          {upcomingRest.length > 0 ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-2 pt-10">
                <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-900">
                  {featured ? t.masProximos : t.proximos}
                </h2>
                <ul className="list-none divide-y divide-gray-200 border-y border-gray-200 p-0">
                  {upcomingRest.map((e, i) => {
                    const fecha = dateBlock(e.startsAt, locale);
                    const cronica = cronicaHref(e);
                    return (
                      <li key={e.id}>
                        <Reveal delay={Math.min(i, 5) * 90}>
                          <article className="flex items-start gap-6 py-5">
                            <p className="w-14 flex-none text-center" aria-hidden="true">
                              <span className="block font-serif text-[36px] leading-none tabular-nums text-ink">
                                {fecha.day}
                              </span>
                              <span className="mt-1 block text-xs font-medium text-diderot-amber">
                                {fecha.month.toLowerCase()}
                              </span>
                            </p>
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                {mostrarTipo(e) ? (
                                  <span className="status">
                                    <Gota className="text-diderot-gold" />
                                    {e.typeLabel}
                                  </span>
                                ) : null}
                                {e.cancelled ? (
                                  <span className="status">
                                    <Gota className="text-danger-700" />
                                    {t.cancelado}
                                  </span>
                                ) : null}
                              </p>
                              <EventTitle
                                titulo={e.title}
                                className={cn(
                                  "mb-1 text-lg font-semibold leading-snug text-gray-900",
                                  e.cancelled && "line-through decoration-gray-400",
                                )}
                              />
                              <p className="text-[13px] text-gray-500">
                                <time dateTime={e.startsAt.toISOString()} className="tabular-nums">
                                  {formatEventDate(e.startsAt, e.endsAt, locale)}
                                </time>
                                {metaLine(e) ? `, ${metaLine(e)}` : ""}
                              </p>
                              {e.description ? (
                                <p className="mt-1.5 line-clamp-2 max-w-[90ch] text-sm leading-relaxed text-gray-600">
                                  {e.description}
                                </p>
                              ) : null}
                              {e.url || e.programUrl || cronica ? (
                                <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                                  {e.url ? (
                                    <a href={webHref(e.url)} target="_blank" rel="noopener noreferrer" className="link-sub inline-flex items-center gap-1">
                                      {t.webEvento}
                                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                      <span className="sr-only">{t.nuevaVentana}</span>
                                    </a>
                                  ) : null}
                                  {e.programUrl ? (
                                    <a href={e.programUrl} target="_blank" rel="noopener noreferrer" className="link-sub">
                                      {t.programa}
                                      <span className="sr-only"> {t.nuevaVentana}</span>
                                    </a>
                                  ) : null}
                                  {cronica ? (
                                    <Link href={cronica} className="link-sub">
                                      {t.leerCronica}
                                    </Link>
                                  ) : null}
                                </p>
                              ) : null}
                            </div>
                          </article>
                        </Reveal>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ) : null}

          {/* Celebrados: rejilla con el cartel en miniatura */}
          {past.length > 0 || !tipo ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
                <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900">
                  {t.celebrados}
                </h2>
                {past.length === 0 ? (
                  <p className="note py-6 text-base">{t.sinCelebrados}</p>
                ) : (
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2",
                      // Sin carteles huérfanos: filas de cuatro cuando dejan menos huecos.
                      columnasSinHuecos(past.length) === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
                    )}
                  >
                    {past.map((e, i) => {
                      const cronica = cronicaHref(e);
                      return (
                        <Reveal key={e.id} delay={(i % 3) * 80} className="h-full">
                          <article className="flex h-full flex-col gap-2.5">
                            <EventPoster
                              src={e.image}
                              alt={`${t.cartel}: ${e.title}`}
                              zoomLabel={t.ampliarCartel}
                              className="mb-2 h-64 rounded"
                            />
                            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                              {e.cancelled ? (
                                <span className="status">
                                  <Gota className="text-danger-700" />
                                  {t.cancelado}
                                </span>
                              ) : null}
                              {mostrarTipo(e) ? (
                                <span className="status">
                                  <Gota className="text-diderot-gold" />
                                  {e.typeLabel}
                                </span>
                              ) : null}
                              <time dateTime={e.startsAt.toISOString()} className="text-[13px] tabular-nums text-gray-500">
                                {formatEventDate(e.startsAt, e.endsAt, locale)}
                              </time>
                            </p>
                            <EventTitle
                              titulo={e.title}
                              className="text-lg font-semibold leading-snug text-gray-900"
                            />
                            {metaLine(e) ? (
                              <p className="text-[13px] leading-relaxed text-gray-500">{metaLine(e)}</p>
                            ) : null}
                            {e.programUrl || cronica ? (
                              <p className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm font-medium">
                                {e.programUrl ? (
                                  <a
                                    href={e.programUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-sub inline-flex items-center gap-1.5"
                                  >
                                    <FileText className="h-4 w-4" aria-hidden="true" />
                                    {t.programa}
                                    <span className="sr-only"> {t.nuevaVentana}</span>
                                  </a>
                                ) : null}
                                {cronica ? (
                                  <Link href={cronica} className="link-sub">
                                    {t.leerCronica}
                                  </Link>
                                ) : null}
                              </p>
                            ) : null}
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
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t.ctaTitulo}</h2>
            <p className="mt-1 text-[15px] text-gray-600">{t.ctaTexto}</p>
          </div>
          <Link href={href("/contacto")} className={cn(buttonClassName(), "flex-none")}>
            {t.contactar}
          </Link>
        </div>
      </section>
    </>
  );
}
