import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { metadataBilingue } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClassName } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Pagination } from "@/components/ui/pagination";
import { Reveal } from "@/components/ui/reveal";
import { AutoSubmitSelect } from "@/components/publicaciones/auto-submit-select";
import { PublicationReference } from "@/components/publicaciones/publication-reference";
import { getBlock, getBlockText } from "@/lib/content-blocks-service";
import { PUBLICATION_TYPES } from "@/lib/content/publication-types";
import { getMemberOrcids, safeHttpUrl } from "@/lib/members-service";
import {
  PUBLICATION_TYPE_SLUGS,
  parsePublicationType,
  searchPublications,
  type PublicPublication,
  type PublicationFilters,
} from "@/lib/publications-service";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Publicaciones",
    description:
      "Producción científica del grupo DIDEROT: artículos, libros, capítulos y comunicaciones sobre educación musical, artes performativas y tecnología.",
  },
  {
    title: "Publications",
    description:
      "Scientific output of the DIDEROT group: articles, books, chapters and conference papers on music education, the performing arts and technology.",
  },
);

const PAGE_SIZE = 20;

// Textos fijos de la página en ambos idiomas (las referencias se muestran
// tal cual están en la BD; son datos bibliográficos, no se traducen).
const T = {
  es: {
    inicio: "Inicio",
    publicaciones: "Publicaciones",
    eyebrow: "Producción científica",
    filtrarTipo: "Filtrar por tipo de publicación",
    todas: "Todas",
    buscarEnPublicaciones: "Buscar en las publicaciones",
    placeholder: "Título, autoría, revista o editorial…",
    textoABuscar: "Texto a buscar en título, autoría o revista",
    filtrarAnio: "Filtrar por año",
    todosLosAnios: "Todos los años",
    buscar: "Buscar",
    limpiar: "Limpiar filtros",
    listado: "Listado de publicaciones",
    mostrando: (desde: number, hasta: number, total: number) =>
      total === 1
        ? "1 publicación"
        : desde === 1 && hasta === total
          ? `${total} publicaciones`
          : `Mostrando ${desde}–${hasta} de ${total} publicaciones`,
    para: (q: string) => ` para «${q}»`,
    enAnio: (n: number) => (n === 1 ? "1 publicación" : `${n} publicaciones`),
    sinResultados: (q: string, otrosFiltros: boolean) =>
      q
        ? `Ninguna publicación coincide con «${q}»${otrosFiltros ? " con los filtros elegidos" : ""}.`
        : "Ninguna publicación coincide con los filtros elegidos.",
    vacioTitulo: "Estamos incorporando nuestras publicaciones",
    vacioTexto:
      "Muy pronto encontrarás aquí la producción científica del grupo. Mientras tanto, puedes consultarla en el Portal de Producción Científica de la Universidad de Salamanca.",
    paginacion: "Paginación de publicaciones",
    anterior: "Anterior",
    siguiente: "Siguiente",
    pagina: (n: number) => `Página ${n}`,
    portalEyebrow: "Portal de Producción Científica de la USAL",
    portalTitulo: "Toda la producción de los miembros",
    irAlPortal: "Ir al Portal",
    orcidTitulo: "Perfiles ORCID del equipo",
    orcidTexto:
      "El identificador ORCID de cada investigador reúne su producción científica completa.",
    orcidDe: (n: string) => `Perfil ORCID de ${n}`,
  },
  en: {
    inicio: "Home",
    publicaciones: "Publications",
    eyebrow: "Scientific output",
    filtrarTipo: "Filter by publication type",
    todas: "All",
    buscarEnPublicaciones: "Search the publications",
    placeholder: "Title, author, journal or publisher…",
    textoABuscar: "Text to search in title, authors or journal",
    filtrarAnio: "Filter by year",
    todosLosAnios: "All years",
    buscar: "Search",
    limpiar: "Clear filters",
    listado: "List of publications",
    mostrando: (desde: number, hasta: number, total: number) =>
      total === 1
        ? "1 publication"
        : desde === 1 && hasta === total
          ? `${total} publications`
          : `Showing ${desde}–${hasta} of ${total} publications`,
    para: (q: string) => ` for “${q}”`,
    enAnio: (n: number) => (n === 1 ? "1 publication" : `${n} publications`),
    sinResultados: (q: string, otrosFiltros: boolean) =>
      q
        ? `No publications match “${q}”${otrosFiltros ? " with the selected filters" : ""}.`
        : "No publications match the selected filters.",
    vacioTitulo: "We are adding our publications",
    vacioTexto:
      "The group's scientific output will be listed here very soon. In the meantime, you can browse it on the University of Salamanca Research Portal.",
    paginacion: "Publications pagination",
    anterior: "Previous",
    siguiente: "Next",
    pagina: (n: number) => `Page ${n}`,
    portalEyebrow: "University of Salamanca Research Portal",
    portalTitulo: "All our members' output",
    irAlPortal: "Go to the Portal",
    orcidTitulo: "Team ORCID profiles",
    orcidTexto:
      "Each researcher's ORCID identifier brings together their complete scientific output.",
    orcidDe: (n: string) => `ORCID profile of ${n}`,
  },
} as const;

