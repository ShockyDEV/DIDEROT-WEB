import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { CoverImage } from "@/components/news/cover-image";
import { ShareRow } from "@/components/news/share-row";
import {
  getPublishedNews,
  getPublishedNewsBySlug,
} from "@/lib/news-service";
import { categoryLabel } from "@/lib/content/news";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";
import { SITE, SITE_URL } from "@/lib/site";
import { isLocalPath } from "@/lib/validations";

interface PageProps {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (título, extracto, cuerpo y
// fechas de la noticia llegan ya localizados desde el servicio).
const T = {
  es: {
    inicio: "Inicio",
    noticias: "Noticias",
    masActualidad: "Más actualidad",
    todasLasNoticias: "Todas las noticias →",
    noEncontrada: "Noticia no encontrada",
  },
  en: {
    inicio: "Home",
    noticias: "News",
    masActualidad: "More news",
    todasLasNoticias: "All news →",
    noEncontrada: "News item not found",
  },
} as const;

/** URL absoluta de una imagen (las portadas del gestor son rutas locales). */
function absoluteUrl(src: string): string {
  return isLocalPath(src) ? `${SITE_URL}${src}` : src;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = getLocale();
  const item = await getPublishedNewsBySlug(params.slug);
  if (!item) return { title: T[locale].noEncontrada };
  return {
    title: item.title,
    description: item.excerpt || undefined,
    alternates: {
      canonical: withLocale(`/noticias/${item.slug}`, locale),
      languages: {
        es: `/noticias/${item.slug}`,
        en: `/en/noticias/${item.slug}`,
      },
    },
    openGraph: {
      title: item.title,
      description: item.excerpt || undefined,
      type: "article",
      publishedTime: item.publishedAt,
      locale: locale === "en" ? "en_GB" : "es_ES",
      // La portada de la noticia como imagen social (si no hay, Next usa
      // la opengraph-image genérica del sitio).
      ...(item.coverImage ? { images: [{ url: item.coverImage }] } : {}),
    },
  };
}

export default async function NoticiaPage({ params }: Readonly<PageProps>) {
  await assertVisible("noticias");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  const catLabel = (c: string) => categoryLabel(c, locale);
  const item = await getPublishedNewsBySlug(params.slug);
  if (!item) notFound();

  // «Más actualidad»: primero las de la misma categoría, luego las demás
  // (cada grupo, de la más reciente a la más antigua).
  const otras = (await getPublishedNews()).filter((n) => n.slug !== item.slug);
  const related = [
    ...otras.filter((n) => n.category === item.category),
    ...otras.filter((n) => n.category !== item.category),
  ].slice(0, 3);
  const shortTitle =
    item.title.length > 30 ? `${item.title.slice(0, 28)}…` : item.title;

  // Datos estructurados del artículo para buscadores.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    datePublished: item.publishedAt,
    inLanguage: locale,
    ...(item.coverImage ? { image: [absoluteUrl(item.coverImage)] } : {}),
    author: {
      "@type": "Organization",
      name: `${SITE.shortName} — ${locale === "en" ? "University of Salamanca" : "Universidad de Salamanca"}`,
    },
    publisher: {
      "@type": "Organization",
      name: `${SITE.shortName} — ${locale === "en" ? SITE.nameEn : SITE.name}`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/diderot-logo.png`,
      },
    },
    mainEntityOfPage: `${SITE_URL}${href(`/noticias/${item.slug}`)}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        // Solo campos del propio artículo, serializados con JSON.stringify
        // (y «<» escapado para que un título no pueda cerrar el <script>).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {/* Cabecera de lectura (800px) */}
      <div className="mx-auto max-w-[800px] px-6 pt-12">
        <div className="mb-5">
          <Breadcrumb
            items={[
              { label: t.inicio, href: href("/") },
              { label: t.noticias, href: href("/noticias") },
              { label: shortTitle },
            ]}
          />
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2.5 text-xs">
          <Link
            href={href(`/noticias?categoria=${encodeURIComponent(item.category)}`)}
            className="inline-flex min-h-[24px] items-center rounded-full bg-diderot-pale px-3 py-1 font-medium text-ink underline-offset-2 hover:underline"
          >
            {catLabel(item.category)}
          </Link>
          <span className="text-gray-500">
            <time dateTime={item.publishedAt}>{item.dateLong}</time> ·{" "}
            {item.author}
          </span>
        </div>
        <h1 className="mb-4 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
          {item.title}
        </h1>
        {item.excerpt ? (
          <p className="mb-7 text-lg leading-relaxed text-gray-500">
            {item.excerpt}
          </p>
        ) : null}
      </div>

      {/* Imagen principal (960px) — solo si la noticia trae portada */}
      {item.coverImage ? (
        <div className="mx-auto max-w-[960px] px-6">
          <figure className="mb-3">
            <CoverImage
              src={item.coverImage}
              alt={item.photoLabel}
              rounded="xl"
              sizes="(max-width: 1024px) 100vw, 960px"
              className="aspect-[1200/630] max-h-[480px] w-full"
            />
            {item.photoCaption ? (
              <figcaption className="mt-2.5 text-xs text-gray-500">
                {item.photoCaption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}

      {/* Cuerpo (800px). Los estilos de los subtítulos del editor van aquí:
          .news-body de globals.css no los define. */}
      <div className="mx-auto max-w-[800px] px-6 pt-7">
        <div
          className="news-body flex flex-col gap-[18px] text-[17px] leading-[1.75] text-gray-600 [&_h2]:mt-3 [&_h2]:text-balance [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-gray-900 [&_h3]:mt-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-gray-900 [&_li]:mb-1 [&_ol]:list-decimal [&_ul]:list-disc"
          // Contenido del gestor (HTML del editor del panel de administración)
          dangerouslySetInnerHTML={{ __html: item.content }}
        />

        <div className="mt-8">
          <ShareRow title={item.title} locale={locale} />
        </div>
      </div>

      {/* Más actualidad */}
      {related.length > 0 ? (
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t.masActualidad}
            </h2>
            <Link
              href={href("/noticias")}
              className="text-sm font-medium text-diderot-violet hover:underline"
            >
              {t.todasLasNoticias}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((n) => (
              <Link
                key={n.slug}
                href={href(`/noticias/${n.slug}`)}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
              >
                <article className="card-lift h-full rounded-xl border border-gray-200 bg-surface-card px-5 py-[18px] shadow-sm hover:border-brand-400 hover:shadow-md">
                  <p className="mb-1.5 text-xs text-gray-500">
                    {catLabel(n.category)} ·{" "}
                    <time dateTime={n.publishedAt}>{n.dateDisplay}</time>
                  </p>
                  <h3 className="text-sm font-semibold leading-snug text-gray-900">
                    {n.title}
                  </h3>
                </article>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="pb-16" />
      )}
    </article>
  );
}
