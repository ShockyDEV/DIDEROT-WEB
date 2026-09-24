import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Quote } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { CoverImage } from "@/components/news/cover-image";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { SoundWave } from "@/components/ui/sound-wave";
import { PublicationCard } from "@/components/publicaciones/publication-card";
import { getPublishedNews } from "@/lib/news-service";
import { categoryLabel } from "@/lib/content/news";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getHiddenPaths } from "@/lib/page-visibility";
import { prisma } from "@/lib/prisma";
import { countActiveMembers } from "@/lib/members-service";
import { getProjectStats } from "@/lib/projects-service";
import {
  countPublishedPublications,
  getFeaturedPublications,
} from "@/lib/publications-service";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

type Plural = readonly [singular: string, plural: string];

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques/noticias/publicaciones).
const T = {
  es: {
    altFoto:
      "Aula performativa del proyecto DIDEROT: un portátil muestra una partitura junto a un teclado musical, en un aula en penumbra con luz azul",
    cifrasAria: "Cifras del grupo",
    miembros: ["integrante del equipo", "integrantes del equipo"] as Plural,
    proyectos: ["proyecto financiado", "proyectos financiados"] as Plural,
    publicaciones: [
      "publicación científica",
      "publicaciones científicas",
    ] as Plural,
    europeos: ["proyecto europeo", "proyectos europeos"] as Plural,
    eventos: ["evento", "eventos y jornadas"] as Plural,
    actualidad: "Actualidad",
    verTodas: "Ver todas las noticias →",
    destacadas: "Publicaciones destacadas",
    verPublicaciones: "Ver todas las publicaciones →",
    afiliacion: "Afiliación institucional",
    usal: "Universidad de Salamanca",
    iuce: "Instituto Universitario de Ciencias de la Educación (IUCE)",
    doctorado: "Doctorado «Formación en la Sociedad del Conocimiento»",
    doctoradoAria:
      "Programa de Doctorado «Formación en la Sociedad del Conocimiento»",
  },
  en: {
    altFoto:
      "Performative classroom of the DIDEROT project: a laptop shows a musical score next to a keyboard, in a dim classroom lit in blue",
    cifrasAria: "The group in figures",
    miembros: ["team member", "team members"] as Plural,
    proyectos: ["funded project", "funded projects"] as Plural,
    publicaciones: [
      "scientific publication",
      "scientific publications",
    ] as Plural,
    europeos: ["European project", "European projects"] as Plural,
    eventos: ["event", "events"] as Plural,
    actualidad: "Latest news",
    verTodas: "See all news →",
    destacadas: "Featured publications",
    verPublicaciones: "See all publications →",
    afiliacion: "Institutional affiliation",
    usal: "University of Salamanca",
    iuce: "University Institute of Education Sciences (IUCE)",
    doctorado: "PhD Programme “Education in the Knowledge Society”",
    doctoradoAria: "PhD Programme “Education in the Knowledge Society”",
  },
} as const;

