import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Library,
  Search,
  SearchX,
} from "lucide-react";
import { metadataBilingue } from "@/lib/metadata";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { buttonClassName } from "@/components/ui/button";
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
    paginaAnterior: "Página anterior",
    paginaSiguiente: "Página siguiente",
    pagina: (n: number) => `Página ${n}`,
    portalEyebrow: "Portal de Producción Científica · USAL",
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
    paginaAnterior: "Previous page",
    paginaSiguiente: "Next page",
    pagina: (n: number) => `Page ${n}`,
    portalEyebrow: "Research Portal · USAL",
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

/** Números de página a mostrar: 1 … (p-1) p (p+1) … total, sin repetidos. */
function pageNumbers(current: number, total: number): Array<number | "…"> {
  const wanted = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const list = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const n of list) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
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

const chipClass = (active: boolean) =>
  cn(
    "flex h-[34px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
    active
      ? "border-diderot-indigo bg-diderot-indigo text-white"
      : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-ink",
  );

const countClass = (active: boolean) =>
  cn(
    "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600",
  );

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
  // Chips: solo los tipos con publicaciones (más el activo, si no tuviera).
  const tipos = PUBLICATION_TYPES.filter(
    (pt) => (typeCounts[pt.value] ?? 0) > 0 || pt.value === filtros.type,
  );
  const recuentoAnio = new Map(yearCounts.map((y) => [y.year, y.count]));
  const desde = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      {/* Cabecera con filtros */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.publicaciones },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.eyebrow}
          </p>
          <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.publicaciones}
          </h1>
          <div
            className="page-block max-w-[70ch] text-base leading-relaxed text-gray-600"
            // Bloque editable desde el gestor (publicaciones:intro)
            dangerouslySetInnerHTML={{ __html: intro }}
          />

          {!catalogoVacio ? (
            <>
              {/* Tipos: enlaces (funcionan sin JS) con su recuento */}
              <nav aria-label={t.filtrarTipo} className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={lh({ ...filtros, type: null }, 1)}
                  aria-current={!filtros.type ? "page" : undefined}
                  className={chipClass(!filtros.type)}
                >
                  {t.todas}
                  <span className={countClass(!filtros.type)}>{allTypesCount}</span>
                </Link>
                {tipos.map((pt) => {
                  const activo = filtros.type === pt.value;
                  return (
                    <Link
                      key={pt.value}
                      href={lh({ ...filtros, type: pt.value }, 1)}
                      aria-current={activo ? "page" : undefined}
                      className={chipClass(activo)}
                    >
                      {locale === "en" ? pt.pluralEn : pt.plural}
                      <span className={countClass(activo)}>
                        {typeCounts[pt.value] ?? 0}
                      </span>
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
                className="mt-4 flex flex-wrap items-center gap-2.5"
              >
                {filtros.type ? (
                  <input
                    type="hidden"
                    name="tipo"
                    value={PUBLICATION_TYPE_SLUGS[filtros.type]}
                  />
                ) : null}
                <div className="relative w-full sm:w-[340px]">
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
                    className="h-10 w-full rounded-full border border-gray-300 bg-surface-card pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-500 focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
                  />
                </div>
                <AutoSubmitSelect
                  name="anio"
                  defaultValue={filtros.year ? String(filtros.year) : ""}
                  aria-label={t.filtrarAnio}
                  className="h-10 rounded-full border border-gray-300 bg-surface-card px-3.5 text-sm text-gray-700 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
                >
                  <option value="">{t.todosLosAnios}</option>
                  {anios.map((y) => (
                    // Un solo texto: <option> no admite nodos intermedios.
                    <option key={y.year} value={y.year}>
                      {`${y.year} (${y.count})`}
                    </option>
                  ))}
                </AutoSubmitSelect>
                <button
                  type="submit"
                  className="h-10 rounded-full bg-diderot-indigo px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
                >
                  {t.buscar}
                </button>
                {hayFiltros ? (
                  <Link
                    href={lh(sinFiltros, 1)}
                    className="inline-flex min-h-6 items-center rounded text-sm font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
                  >
                    {t.limpiar}
                  </Link>
                ) : null}
              </form>
            </>
          ) : null}
        </div>
      </section>

      {/* Listado por años */}
      <section aria-labelledby="listado-publicaciones">
        <div className="mx-auto max-w-6xl px-6 pb-6 pt-10">
          <h2 id="listado-publicaciones" className="sr-only">
            {t.listado}
          </h2>

          {catalogoVacio ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
              <p className="text-base font-semibold text-gray-900">{t.vacioTitulo}</p>
              <p className="mx-auto mt-1.5 max-w-[60ch] text-sm leading-relaxed text-gray-500">
                {t.vacioTexto}
              </p>
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClassName({ variant: "outline" }), "mt-5 gap-1.5")}
                >
                  {t.irAlPortal}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : total === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center">
              <SearchX className="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
              <p className="text-sm text-gray-500">
                {t.sinResultados(filtros.q, Boolean(filtros.type || filtros.year))}
              </p>
              <Link
                href={lh(sinFiltros, 1)}
                className="mt-3 inline-flex min-h-6 items-center rounded text-sm font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
              >
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
                    className="grid gap-x-10 gap-y-2 border-t border-gray-200 pt-8 lg:grid-cols-[140px_1fr]"
                  >
                    {/* El año acompaña a su bloque mientras se lee (lg). */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                      <h3
                        id={`anio-${g.year}`}
                        className="text-3xl font-bold tracking-tight text-ink"
                      >
                        {g.year}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {t.enAnio(recuentoAnio.get(g.year) ?? g.items.length)}
                      </p>
                    </div>
                    <ul className="list-none divide-y divide-gray-100 p-0 [&>li:first-child>article]:pt-1">
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
        <nav
          aria-label={t.paginacion}
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-1.5 px-6 pb-14 pt-4"
        >
          {page > 1 ? (
            <Link
              href={lh(filtros, page - 1)}
              aria-label={t.paginaAnterior}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-300">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </span>
          )}

          {pageNumbers(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-sm text-gray-500" aria-hidden="true">
                …
              </span>
            ) : p === page ? (
              <span
                key={p}
                aria-current="page"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-diderot-indigo bg-diderot-indigo text-sm font-semibold text-white"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={lh(filtros, p)}
                aria-label={t.pagina(p)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-sm text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
              >
                {p}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link
              href={lh(filtros, page + 1)}
              aria-label={t.paginaSiguiente}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-300">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </nav>
      ) : (
        <div className="pb-8" />
      )}

      {/* Portal de Producción Científica de la USAL y perfiles ORCID */}
      <section className="staff-lines border-t border-gray-200 bg-surface-tinted">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <Reveal
            from="scale"
            className="rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-amber bg-surface-card p-8 shadow-sm"
          >
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5 sm:items-center">
                <span className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-diderot-indigo text-white">
                  <Library className="h-8 w-8" aria-hidden="true" />
                </span>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                    {t.portalEyebrow}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">{t.portalTitulo}</h2>
                  <div
                    className="page-block mt-1 max-w-[62ch] text-sm leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: portalDescripcion }}
                  />
                </div>
              </div>
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClassName({ size: "lg" }), "flex-none gap-1.5")}
                >
                  {t.irAlPortal}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </Reveal>

          {orcids.length > 0 ? (
            <div className="mt-10">
              <h2 className="mb-1.5 text-lg font-bold tracking-tight text-gray-900">
                {t.orcidTitulo}
              </h2>
              <p className="mb-5 max-w-[70ch] text-sm text-gray-600">{t.orcidTexto}</p>
              <ul className="flex list-none flex-wrap gap-2.5 p-0">
                {orcids.map((o) => (
                  <li key={o.orcid}>
                    <a
                      href={o.orcid}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.orcidDe(o.name)}
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-gray-200 bg-surface-card py-1 pl-1.5 pr-3.5 text-sm text-gray-700 shadow-sm transition-colors hover:border-[#A6CE39] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-tinted"
                    >
                      {/* Distintivo «iD» de ORCID (logotipo, decorativo). */}
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#A6CE39] text-[10px] font-bold text-white"
                      >
                        iD
                      </span>
                      {o.name}
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
