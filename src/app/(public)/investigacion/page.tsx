import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { metadataBilingue } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/page-header";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { buttonClassName } from "@/components/ui/button";
import { Eyebrow, Gota } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { ProjectsExplorer } from "@/components/investigacion/projects-explorer";
import { getBlock, getListBlock } from "@/lib/content-blocks-service";
import { cn } from "@/lib/cn";
import { getPublicProjects } from "@/lib/projects-service";
import { countPublishedPublications } from "@/lib/publications-service";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import {
  assertVisible,
  getHiddenPaths,
  isSectionVisible,
} from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Investigación",
    description:
      "Líneas de investigación y proyectos de DIDEROT: educación musical, artes performativas y tecnología (Music Encoding Initiative, recursos digitales, lectoescritura musical, arte y tecnología).",
  },
  {
    title: "Research",
    description:
      "DIDEROT research lines and projects: music education, the performing arts and technology (Music Encoding Initiative, digital resources, music literacy, art and technology).",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques; los proyectos, desde la BD).
const T = {
  es: {
    inicio: "Inicio",
    investigacion: "Investigación",
    titulo: "La investigación de DIDEROT",
    lineas: "Líneas de investigación",
    proyectos: "Proyectos",
    resumen: (ejes: number, lineas: number) =>
      `${ejes} ${ejes === 1 ? "eje" : "ejes"} y ${lineas} ${lineas === 1 ? "línea oficial" : "líneas oficiales"} de investigación`,
    sinProyectos:
      "Todavía no hay proyectos publicados. Muy pronto podrás consultarlos aquí.",
    produccion: "Producción científica",
    publicacionesTitulo: "Publicaciones del grupo",
    publicacionesTexto: (n: number) =>
      n > 0
        ? `${n.toLocaleString("es-ES")} referencias (artículos, libros, capítulos y comunicaciones), con filtros por tipo, año y texto.`
        : "Artículos, libros, capítulos y comunicaciones, con filtros por tipo, año y texto.",
    verPublicaciones: "Ver las publicaciones",
  },
  en: {
    inicio: "Home",
    investigacion: "Research",
    titulo: "Research at DIDEROT",
    lineas: "Research lines",
    proyectos: "Projects",
    resumen: (ejes: number, lineas: number) =>
      `${ejes} ${ejes === 1 ? "area" : "areas"} and ${lineas} official research ${lineas === 1 ? "line" : "lines"}`,
    sinProyectos: "No projects have been published yet. They will be listed here soon.",
    produccion: "Scientific output",
    publicacionesTitulo: "The group's publications",
    publicacionesTexto: (n: number) =>
      n > 0
        ? `${n.toLocaleString("en-GB")} references (articles, books, chapters and conference papers), with filters by type, year and text.`
        : "Articles, books, chapters and conference papers, with filters by type, year and text.",
    verPublicaciones: "See the publications",
  },
} as const;

/**
 * Columnas de cada tarjeta de línea en una rejilla de 6 (lg) y 2 (sm), para
 * que la última fila nunca quede coja: con 5 ejes, 3 arriba y 2 más anchos
 * abajo; con 4, dos filas de 2; en sm, si sobra una, ocupa la fila entera.
 */
function spanLinea(i: number, n: number): string {
  const sm = n % 2 === 1 && i === n - 1 ? "sm:col-span-2" : "";
  let lg = "lg:col-span-2";
  if (n === 1) lg = "lg:col-span-6";
  else if (n % 3 === 2 && i >= n - 2) lg = "lg:col-span-3";
  else if (n % 3 === 1 && i >= n - 4) lg = "lg:col-span-3";
  return cn(sm, lg);
}

