import { metadataBilingue } from "@/lib/metadata";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CoverImage } from "@/components/news/cover-image";
import { NEWS_CATEGORIES, categoryLabel } from "@/lib/content/news";
import { getPublishedNews } from "@/lib/news-service";
import { getBlock } from "@/lib/content-blocks-service";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible } from "@/lib/page-visibility";

export const generateMetadata = metadataBilingue(
  {
    title: "Noticias",
    description:
      "La actualidad del IUCE: congresos, formación, premios y vida académica.",
  },
  {
    title: "News",
    description:
      "The latest from the IUCE: conferences, training, awards and academic life.",
  },
);

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

// Textos fijos de la página en ambos idiomas (título, extracto y fecha de
// cada noticia llegan ya localizados desde el servicio).
const T = {
  es: {
    inicio: "Inicio",
    noticias: "Noticias",
    actualidad: "Actualidad",
    filtrarCategoria: "Filtrar por categoría",
    todas: "Todas",
    buscarEnNoticias: "Buscar en las noticias",
    placeholder: "Buscar en el archivo de noticias…",
    textoABuscar: "Texto a buscar",
    filtrarAnio: "Filtrar por año",
    todosLosAnios: "Todos los años",
    buscar: "Buscar",
    limpiar: "Limpiar",
    resultado: "resultado",
    resultados: "resultados",
    leerNoticia: "Leer la noticia",
    sinResultados: "No hay noticias que coincidan con la búsqueda o el filtro.",
    paginacion: "Paginación de noticias",
    paginaAnterior: "Página anterior",
    paginaSiguiente: "Página siguiente",
  },
  en: {
    inicio: "Home",
    noticias: "News",
    actualidad: "News",
    filtrarCategoria: "Filter by category",
    todas: "All",
    buscarEnNoticias: "Search the news",
    placeholder: "Search the news archive…",
    textoABuscar: "Text to search",
    filtrarAnio: "Filter by year",
    todosLosAnios: "All years",
    buscar: "Search",
    limpiar: "Clear",
    resultado: "result",
    resultados: "results",
    leerNoticia: "Read the article",
    sinResultados: "No news match your search or filter.",
    paginacion: "News pagination",
    paginaAnterior: "Previous page",
    paginaSiguiente: "Next page",
  },
} as const;

interface PageProps {
  searchParams: { categoria?: string; pagina?: string; q?: string; anio?: string };
}

interface Filtros {
  categoria: string | null;
  q: string;
  anio: string | null;
}

function pageHref(filtros: Filtros, pagina: number): string {
  const params = new URLSearchParams();
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.anio) params.set("anio", filtros.anio);
  if (pagina > 1) params.set("pagina", String(pagina));
  const qs = params.toString();
  return qs ? `/noticias?${qs}` : "/noticias";
}

