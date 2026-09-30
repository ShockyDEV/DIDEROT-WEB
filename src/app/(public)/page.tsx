import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { Eyebrow, Gota } from "@/components/ui/eyebrow";
import { SoundWave } from "@/components/ui/sound-wave";
import { NewsTeaser } from "@/components/news/news-teaser";
import { PublicationCard } from "@/components/publicaciones/publication-card";
import { getPublishedNews } from "@/lib/news-service";
import { categoryLabel } from "@/lib/content/news";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getHiddenPaths, isSectionVisible } from "@/lib/page-visibility";
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
    verTodas: "Todas las noticias",
    destacadas: "Publicaciones destacadas",
    verPublicaciones: "Todas las publicaciones",
    accesos: "Secciones de la web",
    afiliacion: "Afiliación institucional",
    usal: "Universidad de Salamanca",
    iuce: "Instituto Universitario de Ciencias de la Educación (IUCE)",
    doctorado: "Programa de Doctorado «Formación en la Sociedad del Conocimiento»",
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
    verTodas: "All news",
    destacadas: "Featured publications",
    verPublicaciones: "All publications",
    accesos: "Sections of the website",
    afiliacion: "Institutional affiliation",
    usal: "University of Salamanca",
    iuce: "University Institute of Education Sciences (IUCE)",
    doctorado: "PhD Programme “Education in the Knowledge Society”",
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

/**
 * Cabecera de bloque con enlace «ver todo» subrayado a la derecha. Sin filete
 * (`rule={false}`) cuando las fichas de debajo ya llevan el suyo.
 */