/** Eventos no cancelados (última cifra de reserva de la banda). */
async function countEvents(): Promise<number> {
  try {
    return await prisma.event.count({
      where: { status: { not: "CANCELLED" } },
    });
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);

  // Contenido editable (panel → Contenido → Páginas → Inicio) + datos vivos.
  const [
    heroEyebrow,
    heroTitulo,
    heroParrafo,
    botonPrincipal,
    botonSecundario,
    fotoEtiqueta,
    hitosHero,
    quickAccess,
    cifrasEyebrow,
    cifrasTitulo,
    cifrasParrafo,
    cita,
    citaAutor,
    latestNews,
    destacadas,
    miembros,
    proyectos,
    publicaciones,
    eventos,
    hiddenPaths,
  ] = await Promise.all([
    getBlockText("inicio", "hero-eyebrow"),
    getBlockText("inicio", "hero-titulo"),
    getBlock("inicio", "hero-parrafo"),
    getBlockText("inicio", "hero-boton-principal"),
    getBlockText("inicio", "hero-boton-secundario"),
    getBlockText("inicio", "hero-foto-etiqueta"),
    getListBlock("inicio", "list:hitos-hero"),
    getListBlock("inicio", "list:accesos-rapidos"),
    getBlockText("inicio", "cifras-eyebrow"),
    getBlockText("inicio", "cifras-titulo"),
    getBlock("inicio", "cifras-parrafo"),
    getBlock("inicio", "cita"),
    getBlockText("inicio", "cita-autor"),
    getPublishedNews().then((n) => n.slice(0, 3)),
    getFeaturedPublications(3),
    countActiveMembers(),
    getProjectStats(),
    countPublishedPublications(),
    countEvents(),
    getHiddenPaths(),
  ]);

  // Una página (o sección con ancla) oculta desde el panel → Visualización
  // no se ofrece en ningún enlace de la portada: llevaría a un 404 o a un
  // ancla que no existe. «/investigacion#proyectos» cae si se oculta la
  // sección o la página entera.
  const oculto = (enlace: string) => {
    if (/^https?:\/\//i.test(enlace)) return false;
    const base = enlace.split("#")[0] || "/";
    return hiddenPaths.includes(enlace) || hiddenPaths.includes(base);
  };
  const accesos = quickAccess.filter((item) => !oculto(String(item.enlace ?? "")));
  const plural = (n: number, [uno, varios]: Plural) => (n === 1 ? uno : varios);

  // «DIDEROT en cifras»: solo datos vivos de la BD. Se enseñan hasta cuatro
  // cifras por este orden de prioridad, sin ceros (con BD vacía o caída la
  // banda desaparece entera); «eventos» solo entra si falta otra.
  const cifras = [
    { valor: miembros, texto: plural(miembros, t.miembros), enlace: "/grupo#equipo" },
    { valor: proyectos.total, texto: plural(proyectos.total, t.proyectos), enlace: "/investigacion#proyectos" },
    { valor: publicaciones, texto: plural(publicaciones, t.publicaciones), enlace: "/publicaciones" },
    { valor: proyectos.european, texto: plural(proyectos.european, t.europeos), enlace: "/investigacion#proyectos" },
    { valor: eventos, texto: plural(eventos, t.eventos), enlace: "/eventos" },
  ]
    .filter((c) => c.valor > 0 && !oculto(c.enlace))
    .slice(0, 4);
  // Rejilla sin huecos: tantas columnas como cifras (clases literales para
  // que Tailwind las genere).
  const columnasCifras = ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"][cifras.length];

  const mostrarNoticias = latestNews.length > 0 && !oculto("/noticias");
  const mostrarDestacadas = destacadas.length > 0 && !oculto("/publicaciones");

  return (
    <>
      {/* Héroe */}
      <section className="bg-surface-card">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-[68px] pt-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                {heroEyebrow}
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mb-[18px] text-balance text-4xl font-bold leading-tight tracking-tight text-ink sm:text-[44px]">
                {heroTitulo}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <div
                className="page-block mb-7 max-w-[52ch] text-base leading-relaxed text-gray-600"
                // Bloque editable desde el gestor (inicio:hero-parrafo)
                dangerouslySetInnerHTML={{ __html: heroParrafo }}
              />
            </Reveal>
            <Reveal delay={300} className="flex flex-wrap items-center gap-3">
              {!oculto("/grupo") && botonPrincipal ? (
                <Link href={href("/grupo")} className={buttonClassName({ size: "lg" })}>
                  {botonPrincipal}
                </Link>
              ) : null}
              {!oculto("/publicaciones") && botonSecundario ? (
                <Link
                  href={href("/publicaciones")}
                  className={buttonClassName({ variant: "outline", size: "lg" })}
                >
                  {botonSecundario}
                </Link>
              ) : null}
            </Reveal>
            {hitosHero.length > 0 ? (
              <Reveal
                delay={420}
                className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-gray-100 pt-5 text-xs text-gray-500"
              >
                {hitosHero.map((h, i) => {
                  const Icon = iconFor(h.icon);
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 flex-none text-diderot-amber" aria-hidden="true" />
                      {String(h.texto ?? "")}
                    </span>
                  );
                })}
              </Reveal>
            ) : null}
          </div>

          <Reveal from="right" delay={250} className="relative">
            <div className="relative h-[380px] w-full overflow-hidden rounded-xl">
              <Image
                src="/images/aula-performativa.jpg"
                alt={t.altFoto}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                // Foto panorámica (3:1): se encuadra hacia el portátil con la
                // partitura, que es lo que cuenta la imagen.
                className="object-cover object-[68%_50%]"
              />
            </div>
            {fotoEtiqueta ? (
              <div className="pointer-events-none absolute bottom-[22px] left-0 inline-flex items-center gap-2.5 rounded-r-md bg-diderot-indigo px-3.5 py-2 text-xs text-white">
                <SoundWave className="text-diderot-gold" />
                {fotoEtiqueta}
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* Accesos rápidos */}
      {accesos.length > 0 ? (
        <section className="border-y border-gray-200 bg-surface-page">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
            {accesos.map((item, i) => {
              const Icon = iconFor(item.icon);
              const enlace = String(item.enlace ?? "#");
              const external = /^https?:\/\//i.test(enlace);
              return (
                <Reveal key={enlace + i} delay={i * 80} className="h-full">
                  <Link
                    href={external ? enlace : href(enlace)}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="card-lift flex h-full flex-col gap-2.5 rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
                  >
                    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-md bg-diderot-pale">
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          item.destacado ? "text-diderot-amber" : "text-ink",
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-base font-semibold text-gray-900">
                      {String(item.titulo ?? "")}
                    </span>
                    <span className="text-xs leading-snug text-gray-500">
                      {String(item.descripcion ?? "")}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* DIDEROT en cifras (datos vivos; sin cifras, sin banda) */}
      {cifras.length > 0 ? (
        <section className="border-b border-gray-200 bg-surface-tinted">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-7 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[38ch]">
              {cifrasEyebrow ? (
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                  {cifrasEyebrow}
                </p>
              ) : null}
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                {cifrasTitulo}
              </h2>
              <div
                className="page-block text-sm leading-relaxed text-gray-600"
                dangerouslySetInnerHTML={{ __html: cifrasParrafo }}
              />
            </div>
            <ul
              aria-label={t.cifrasAria}
              className={cn(
                "grid w-full list-none grid-cols-2 gap-3.5 p-0 lg:w-auto",
                columnasCifras,
              )}
            >
              {cifras.map((c, i) => (
                <li key={c.texto}>
                  <Reveal from="right" delay={i * 110} className="h-full">
                    <Link
                      href={href(c.enlace)}
                      className="card-lift flex h-full flex-col justify-center rounded-xl border border-gray-200 bg-surface-card p-5 text-center shadow-sm hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-tinted lg:w-[156px]"
                    >
                      {/* CountUp arranca en 0 y anima en el cliente: el
                          lector de pantalla recibe la cifra real, fija. */}
                      <span aria-hidden="true" className="text-[26px] font-bold leading-tight text-ink">
                        <CountUp value={String(c.valor)} />
                      </span>
                      <span aria-hidden="true" className="mt-1 text-[11px] leading-snug text-gray-500">
                        {c.texto}
                      </span>
                      <span className="sr-only">{`${c.valor} ${c.texto}`}</span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Actualidad (sin noticias publicadas, sin sección) */}
      {mostrarNoticias ? (
        <section className="border-b border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t.actualidad}
              </h2>
              <Link
                href={href("/noticias")}
                className="inline-flex min-h-6 items-center text-sm font-medium text-diderot-violet hover:underline"
              >
                {t.verTodas}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((item, i) => (
                <Reveal key={item.slug} delay={i * 90} className="h-full">
                  <Link
                    href={href(`/noticias/${item.slug}`)}
                    className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
                  >
                    <article className="card-lift flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm hover:border-brand-400 hover:shadow-md">
                      <CoverImage
                        src={item.coverImage}
                        alt={item.photoLabel}
                        zoom
                        className="h-[150px] w-full"
                      />
                      <div className="flex flex-col gap-2 px-5 pb-5 pt-[18px]">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 font-medium text-ink">
                            {categoryLabel(item.category, locale)}
                          </span>
                          <span className="text-gray-500">{item.dateDisplay}</span>
                        </div>
                        <h3 className="text-base font-semibold leading-snug text-gray-900">
                          {item.title}
                        </h3>
                        {item.excerpt ? (
                          <p className="line-clamp-3 text-sm leading-normal text-gray-600">
                            {item.excerpt}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Publicaciones destacadas (featured en el panel) */}
      {mostrarDestacadas ? (
        <section className="border-b border-gray-200 bg-surface-page">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t.destacadas}
              </h2>
              <Link
                href={href("/publicaciones")}
                className="inline-flex min-h-6 items-center text-sm font-medium text-diderot-violet hover:underline"
              >
                {t.verPublicaciones}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destacadas.map((pub, i) => (
                <Reveal key={pub.id} delay={i * 90} className="h-full">
                  <PublicationCard pub={pub} locale={locale} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Banda de cita (en lugar de la banda de la revista EKS del IUCE),
          sobre el pentagrama de fondo de la marca DIDEROT. */}
      {cita.replace(/<[^>]+>/g, "").trim() ? (
        <section className="staff-lines border-b border-gray-200 bg-surface-tinted">
          <Reveal from="scale" className="mx-auto max-w-6xl px-6 py-12">
            <div className="mx-auto flex max-w-4xl flex-col gap-5 sm:flex-row sm:gap-7">
              <span
                aria-hidden="true"
                className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-md bg-diderot-indigo text-white"
              >
                <Quote className="h-5 w-5" />
              </span>
              <figure className="min-w-0">
                <blockquote
                  className="page-block text-lg italic leading-relaxed text-gray-900 sm:text-xl"
                  // Bloque editable desde el gestor (inicio:cita)
                  dangerouslySetInnerHTML={{ __html: cita }}
                />
                {citaAutor ? (
                  <figcaption className="mt-4 flex items-center gap-3 text-sm font-semibold text-diderot-amber">
                    <span aria-hidden="true" className="h-0.5 w-8 flex-none rounded-full bg-diderot-gold" />
                    {citaAutor}
                  </figcaption>
                ) : null}
              </figure>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* Afiliaciones: USAL, IUCE y Programa de Doctorado */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="mb-6 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
            {t.afiliacion}
          </h2>
          <ul className="flex list-none flex-wrap items-center justify-center gap-x-12 gap-y-6 p-0">
            <li>
              <a
                href={SITE.links.usal}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.usal}
                className="block rounded-md p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              >
                <Image src="/images/usal-logo.png" alt="" width={854} height={232} className="h-11 w-auto dark:hidden" />
                <Image src="/images/usal-logo-white.webp" alt="" width={640} height={177} className="hidden h-11 w-auto dark:block" />
              </a>
            </li>
            <li>
              <a
                href={SITE.links.iuce}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.iuce}
                className="block rounded-md p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              >
                <Image src="/images/afiliaciones/iuce-logo.png" alt="" width={800} height={362} className="h-12 w-auto dark:hidden" />
                <Image src="/images/afiliaciones/iuce-logo-white.webp" alt="" width={640} height={196} className="hidden h-11 w-auto dark:block" />
              </a>
            </li>
            <li>
              {/* El programa no tiene logotipo propio: chip de texto. */}
              <a
                href={SITE.links.doctorado}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.doctoradoAria}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-gray-200 bg-surface-page px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-diderot-violet hover:text-diderot-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              >
                <GraduationCap className="h-5 w-5 flex-none text-diderot-amber" aria-hidden="true" />
                {t.doctorado}
              </a>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