/** Comparación sin tildes ni mayúsculas para la búsqueda. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
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

export default async function NoticiasPage({
  searchParams,
}: Readonly<PageProps>) {
  await assertVisible("noticias");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Enlaces de filtros y paginación: misma query, con prefijo /en si toca.
  const localizedPageHref = (f: Filtros, p: number) =>
    withLocale(pageHref(f, p), locale);
  const catLabel = (c: string) => categoryLabel(c, locale);
  const categoria =
    NEWS_CATEGORIES.find((c) => c === searchParams.categoria) ?? null;
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const anioParam = /^\d{4}$/.test(searchParams.anio ?? "")
    ? (searchParams.anio as string)
    : null;
  const filtros: Filtros = { categoria, q, anio: anioParam };

  const [fetched, intro] = await Promise.all([
    getPublishedNews({ category: categoria ?? undefined }),
    getBlock("noticias", "intro"),
  ]);

  // Años disponibles (para el selector), sobre el conjunto de la categoría.
  const anios = [...new Set(fetched.map((n) => n.publishedAt.slice(0, 4)))].sort(
    (a, b) => b.localeCompare(a),
  );

  let all = fetched;
  if (anioParam) all = all.filter((n) => n.publishedAt.startsWith(anioParam));
  if (q) {
    const nq = normalize(q);
    all = all.filter((n) =>
      normalize(`${n.title} ${n.excerpt}`).includes(nq),
    );
  }

  // La destacada solo abre la primera página del listado sin filtrar.
  const showFeatured = !categoria && !q && !anioParam;
  const featured = showFeatured ? all[0] : null;
  const rest = showFeatured ? all.slice(1) : all;

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(1, Number(searchParams.pagina) || 1),
    totalPages,
  );
  const feed = rest.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.noticias },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.actualidad}
          </p>
          <h1 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.noticias}
          </h1>
          <div
            className="page-block mb-6 max-w-[70ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
          <nav
            className="flex flex-wrap gap-2"
            aria-label={t.filtrarCategoria}
          >
            <Link
              href={href("/noticias")}
              aria-current={!categoria ? "page" : undefined}
              className={cn(
                "flex h-[34px] items-center rounded-full border px-4 text-sm font-medium transition-colors",
                !categoria
                  ? "border-diderot-indigo bg-diderot-indigo text-white"
                  : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-ink",
              )}
            >
              {t.todas}
            </Link>
            {NEWS_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={localizedPageHref({ ...filtros, categoria: c }, 1)}
                aria-current={categoria === c ? "page" : undefined}
                className={cn(
                  "flex h-[34px] items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  categoria === c
                    ? "border-diderot-indigo bg-diderot-indigo text-white"
                    : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-ink",
                )}
              >
                {catLabel(c)}
              </Link>
            ))}
          </nav>

          {/* Búsqueda en el archivo (2010–hoy): formulario GET, sin JS */}
          <form
            method="get"
            action={withLocale("/noticias", locale)}
            className="mt-4 flex flex-wrap items-center gap-2.5"
            role="search"
            aria-label={t.buscarEnNoticias}
          >
            {categoria ? (
              <input type="hidden" name="categoria" value={categoria} />
            ) : null}
            <div className="relative w-full sm:w-[320px]">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder={t.placeholder}
                aria-label={t.textoABuscar}
                className="h-10 w-full rounded-full border border-gray-300 bg-surface-card pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
              />
            </div>
            <select
              name="anio"
              defaultValue={anioParam ?? ""}
              aria-label={t.filtrarAnio}
              className="h-10 rounded-full border border-gray-300 bg-surface-card px-3.5 text-sm text-gray-700 outline-none transition-colors focus:border-diderot-violet"
            >
              <option value="">{t.todosLosAnios}</option>
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-full bg-diderot-indigo px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t.buscar}
            </button>
            {q || anioParam ? (
              <Link
                href={localizedPageHref({ categoria, q: "", anio: null }, 1)}
                className="text-sm font-medium text-diderot-violet hover:underline"
              >
                {t.limpiar}
              </Link>
            ) : null}
            {q || anioParam ? (
              <p className="w-full text-xs text-gray-500 sm:w-auto">
                <strong className="text-gray-900">{all.length}</strong>{" "}
                {all.length === 1 ? t.resultado : t.resultados}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      {/* Destacada */}
      {featured && currentPage === 1 ? (
        <section>
          <div className="mx-auto max-w-6xl px-6 pb-3 pt-12">
            <Reveal from="scale">
            <Link
              href={href(`/noticias/${featured.slug}`)}
              className="group block"
            >
              <article className="card-lift grid overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm hover:border-brand-400 hover:shadow-md lg:grid-cols-[1.2fr_1fr]">
                <CoverImage
                  src={featured.coverImage}
                  alt={featured.photoLabel}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  zoom
                  className="min-h-[300px] w-full"
                />
                <div className="flex flex-col gap-3 p-8">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="rounded-full bg-diderot-pale px-3 py-[3px] font-medium text-ink">
                      {catLabel(featured.category)}
                    </span>
                    <span className="text-gray-500">
                      {featured.dateDisplay}
                    </span>
                  </div>
                  <h2 className="text-balance text-2xl font-bold leading-snug text-ink">
                    {featured.title}
                  </h2>
                  <p className="text-base leading-relaxed text-gray-600">
                    {featured.excerpt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet">
                    {t.leerNoticia}
                    <ArrowRight
                      className="h-[15px] w-[15px]"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </article>
            </Link>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Feed */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pb-6 pt-7">
          {feed.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              {t.sinResultados}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {feed.map((n, i) => (
                <Reveal key={n.slug} delay={(i % 3) * 80} className="h-full">
                <Link
                  href={href(`/noticias/${n.slug}`)}
                  className="group block h-full"
                >
                  <article className="card-lift flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm hover:border-brand-400 hover:shadow-md">
                    <CoverImage
                      src={n.coverImage}
                      alt={n.photoLabel}
                      zoom
                      className="h-[150px] w-full"
                    />
                    <div className="flex flex-col gap-2 px-5 pb-5 pt-[18px]">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 font-medium text-ink">
                          {catLabel(n.category)}
                        </span>
                        <span className="text-gray-500">{n.dateDisplay}</span>
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-gray-900">
                        {n.title}
                      </h3>
                      {n.excerpt ? (
                        <p className="line-clamp-3 text-sm leading-normal text-gray-600">
                          {n.excerpt}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Paginación */}
      {totalPages > 1 ? (
        <nav
          aria-label={t.paginacion}
          className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 px-6 pb-16 pt-2"
        >
          {currentPage > 1 ? (
            <Link
              href={localizedPageHref(filtros, currentPage - 1)}
              aria-label={t.paginaAnterior}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-300">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </span>
          )}

          {pageNumbers(currentPage, totalPages).map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="px-1 text-sm text-gray-500"
              >
                …
              </span>
            ) : p === currentPage ? (
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
                href={localizedPageHref(filtros, p)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                {p}
              </Link>
            ),
          )}

          {currentPage < totalPages ? (
            <Link
              href={localizedPageHref(filtros, currentPage + 1)}
              aria-label={t.paginaSiguiente}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-surface-card text-gray-600 transition-colors hover:bg-gray-50"
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
        <div className="pb-10" />
      )}
    </>
  );
}
