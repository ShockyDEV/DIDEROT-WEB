import { metadataBilingue } from "@/lib/metadata";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight, MapPin, Users2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CoverImage } from "@/components/news/cover-image";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { buttonClassName } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { prisma } from "@/lib/prisma";
import { getBlock } from "@/lib/content-blocks-service";
import {
  featuredEvent as featuredFallback,
  pastEvents as pastFallback,
  upcomingEvents as upcomingFallback,
} from "@/lib/content/events";
import { cn } from "@/lib/cn";
import { withLocale, type Locale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible } from "@/lib/page-visibility";

export const generateMetadata = metadataBilingue(
  {
    title: "Eventos",
    description:
      "Congresos, seminarios y jornadas organizados por el IUCE o con participación del Instituto.",
  },
  {
    title: "Events",
    description:
      "Conferences, seminars and workshops organised by the IUCE or with the Institute's participation.",
  },
);

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (los bloques editables llegan ya
// traducidos desde el servicio de contenidos).
const T = {
  es: {
    inicio: "Inicio",
    eventos: "Eventos",
    agenda: "Agenda",
    seminarioDesc:
      "El encuentro anual donde los grupos de investigación del Instituto ponen en común su trabajo: ediciones, crónicas y actas.",
    conocerSeminario: "Conocer el Seminario",
    destacado: "Destacado",
    proximo: "Próximo",
    webEvento: "Web del evento ↗",
    leerCronica: "Leer la crónica",
    proximos: "Próximos",
    celebrados: "Celebrados",
    celebrado: "Celebrado",
    sinCelebrados: "No hay eventos celebrados registrados.",
    imagen: "Imagen",
  },
  en: {
    inicio: "Home",
    eventos: "Events",
    agenda: "Agenda",
    seminarioDesc:
      "The annual meeting where the Institute's research groups share their work: past editions, reports and proceedings.",
    conocerSeminario: "Discover the Seminar",
    destacado: "Featured",
    proximo: "Upcoming",
    webEvento: "Event website ↗",
    leerCronica: "Read the report",
    proximos: "Upcoming",
    celebrados: "Past events",
    celebrado: "Past",
    sinCelebrados: "No past events on record.",
    imagen: "Image",
  },
} as const;

// El campo `type` es dato en español (Congreso/Seminario/Jornada); en inglés
// solo se traduce su presentación.
const TYPE_EN: Record<string, string> = {
  Congreso: "Conference",
  Seminario: "Seminar",
  Jornada: "Workshop",
};

interface EventVM {
  id: string;
  title: string;
  titleEn: string | null;
  type: string;
  startsAt: Date;
  location: string | null;
  url: string | null;
  image: string | null;
  newsSlug: string | null;
}

function monthShort(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    month: "short",
  })
    .format(d)
    .replace(".", "")
    .toUpperCase();
}

function monthYear(d: Date, locale: Locale): string {
  const s = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    month: "long",
    year: "numeric",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayMonth(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    day: "numeric",
    month: "short",
  })
    .format(d)
    .replace(".", "");
}

/** Eventos del gestor; contenido semilla como fallback sin BD. */
async function getEventos(): Promise<{
  upcoming: EventVM[];
  past: EventVM[];
} | null> {
  try {
    const rows = await prisma.event.findMany({
      where: { status: { not: "CANCELLED" } },
    });
    if (rows.length === 0) return null;
    // Próximo/pasado se deriva de las fechas (nadie tiene que actualizarlo a
    // mano); «Cancelado» sí se respeta como estado manual. Un evento cuenta
    // como pasado cuando su fin (o su inicio, si no tiene fin) es anterior a
    // hoy; el día del propio evento sigue apareciendo entre los próximos.
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const isPast = (e: (typeof rows)[number]) =>
      (e.endsAt ?? e.startsAt).getTime() < hoy.getTime();
    const upcoming = rows
      .filter((e) => !isPast(e))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const past = rows
      .filter(isPast)
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
    return { upcoming, past };
  } catch {
    return null;
  }
}

