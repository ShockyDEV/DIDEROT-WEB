import Link from "next/link";
import { ArrowRight, FileMusic, Music2 } from "lucide-react";
import { metadataBilingue } from "@/lib/metadata";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { buttonClassName } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProjectsExplorer } from "@/components/investigacion/projects-explorer";
import { getBlock, getListBlock } from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
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
    lineasDelEje: "Líneas de investigación",
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
    lineasDelEje: "Research lines",
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

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.investigacion },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.investigacion}
          </p>
          <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[75ch] text-base leading-relaxed text-gray-600"
            // Bloque editable desde el gestor (investigacion:intro)
            dangerouslySetInnerHTML={{ __html: intro }}
          />
          <div className="mt-7">
            <SectionSubnav items={subnav} />
          </div>
        </div>
      </section>

      {/* Líneas de investigación: ejes con sus líneas oficiales */}
      <section id="lineas" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-7">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.lineas}
            </h2>
            <div
              className="page-block max-w-[75ch] text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: lineasIntro }}
            />
          </div>
          <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-6">
            {lineas.map((l, i) => {
              const Icon = iconFor(l.icon);
              const descripcion = String(l.descripcion ?? "").trim();
              const sublineas = String(l.sublineas ?? "")
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <li key={i} className={spanLinea(i, lineas.length)}>
                  <Reveal delay={(i % 3) * 80} className="h-full">
                    <article className="card-lift flex h-full flex-col rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm hover:border-brand-400 hover:shadow-md">
                      <span className="mb-4 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-diderot-pale">
                        <Icon className="h-[22px] w-[22px] text-ink" aria-hidden="true" />
                      </span>
                      <h3 className="text-balance text-lg font-semibold leading-snug text-gray-900">
                        {String(l.titulo ?? "")}
                      </h3>
                      {descripcion ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {descripcion}
                        </p>
                      ) : null}
                      {sublineas.length > 0 ? (
                        <div className="mt-5 border-t border-gray-100 pt-4">
                          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-diderot-amber">
                            {t.lineasDelEje}
                          </p>
                          <ul className="flex list-none flex-col gap-2 p-0">
                            {sublineas.map((s) => (
                              <li
                                key={s}
                                className="flex items-start gap-2 text-[13px] leading-snug text-gray-700"
                              >
                                <Music2
                                  className="mt-px h-3.5 w-3.5 flex-none text-diderot-amber"
                                  aria-hidden="true"
                                />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
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
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.proyectos}
            </h2>
            <div
              className="page-block mb-6 max-w-[80ch] text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: proyectosDescripcion }}
            />
            {proyectos.length > 0 ? (
              <ProjectsExplorer
                projects={proyectos}
                currentYear={new Date().getFullYear()}
                locale={locale}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500">
                {t.sinProyectos}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {/* Puente a la producción científica (página propia) */}
      {!hiddenPaths.includes("/publicaciones") ? (
        <section>
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
            <Reveal
              from="scale"
              className="staff-lines rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-amber bg-surface-tinted p-8 shadow-sm"
            >
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-5 sm:items-center">
                  <span className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-diderot-indigo text-white">
                    <FileMusic className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                      {t.produccion}
                    </p>
                    <h2 className="text-xl font-bold text-gray-900">
                      {t.publicacionesTitulo}
                    </h2>
                    <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-gray-600">
                      {t.publicacionesTexto(totalPublicaciones)}
                    </p>
                  </div>
                </div>
                <Link
                  href={href("/publicaciones")}
                  className={cn(buttonClassName({ size: "lg" }), "flex-none gap-1.5")}
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