interface PageProps {
  searchParams: {
    tipo?: string | string[];
    anio?: string | string[];
    q?: string | string[];
    pagina?: string | string[];
  };
}

/** Primer valor de un parámetro de la URL (?q=a&q=b → «a»). */
function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** URL del listado con los filtros (en español; withLocale añade /en). */
function pageHref(f: PublicationFilters, pagina: number): string {
  const params = new URLSearchParams();
  if (f.type) params.set("tipo", PUBLICATION_TYPE_SLUGS[f.type]);
  if (f.year) params.set("anio", String(f.year));
  if (f.q) params.set("q", f.q);
  if (pagina > 1) params.set("pagina", String(pagina));
  const qs = params.toString();
  return qs ? `/publicaciones?${qs}` : "/publicaciones";
}

/** Agrupa la página actual por año (ya viene ordenada: año desc). */
function porAnio(items: PublicPublication[]) {
  const grupos: Array<{ year: number; items: PublicPublication[] }> = [];
  for (const p of items) {
    const last = grupos[grupos.length - 1];
    if (last && last.year === p.year) last.items.push(p);
    else grupos.push({ year: p.year, items: [p] });
  }
  return grupos;
}

const campoClass =
  "h-10 rounded-md border border-gray-300 bg-surface-card text-sm outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