export default async function EventosPage() {
  await assertVisible("eventos");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  const eventTitle = (e: { title: string; titleEn: string | null }) =>
    locale === "en" ? (e.titleEn ?? e.title) : e.title;
  const typeLabel = (type: string) =>
    locale === "en" ? (TYPE_EN[type] ?? type) : type;

  const [intro, destacadoDesc, eventos] = await Promise.all([
    getBlock("eventos", "intro"),
    getBlock("eventos", "destacado-descripcion"),
    getEventos(),
  ]);

  // Destacado: el primer congreso próximo (o el primer próximo si no hay
  // congresos). Su descripción se edita en Contenido → Páginas → Eventos.
  let featured: {
    id: string | null;
    title: string;
    type: string;
    dateDisplay: string;
    location: string;
    url: string | null;
    image: string | null;
    newsHref: string | null;
    photoLabel: string;
  } | null = null;
  let upcomingRest: Array<{
    key: string;
    title: string;
    meta: string;
    top: string;
    bottom: string;
    newsHref: string | null;
  }> = [];
  let past: Array<{
    key: string;
    title: string;
    meta: string;
    dateRange: string;
    image: string | null;
    newsHref: string | null;
  }> = [];

  if (eventos) {
    const destacado =
      eventos.upcoming.find((e) => e.type === "Congreso") ??
      eventos.upcoming[0] ??
      null;
    const cronicaHref = (e: { newsSlug: string | null }) =>
      e.newsSlug ? href(`/noticias/${e.newsSlug}`) : null;
    if (destacado) {
      featured = {
        id: destacado.id,
        title: eventTitle(destacado),
        type: typeLabel(destacado.type),
        dateDisplay: monthYear(destacado.startsAt, locale),
        location: destacado.location ?? "Salamanca",
        url: destacado.url,
        image: destacado.image,
        newsHref: cronicaHref(destacado),
        photoLabel: `${t.imagen} — ${eventTitle(destacado)}`,
      };
    }
    upcomingRest = eventos.upcoming
      .filter((e) => e.id !== (destacado?.id ?? ""))
      .map((e) => ({
        key: e.id,
        title: eventTitle(e),
        meta: [typeLabel(e.type), e.location].filter(Boolean).join(" · "),
        top: String(e.startsAt.getDate()),
        bottom: monthShort(e.startsAt, locale),
        newsHref: cronicaHref(e),
      }));
    past = eventos.past.map((e) => ({
      key: e.id,
      title: eventTitle(e),
      meta: [typeLabel(e.type), e.location].filter(Boolean).join(" · "),
      dateRange: dayMonth(e.startsAt, locale),
      image: e.image,
      newsHref: cronicaHref(e),
    }));
  } else {
    // Fallback estático (BD no disponible): contenido semilla en español.
    featured = {
      id: null,
      title: featuredFallback.title,
      type: typeLabel(featuredFallback.type),
      dateDisplay: featuredFallback.dateDisplay,
      location: featuredFallback.location,
      url: featuredFallback.url,
      image: null,
      newsHref: null,
      photoLabel: featuredFallback.photoLabel,
    };
    upcomingRest = upcomingFallback.map((e) => ({
      key: e.title,
      title: e.title,
      meta: e.meta,
      top: e.dateBlock?.top ?? "",
      bottom: e.dateBlock?.bottom ?? "",
      newsHref: null,
    }));
    past = pastFallback.map((e) => ({
      key: e.title,
      title: e.title,
      meta: e.meta,
      dateRange: e.dateRange ?? "",
      image: null,
      newsHref: null,
    }));
  }

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
          <h1 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.eventos}
          </h1>
          <div
            className="page-block max-w-[70ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        </div>
      </section>

      {/* Seminario IUCE: el encuentro propio del Instituto, en primer lugar */}
      <section className="border-b border-gray-200 bg-surface-tinted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-diderot-indigo text-white">
              <Users2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Seminario IUCE
              </h2>
              <p className="max-w-[70ch] text-sm leading-relaxed text-gray-600">
                {t.seminarioDesc}
              </p>
            </div>
          </div>
          <Link
            href={href("/seminario-iuce")}
            className={buttonClassName() + " flex-none gap-1.5"}
          >
            {t.conocerSeminario}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Destacado */}
      {featured ? (
        <section>
          <div className="mx-auto max-w-6xl px-6 pb-2 pt-12">
            <h2 className="mb-[18px] text-xl font-bold text-gray-900">
              {t.destacado}
            </h2>
            <Reveal from="scale">
            <article className="grid overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm lg:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col gap-3.5 p-8">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full bg-diderot-pale px-3 py-[3px] text-xs font-medium text-ink">
                    {featured.type}
                  </span>
                  <span className="rounded-full bg-[#DBEAFE] px-3 py-[3px] text-xs font-medium text-[#1D4ED8]">
                    {t.proximo}
                  </span>
                </div>
                <h3 className="text-balance text-2xl font-bold leading-snug text-ink">
                  {featured.title}
                </h3>
                <div
                  className="page-block text-base leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: destacadoDesc }}
                />
                <div className="flex flex-wrap gap-5 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar
                      className="h-[15px] w-[15px] text-diderot-amber"
                      aria-hidden="true"
                    />
                    {featured.dateDisplay}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin
                      className="h-[15px] w-[15px] text-diderot-amber"
                      aria-hidden="true"
                    />
                    {featured.location}
                  </span>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                  {featured.url ? (
                    <a
                      href={featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClassName({ variant: "outline" })}
                    >
                      {t.webEvento}
                    </a>
                  ) : null}
                  {featured.newsHref ? (
                    <Link
                      href={featured.newsHref}
                      className={buttonClassName({ variant: "outline" })}
                    >
                      {t.leerCronica} →
                    </Link>
                  ) : null}
                </div>
              </div>
              {featured.image ? (
                <CoverImage
                  src={featured.image}
                  alt={featured.photoLabel}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="min-h-[280px] w-full"
                />
              ) : (
                <ImagePlaceholder
                  label={featured.photoLabel}
                  rounded="none"
                  className="min-h-[280px] w-full border-0"
                />
              )}
            </article>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Próximos */}
      {upcomingRest.length > 0 ? (
        <section>
          <div className="mx-auto max-w-6xl px-6 pb-2 pt-10">
            <h2 className="mb-[18px] text-xl font-bold text-gray-900">
              {t.proximos}
            </h2>
            <div className="flex flex-col gap-3">
              {upcomingRest.map((e, i) => (
                <Reveal key={e.key} delay={i * 90}>
                <article className="card-lift flex items-center gap-[18px] rounded-xl border border-gray-200 bg-surface-card px-[22px] py-[18px] shadow-sm hover:shadow-md">
                  <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-md bg-diderot-indigo text-white">
                    <span className="text-base font-bold leading-none">
                      {e.top}
                    </span>
                    <span className="mt-0.5 text-[10px] tracking-[.06em] opacity-85">
                      {e.bottom}
                    </span>
                  </span>
                  <div className="flex-1">
                    <h3 className="mb-[3px] text-base font-semibold text-gray-900">
                      {e.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {e.meta}
                      {e.newsHref ? (
                        <>
                          {" · "}
                          <Link
                            href={e.newsHref}
                            className="font-medium text-diderot-violet hover:underline"
                          >
                            {t.leerCronica} →
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-[18px] w-[18px] flex-none text-gray-500"
                    aria-hidden="true"
                  />
                </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Celebrados */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
          <h2 className="mb-[18px] text-xl font-bold text-gray-900">
            {t.celebrados}
          </h2>
          <div className="flex flex-col">
            {past.map((e, i) => (
              <Reveal key={e.key} delay={Math.min(i, 5) * 60}>
              <article
                className={cn(
                  "grid grid-cols-1 items-center gap-2 border-t border-gray-100 py-4 sm:grid-cols-[86px_92px_1fr_auto] sm:gap-5",
                  i === past.length - 1 && "border-b",
                )}
              >
                <span className="text-xs uppercase tracking-wider text-gray-500">
                  {e.dateRange}
                </span>
                {e.image ? (
                  <Image
                    src={e.image}
                    alt=""
                    width={184}
                    height={128}
                    className="h-16 w-[92px] rounded-md border border-gray-100 bg-white object-contain"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="hidden h-16 w-[92px] rounded-md border border-dashed border-gray-200 sm:block"
                  />
                )}
                <div>
                  <h3 className="mb-0.5 text-base font-medium text-gray-900">
                    {e.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {e.meta}
                    {e.newsHref ? (
                      <>
                        {" · "}
                        <Link
                          href={e.newsHref}
                          className="font-medium text-diderot-violet hover:underline"
                        >
                          {t.leerCronica} →
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="justify-self-start rounded-full bg-gray-100 px-3 py-[3px] text-xs font-medium text-gray-700 sm:justify-self-auto">
                  {t.celebrado}
                </span>
              </article>
              </Reveal>
            ))}
            {past.length === 0 ? (
              <p className="py-6 text-sm text-gray-500">
                {t.sinCelebrados}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