export default async function InvestigacionPage() {
  await assertVisible("investigacion");

  // La sección de Proyectos se puede ocultar desde el panel (Visualización →
  // Secciones); si está oculta, ni se consulta ni se ofrece en la subnav.
  const proyectosVisibles = await isSectionVisible("seccion-proyectos");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);

  // Contenido editable (panel → Contenido → Páginas → Investigación) y datos.
  const [intro, lineasIntro, lineas, proyectosDescripcion, proyectos, totalPublicaciones, hiddenPaths] =
    await Promise.all([
      getBlock("investigacion", "intro"),
      getBlock("investigacion", "lineas-intro"),
      getListBlock("investigacion", "list:lineas"),
      getBlock("investigacion", "proyectos-descripcion"),
      proyectosVisibles ? getPublicProjects(locale) : Promise.resolve([]),
      countPublishedPublications(),
      getHiddenPaths(),
    ]);

  // Mismos ids que el desplegable «Investigación» de la cabecera.
  const subnav = [
    { id: "lineas", label: t.lineas },
    ...(proyectosVisibles ? [{ id: "proyectos", label: t.proyectos }] : []),
  ];

  // Antetítulo informativo: cuántos ejes y líneas oficiales hay (datos de la
  // propia lista, sin cifras inventadas).
  const sublineasDe = (l: (typeof lineas)[number]) =>
    String(l.sublineas ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  const totalSublineas = lineas.reduce((n, l) => n + sublineasDe(l).length, 0);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.investigacion }]}
        eyebrow={lineas.length > 0 ? t.resumen(lineas.length, totalSublineas) : undefined}
        title={t.titulo}
        intro={intro}
      >
        <div className="mt-8">
          <SectionSubnav items={subnav} />
        </div>
      </PageHeader>

      {/* Líneas de investigación: ejes con sus líneas oficiales */}
      <section id="lineas" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-10">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.lineas}
            </h2>
            <div
              className="page-block max-w-[66ch] text-[15px] text-gray-600"
              dangerouslySetInnerHTML={{ __html: lineasIntro }}
            />
          </div>
          <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-6">
            {lineas.map((l, i) => {
              const descripcion = String(l.descripcion ?? "").trim();
              const sublineas = sublineasDe(l);
              return (
                <li key={i} className={spanLinea(i, lineas.length)}>
                  <Reveal delay={(i % 3) * 80} className="h-full">
                    <article className="flex h-full flex-col border-t-2 border-diderot-gold pt-5">
                      <h3 className="text-balance text-xl font-semibold leading-snug text-gray-900">
                        {String(l.titulo ?? "")}
                      </h3>
                      {descripcion ? (
                        <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
                          {descripcion}
                        </p>
                      ) : null}
                      {sublineas.length > 0 ? (
                        <ul className="mt-5 flex list-none flex-col gap-2.5 p-0">
                          {sublineas.map((s) => (
                            <li
                              key={s}
                              className="flex items-baseline gap-2.5 text-sm leading-snug text-gray-700"
                            >
                              <Gota className="text-diderot-gold" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Proyectos (solo si la sección está activada en el panel) */}
      {proyectosVisibles ? (
        <section
          id="proyectos"
          className="scroll-mt-20 border-y border-gray-200 bg-surface-card"
        >
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.proyectos}
            </h2>
            <div
              className="page-block mb-8 max-w-[70ch] text-[15px] text-gray-600"
              dangerouslySetInnerHTML={{ __html: proyectosDescripcion }}
            />
            {proyectos.length > 0 ? (
              <ProjectsExplorer
                projects={proyectos}
                currentYear={new Date().getFullYear()}
                locale={locale}
              />
            ) : (
              <p className="note border-y border-gray-200 py-10 text-center text-base">
                {t.sinProyectos}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {/* Puente a la producción científica (página propia) */}
      {!hiddenPaths.includes("/publicaciones") ? (
        <section className="staff-lines bg-surface-tinted">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal>
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <Eyebrow className="mb-2">{t.produccion}</Eyebrow>
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                    {t.publicacionesTitulo}
                  </h2>
                  <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-gray-600">
                    {t.publicacionesTexto(totalPublicaciones)}
                  </p>
                </div>
                <Link
                  href={href("/publicaciones")}
                  className={cn(buttonClassName({ size: "lg" }), "flex-none gap-2")}
                >
                  {t.verPublicaciones}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