export default async function PublicacionesPage({
  searchParams,
}: Readonly<PageProps>) {
  await assertVisible("publicaciones");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);

  // Filtros de la URL (?tipo=&anio=&q=&pagina=), validados: lo que no encaja
  // se ignora en vez de romper la página.
  const anioParam = first(searchParams.anio);
  const filtros: PublicationFilters = {
    type: parsePublicationType(first(searchParams.tipo)),
    year: /^\d{4}$/.test(anioParam) ? Number(anioParam) : null,
    q: first(searchParams.q).trim().slice(0, 100),
  };
  const paginaPedida = Math.max(1, parseInt(first(searchParams.pagina), 10) || 1);
  const lh = (f: PublicationFilters, p: number) => href(pageHref(f, p));

  const [resultado, intro, portalDescripcion, urlPortalBloque, orcids] =
    await Promise.all([
      searchPublications(filtros, paginaPedida, PAGE_SIZE),
      getBlock("publicaciones", "intro"),
      getBlock("publicaciones", "portal-descripcion"),
      getBlockText("publicaciones", "url-portal"),
      getMemberOrcids(),
    ]);
  const urlPortal = safeHttpUrl(urlPortalBloque);

  const { items, total, page, totalPages, typeCounts, allTypesCount, yearCounts } =
    resultado;
  const catalogoVacio = resultado.grandTotal === 0;
  const hayFiltros = Boolean(filtros.type || filtros.year || filtros.q);
  const sinFiltros: PublicationFilters = { type: null, year: null, q: "" };

  // Años del selector (con su recuento); el elegido siempre figura aunque
  // con el resto de filtros no tenga publicaciones.
  const anios = [...yearCounts];
  if (filtros.year && !anios.some((y) => y.year === filtros.year)) {
    anios.push({ year: filtros.year, count: 0 });
    anios.sort((a, b) => b.year - a.year);
  }
  // Pestañas: solo los tipos con publicaciones (más el activo, si no tuviera).
  const tipos = PUBLICATION_TYPES.filter(
    (pt) => (typeCounts[pt.value] ?? 0) > 0 || pt.value === filtros.type,
  );
  const recuentoAnio = new Map(yearCounts.map((y) => [y.year, y.count]));
  const desde = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.publicaciones }]}
        eyebrow={t.eyebrow}
        title={t.publicaciones}
        intro={intro}
        className={catalogoVacio ? undefined : "pb-8"}
      >
        {!catalogoVacio ? (
          <>
            {/* Tipos: pestañas de texto (funcionan sin JS) con su recuento */}
            <nav aria-label={t.filtrarTipo} className="tabs mt-8">
              <Link
                href={lh({ ...filtros, type: null }, 1)}
                aria-current={!filtros.type ? "page" : undefined}
                className="tab"
              >
                {t.todas}
                <span className="tab-count">{allTypesCount}</span>
              </Link>
              {tipos.map((pt) => {
                const activo = filtros.type === pt.value;
                return (
                  <Link
                    key={pt.value}
                    href={lh({ ...filtros, type: pt.value }, 1)}
                    aria-current={activo ? "page" : undefined}
                    className="tab"
                  >
                    {locale === "en" ? pt.pluralEn : pt.plural}
                    <span className="tab-count">{typeCounts[pt.value] ?? 0}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Búsqueda y año: formulario GET, se resuelve en el servidor */}
            <form
              method="get"
              action={href("/publicaciones")}
              role="search"
              aria-label={t.buscarEnPublicaciones}
              className="mt-5 flex flex-wrap items-center gap-2.5"
            >
              {filtros.type ? (
                <input
                  type="hidden"
                  name="tipo"
                  value={PUBLICATION_TYPE_SLUGS[filtros.type]}
                />
              ) : null}
              <div className="relative min-w-0 flex-1 basis-[220px] sm:w-[340px] sm:flex-none">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={filtros.q}
                  maxLength={100}
                  placeholder={t.placeholder}
                  aria-label={t.textoABuscar}
                  className={cn(campoClass, "w-full pl-10 pr-4 text-gray-900 placeholder:text-gray-500")}
                />
              </div>
              <AutoSubmitSelect
                name="anio"
                defaultValue={filtros.year ? String(filtros.year) : ""}
                aria-label={t.filtrarAnio}
                className={cn(campoClass, "px-3.5 text-gray-700")}
              >
                <option value="">{t.todosLosAnios}</option>
                {anios.map((y) => (
                  // Un solo texto: <option> no admite nodos intermedios.
                  <option key={y.year} value={y.year}>
                    {`${y.year} (${y.count})`}
                  </option>
                ))}
              </AutoSubmitSelect>
              <button type="submit" className={buttonClassName()}>
                {t.buscar}
              </button>
              {hayFiltros ? (
                <Link href={lh(sinFiltros, 1)} className="link-sub ml-1 text-sm font-medium">
                  {t.limpiar}
                </Link>
              ) : null}
            </form>
          </>
        ) : null}
      </PageHeader>

      {/* Listado por años */}
      <section aria-labelledby="listado-publicaciones">
        <div className="mx-auto max-w-6xl px-6 pb-6 pt-10">
          <h2 id="listado-publicaciones" className="sr-only">
            {t.listado}
          </h2>

          {catalogoVacio ? (
            <div className="border-y border-gray-200 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-gray-900">{t.vacioTitulo}</p>
              <p className="mx-auto mt-2 max-w-[60ch] text-[15px] leading-relaxed text-gray-600">
                {t.vacioTexto}
              </p>
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClassName({ variant: "outline" }), "mt-6 gap-1.5")}
                >
                  {t.irAlPortal}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : total === 0 ? (
            <div className="border-y border-gray-200 px-6 py-12 text-center">
              <p className="note text-base">
                {t.sinResultados(filtros.q, Boolean(filtros.type || filtros.year))}
              </p>
              <Link href={lh(sinFiltros, 1)} className="link-sub mt-3 inline-block text-sm font-medium">
                {t.limpiar}
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-500">
                {t.mostrando(desde, hasta, total)}
                {filtros.q ? t.para(filtros.q) : null}
              </p>
              <div className="flex flex-col gap-10">
                {porAnio(items).map((g) => (
                  <section
                    key={g.year}
                    aria-labelledby={`anio-${g.year}`}
                    className="grid gap-x-10 gap-y-2 border-t border-gray-300 pt-8 lg:grid-cols-[150px_1fr]"
                  >
                    {/* El año acompaña a su bloque mientras se lee (lg). */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                      <h3
                        id={`anio-${g.year}`}
                        className="font-serif text-[42px] leading-none tabular-nums text-ink"
                      >
                        {g.year}
                      </h3>
                      <p className="mt-2 text-[13px] text-gray-500">
                        {t.enAnio(recuentoAnio.get(g.year) ?? g.items.length)}
                      </p>
                    </div>
                    <ul className="list-none divide-y divide-gray-200 p-0 [&>li:first-child>article]:pt-1">
                      {g.items.map((p) => (
                        <li key={p.id}>
                          <PublicationReference pub={p} locale={locale} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Paginación (conserva los filtros) */}
      {totalPages > 1 ? (
        <Pagination
          current={page}
          total={totalPages}
          hrefFor={(p) => lh(filtros, p)}
          labels={{ nav: t.paginacion, prev: t.anterior, next: t.siguiente, page: t.pagina }}
        />
      ) : (
        <div className="pb-8" />
      )}

      {/* Portal de Producción Científica de la USAL y perfiles ORCID */}
      <section className="staff-lines border-t border-gray-200 bg-surface-tinted">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <Reveal>
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow className="mb-2">{t.portalEyebrow}</Eyebrow>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                  {t.portalTitulo}
                </h2>
                <div
                  className="page-block mt-2 max-w-[62ch] text-[15px] leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: portalDescripcion }}
                />
              </div>
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClassName({ size: "lg" }), "flex-none gap-2")}
                >
                  {t.irAlPortal}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </Reveal>

          {orcids.length > 0 ? (
            <div className="mt-12 border-t border-gray-300 pt-8">
              <h2 className="mb-1.5 text-lg font-semibold tracking-tight text-gray-900">
                {t.orcidTitulo}
              </h2>
              <p className="mb-5 max-w-[70ch] text-[15px] text-gray-600">{t.orcidTexto}</p>
              <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-2.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {orcids.map((o) => (
                  <li key={o.orcid}>
                    <a
                      href={o.orcid}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.orcidDe(o.name)}
                      className="group inline-flex items-center gap-2.5 text-[15px] text-gray-700"
                    >
                      {/* Distintivo «iD» de ORCID (logotipo, decorativo). */}
                      <span
                        aria-hidden="true"
                        className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#A6CE39] text-[9px] font-bold text-white"
                      >
                        iD
                      </span>
                      <span className="link-sub">{o.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