function BlockHeading({
  title,
  href,
  linkLabel,
  rule = true,
}: Readonly<{ title: string; href: string; linkLabel: string; rule?: boolean }>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-3",
        rule ? "mb-8 border-b border-gray-200 pb-3" : "mb-6",
      )}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
        {title}
      </h2>
      <Link href={href} className="link-sub text-sm font-medium">
        {linkLabel}
      </Link>
    </div>
  );
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
    mostrarAccesos,
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
    // Accesos rápidos: ocultos por defecto (repetían el menú); se pueden
    // volver a mostrar desde el panel → Visualización.
    isSectionVisible("inicio-accesos"),
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
  const accesos = mostrarAccesos
    ? quickAccess.filter((item) => !oculto(String(item.enlace ?? "")))
    : [];
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
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-[72px] pt-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            {heroEyebrow ? (
              <Reveal>
                <Eyebrow className="mb-4">{heroEyebrow}</Eyebrow>
              </Reveal>
            ) : null}
            <Reveal delay={100}>
              <h1 className="mb-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-[50px]">
                {heroTitulo}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <div
                className="page-block mb-8 max-w-[52ch] text-[17px] leading-relaxed text-gray-600"
                // Bloque editable desde el gestor (inicio:hero-parrafo)
                dangerouslySetInnerHTML={{ __html: heroParrafo }}
              />
            </Reveal>
            <Reveal delay={300} className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {!oculto("/grupo") && botonPrincipal ? (
                <Link href={href("/grupo")} className={cn(buttonClassName({ size: "lg" }), "gap-2")}>
                  {botonPrincipal}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
              {!oculto("/publicaciones") && botonSecundario ? (
                <Link href={href("/publicaciones")} className="link-sub text-[15px] font-medium">
                  {botonSecundario}
                </Link>
              ) : null}
            </Reveal>
            {hitosHero.length > 0 ? (
              <Reveal delay={420}>
                <ul className="mt-10 flex list-none flex-col gap-2 border-t border-gray-200 p-0 pt-5 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:gap-x-7">
                  {hitosHero.map((h, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                      <Gota className="text-diderot-gold" />
                      {String(h.texto ?? "")}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>

          <Reveal from="right" delay={250} className="relative">
            <div className="relative h-[380px] w-full overflow-hidden rounded">
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
              <p className="pointer-events-none absolute bottom-[22px] left-0 inline-flex items-center gap-2.5 bg-diderot-indigo px-4 py-2 font-serif text-[15px] italic text-white">
                <SoundWave className="text-diderot-gold" />
                {fotoEtiqueta}
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* Accesos rápidos (ocultos por defecto: repetían el menú) */}
      {accesos.length > 0 ? (
        <section id="accesos" aria-label={t.accesos} className="border-y border-gray-200 bg-surface-page">
          <ul className="mx-auto grid max-w-6xl list-none grid-cols-1 gap-x-10 gap-y-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {accesos.map((item, i) => {
              const enlace = String(item.enlace ?? "#");
              const external = /^https?:\/\//i.test(enlace);
              return (
                <li key={enlace + i}>
                  <Link
                    href={external ? enlace : href(enlace)}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex h-full flex-col gap-1.5 border-t-2 border-gray-200 pt-4 transition-colors hover:border-diderot-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
                  >
                    <span className="text-base font-semibold text-gray-900 group-hover:text-ink">
                      {String(item.titulo ?? "")}
                    </span>
                    <span className="text-sm leading-snug text-gray-600">
                      {String(item.descripcion ?? "")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* DIDEROT en cifras (datos vivos; sin cifras, sin banda) */}
      {cifras.length > 0 ? (
        <section className="border-y border-gray-200 bg-surface-tinted">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[40ch]">
              {cifrasEyebrow ? <Eyebrow className="mb-2">{cifrasEyebrow}</Eyebrow> : null}
              <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
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
                "grid w-full list-none grid-cols-2 gap-x-8 gap-y-7 p-0 lg:w-auto",
                columnasCifras,
              )}
            >
              {cifras.map((c, i) => (
                <li key={c.texto}>
                  <Reveal from="right" delay={i * 110} className="h-full">
                    <Link
                      href={href(c.enlace)}
                      className="group flex h-full flex-col border-l-2 border-diderot-gold pl-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet lg:w-[150px]"
                    >
                      {/* CountUp arranca en 0 y anima en el cliente: el
                          lector de pantalla recibe la cifra real, fija. */}
                      <span aria-hidden="true" className="font-serif text-[44px] leading-none text-ink tabular-nums">
                        <CountUp value={String(c.valor)} />
                      </span>
                      <span aria-hidden="true" className="mt-2 text-[13px] leading-snug text-gray-600 group-hover:text-ink">
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
        <section className="bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
            <BlockHeading title={t.actualidad} href={href("/noticias")} linkLabel={t.verTodas} />
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((item, i) => (
                <Reveal key={item.slug} delay={i * 90} className="h-full">
                  <NewsTeaser
                    href={href(`/noticias/${item.slug}`)}
                    title={item.title}
                    excerpt={item.excerpt}
                    category={categoryLabel(item.category, locale)}
                    date={item.dateDisplay}
                    dateTime={item.publishedAt}
                    coverImage={item.coverImage}
                    photoLabel={item.photoLabel}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Publicaciones destacadas (featured en el panel) */}
      {mostrarDestacadas ? (
        <section className="border-t border-gray-200 bg-surface-page">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
            <BlockHeading
              title={t.destacadas}
              href={href("/publicaciones")}
              linkLabel={t.verPublicaciones}
              rule={false}
            />
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {destacadas.map((pub, i) => (
                <Reveal key={pub.id} delay={i * 90} className="h-full">
                  <PublicationCard pub={pub} locale={locale} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Cita sobre el pentagrama de la marca: serif en cursiva, sin iconos. */}
      {cita.replace(/<[^>]+>/g, "").trim() ? (
        <section className="staff-lines border-y border-gray-200 bg-surface-tinted">
          <Reveal className="mx-auto max-w-6xl px-6 py-14">
            <figure className="mx-auto max-w-4xl border-l-2 border-diderot-gold pl-6 sm:pl-8">
              <blockquote
                className="page-block font-serif text-[22px] italic leading-snug text-gray-900 sm:text-[26px]"
                // Bloque editable desde el gestor (inicio:cita)
                dangerouslySetInnerHTML={{ __html: cita }}
              />
              {citaAutor ? (
                <figcaption className="mt-5 text-sm font-semibold text-diderot-amber">
                  {citaAutor}
                </figcaption>
              ) : null}
            </figure>
          </Reveal>
        </section>
      ) : null}

      {/* Afiliaciones: USAL, IUCE y Programa de Doctorado */}
      <section className="bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-7 text-center font-serif text-lg italic text-gray-500">
            {t.afiliacion}
          </h2>
          <ul className="flex list-none flex-wrap items-center justify-center gap-x-14 gap-y-6 p-0">
            <li>
              <a
                href={SITE.links.usal}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.usal}
                className="block rounded-sm p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
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
                className="block rounded-sm p-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              >
                <Image src="/images/afiliaciones/iuce-logo.png" alt="" width={800} height={362} className="h-12 w-auto dark:hidden" />
                <Image src="/images/afiliaciones/iuce-logo-white.webp" alt="" width={640} height={196} className="hidden h-11 w-auto dark:block" />
              </a>
            </li>
            <li>
              {/* El programa no tiene logotipo propio: enlace de texto. */}
              <a
                href={SITE.links.doctorado}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-[34ch] items-start gap-2.5 text-sm font-medium leading-snug text-gray-700"
              >
                <GraduationCap className="mt-0.5 h-5 w-5 flex-none text-diderot-amber" aria-hidden="true" />
                <span className="link-sub">{t.doctorado}</span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
