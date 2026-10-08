import { metadataBilingue } from "@/lib/metadata";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CoverImage } from "@/components/news/cover-image";
import { NewsMeta, NewsTeaser } from "@/components/news/news-teaser";
import { buttonClassName } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { NEWS_CATEGORIES, categoryLabel } from "@/lib/content/news";
import { getPublishedNews } from "@/lib/news-service";
import { getBlock } from "@/lib/content-blocks-service";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";
import { columnasSinHuecos } from "@/lib/grid";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";

export const generateMetadata = metadataBilingue(
  {
    title: "Noticias",
    description:
      "La actualidad de DIDEROT: investigación, proyectos, publicaciones, eventos, formación y divulgación sobre didácticas digitales de la música y las artes performativas.",
  },
  {
    title: "News",
    description:
      "The latest from DIDEROT: research, projects, publications, events, training and outreach on digital didactics of music and the performing arts.",
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
    actualidad: "Actualidad del grupo",
    filtrarCategoria: "Filtrar por categoría",
    todas: "Todas",
    buscarEnNoticias: "Buscar en las noticias",
    placeholder: "Buscar en las noticias…",
    textoABuscar: "Texto a buscar",
    filtrarAnio: "Filtrar por año",
    todosLosAnios: "Todos los años",
    buscar: "Buscar",
    limpiar: "Limpiar",
    resultado: "resultado",
    resultados: "resultados",
    leerNoticia: "Leer la noticia",
    sinResultados: "No hay noticias que coincidan con la búsqueda o el filtro.",
    sinNoticiasTitulo: "Todavía no hay noticias publicadas",
    sinNoticiasTexto:
      "Aquí irá apareciendo la actualidad del grupo. Mientras tanto, puedes consultar la agenda de eventos.",
    verEventos: "Ver los eventos",
    paginacion: "Paginación de noticias",
    anterior: "Anterior",
    siguiente: "Siguiente",
    pagina: (n: number) => `Página ${n}`,
  },
  en: {
    inicio: "Home",
    noticias: "News",
    actualidad: "The group's news",
    filtrarCategoria: "Filter by category",
    todas: "All",
    buscarEnNoticias: "Search the news",
    placeholder: "Search the news…",
    textoABuscar: "Text to search",
    filtrarAnio: "Filter by year",
    todosLosAnios: "All years",
    buscar: "Search",
    limpiar: "Clear",
    resultado: "result",
    resultados: "results",
    leerNoticia: "Read the article",
    sinResultados: "No news match your search or filter.",
    sinNoticiasTitulo: "No news published yet",
    sinNoticiasTexto:
      "The group's news will appear here. In the meantime, you can check the events agenda.",
    verEventos: "See the events",
    paginacion: "News pagination",
    anterior: "Previous",
    siguiente: "Next",
    pagina: (n: number) => `Page ${n}`,
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
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

const campoClass =
  "h-10 rounded-md border border-gray-300 bg-surface-card text-sm outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

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

  const [todas, intro] = await Promise.all([
    getPublishedNews(),
    getBlock("noticias", "intro"),
  ]);

  // Pestañas: solo las categorías que tienen alguna noticia (en el orden
  // oficial y, al final, las antiguas que ya no estén en la lista), para no
  // ofrecer filtros que llevan a una página vacía.
  const presentes = new Set(todas.map((n) => n.category));
  const categorias = [
    ...NEWS_CATEGORIES.filter((c) => presentes.has(c)),
    ...[...presentes].filter(
      (c) => !(NEWS_CATEGORIES as readonly string[]).includes(c),
    ),
  ];
  const categoria =
    categorias.find((c) => c === searchParams.categoria) ?? null;
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const anioParam = /^\d{4}$/.test(searchParams.anio ?? "")
    ? (searchParams.anio as string)
    : null;
  const filtros: Filtros = { categoria, q, anio: anioParam };

  const deCategoria = categoria
    ? todas.filter((n) => n.category === categoria)
    : todas;

  // Años disponibles (para el selector), sobre el conjunto de la categoría.
  const anios = [...new Set(deCategoria.map((n) => n.publishedAt.slice(0, 4)))].sort(
    (a, b) => b.localeCompare(a),
  );

  let all = deCategoria;
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
  const hayNoticias = todas.length > 0;

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.noticias }]}
        eyebrow={t.actualidad}
        title={t.noticias}
        intro={intro}
        className={hayNoticias ? "pb-8" : undefined}
      >
        {hayNoticias && categorias.length > 1 ? (
          <nav className="tabs mt-8" aria-label={t.filtrarCategoria}>
            <Link
              href={localizedPageHref({ ...filtros, categoria: null }, 1)}
              aria-current={!categoria ? "page" : undefined}
              className="tab"
            >
              {t.todas}
            </Link>
            {categorias.map((c) => (
              <Link
                key={c}
                href={localizedPageHref({ ...filtros, categoria: c }, 1)}
                aria-current={categoria === c ? "page" : undefined}
                className="tab"
              >
                {catLabel(c)}
              </Link>
            ))}
          </nav>
        ) : null}

        {/* Búsqueda en las noticias: formulario GET, funciona sin JS */}
        {hayNoticias ? (
          <form
            method="get"
            action={withLocale("/noticias", locale)}
            className="mt-5 flex flex-wrap items-center gap-2.5"
            role="search"
            aria-label={t.buscarEnNoticias}
          >
            {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
            <div className="relative min-w-0 flex-1 basis-[220px] sm:w-[320px] sm:flex-none">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                maxLength={100}
                placeholder={t.placeholder}
                aria-label={t.textoABuscar}
                className={cn(campoClass, "w-full pl-10 pr-4 text-gray-900")}
              />
            </div>
            {anios.length > 1 ? (
              <select
                name="anio"
                defaultValue={anioParam ?? ""}
                aria-label={t.filtrarAnio}
                className={cn(campoClass, "px-3.5 text-gray-700")}
              >
                <option value="">{t.todosLosAnios}</option>
                {anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ) : null}
            <button type="submit" className={buttonClassName()}>
              {t.buscar}
            </button>
            {q || anioParam ? (
              <Link
                href={localizedPageHref({ categoria, q: "", anio: null }, 1)}
                className="link-sub ml-1 text-sm font-medium"
              >
                {t.limpiar}
              </Link>
            ) : null}
            {q || anioParam ? (
              <p className="w-full text-xs text-gray-500 sm:w-auto" role="status">
                <strong className="tabular-nums text-gray-900">{all.length}</strong>{" "}
                {all.length === 1 ? t.resultado : t.resultados}
              </p>
            ) : null}
          </form>
        ) : null}
      </PageHeader>

      {!hayNoticias ? (
        /* Sin noticias (o sin BD): estado vacío */
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="staff-lines border-y border-gray-200 px-6 py-14 text-center">
              <h2 className="text-xl font-semibold text-gray-900">{t.sinNoticiasTitulo}</h2>
              <p className="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-gray-600">
                {t.sinNoticiasTexto}
              </p>
              <Link href={href("/eventos")} className="link-sub mt-4 inline-block text-sm font-medium">
                {t.verEventos}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Destacada: imagen grande y texto al lado, sin caja */}
          {featured && currentPage === 1 ? (
            <section>
              <div className="mx-auto max-w-6xl px-6 pb-4 pt-12">
                <Reveal>
                  <Link
                    href={href(`/noticias/${featured.slug}`)}
                    className="group grid items-center gap-8 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-4 focus-visible:ring-offset-surface-page lg:grid-cols-[1.25fr_1fr] lg:gap-12"
                  >
                    <CoverImage
                      src={featured.coverImage}
                      alt={featured.photoLabel}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      zoom
                      className="aspect-[1200/630] w-full rounded"
                    />
                    <div className="flex flex-col gap-3">
                      <NewsMeta
                        category={catLabel(featured.category)}
                        date={featured.dateDisplay}
                        dateTime={featured.publishedAt}
                      />
                      <h2 className="text-balance text-2xl font-semibold leading-snug text-ink sm:text-[30px]">
                        <span className="link-trace">{featured.title}</span>
                      </h2>
                      {featured.excerpt ? (
                        <p className="text-[17px] leading-relaxed text-gray-600">{featured.excerpt}</p>
                      ) : null}
                      <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet">
                        {t.leerNoticia}
                        <ArrowRight
                          className="h-[15px] w-[15px] transition-transform motion-safe:group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </div>
            </section>
          ) : null}

          {/* Rejilla de noticias */}
          <section>
            <div
              className={cn(
                "mx-auto max-w-6xl px-6 pb-6",
                featured && currentPage === 1 ? "pt-10" : "pt-12",
              )}
            >
              {feed.length === 0 ? (
                featured ? null : (
                  <p className="note py-12 text-center text-base">{t.sinResultados}</p>
                )
              ) : (
                <div
                  className={cn(
                    "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3",
                    // Sin noticias huérfanas: filas de cuatro cuando dejan menos huecos.
                    columnasSinHuecos(feed.length) === 4 && "xl:grid-cols-4",
                    featured && currentPage === 1 && "border-t border-gray-200 pt-10",
                  )}
                >
                  {feed.map((n, i) => (
                    <Reveal key={n.slug} delay={(i % 3) * 80} className="h-full">
                      <NewsTeaser
                        href={href(`/noticias/${n.slug}`)}
                        title={n.title}
                        excerpt={n.excerpt}
                        category={catLabel(n.category)}
                        date={n.dateDisplay}
                        dateTime={n.publishedAt}
                        coverImage={n.coverImage}
                        photoLabel={n.photoLabel}
                      />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Paginación */}
          {totalPages > 1 ? (
            <Pagination
              current={currentPage}
              total={totalPages}
              hrefFor={(p) => localizedPageHref(filtros, p)}
              labels={{ nav: t.paginacion, prev: t.anterior, next: t.siguiente, page: t.pagina }}
            />
          ) : (
            <div className="pb-10" />
          )}
        </>
      )}
    </>
  );
}
