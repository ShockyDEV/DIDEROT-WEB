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

interface PageProps {
  params: { slug: string };
}

import { assertVisible } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (título, extracto, cuerpo y
// fechas de la noticia llegan ya localizados desde el servicio).
const T = {
  es: {
    inicio: "Inicio",
    noticias: "Noticias",
    masActualidad: "Más actualidad",
    todasLasNoticias: "Todas las noticias →",
  },
  en: {
    inicio: "Home",
    noticias: "News",
    masActualidad: "Related news",
    todasLasNoticias: "All news →",
  },
} as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const item = await getPublishedNewsBySlug(params.slug);
  if (!item) return { title: "Noticia no encontrada" };
  return {
    title: item.title,
    description: item.excerpt,
    openGraph: {
      title: item.title,
      description: item.excerpt,
      type: "article",
      publishedTime: item.publishedAt,
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

  const related = (await getPublishedNews())
    .filter((n) => n.slug !== item.slug)
    .slice(0, 3);
  const shortTitle =
    item.title.length > 30 ? `${item.title.slice(0, 28)}…` : item.title;

  // Datos estructurados del artículo para buscadores.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    datePublished: item.publishedAt,
    inLanguage: "es",
    ...(item.coverImage
      ? { image: [`https://iuce.usal.es${item.coverImage}`] }
      : {}),
    author: { "@type": "Organization", name: "IUCE — Universidad de Salamanca" },
    publisher: {
      "@type": "Organization",
      name: "Instituto Universitario de Ciencias de la Educación",
      logo: {
        "@type": "ImageObject",
        url: "https://iuce.usal.es/images/iuce-logo.png",
      },
    },
    mainEntityOfPage: `https://iuce.usal.es/noticias/${item.slug}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        // Solo campos del propio artículo, serializados con JSON.stringify.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <div className="mb-4 flex items-center gap-2.5 text-xs">
          <span className="rounded-full bg-diderot-pale px-3 py-[3px] font-medium text-ink">
            {catLabel(item.category)}
          </span>
          <span className="text-gray-500">
            {item.dateLong} · {item.author}
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
              className="h-[420px] w-full"
            />
            {item.photoCaption ? (
              <figcaption className="mt-2.5 text-xs text-gray-500">
                {item.photoCaption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}

      {/* Cuerpo (800px) */}
      <div className="mx-auto max-w-[800px] px-6 pt-7">
        <div
          className="news-body flex flex-col gap-[18px] text-[17px] leading-[1.75] text-gray-600"
          // Contenido del gestor (HTML del editor del panel de administración)
          dangerouslySetInnerHTML={{ __html: item.content }}
        />

        <div className="mt-8">
          <ShareRow title={item.title} locale={locale} />
        </div>
      </div>

      {/* Más actualidad */}
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
        <div className="mb-5 flex items-baseline justify-between">
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
            <Link key={n.slug} href={href(`/noticias/${n.slug}`)}>
              <article className="h-full rounded-xl border border-gray-200 bg-surface-card px-5 py-[18px] shadow-sm transition-all hover:border-brand-400 hover:shadow-md">
                <p className="mb-1.5 text-xs text-gray-500">
                  {catLabel(n.category)} · {n.dateDisplay}
                </p>
                <h3 className="text-sm font-semibold leading-snug text-gray-900">
                  {n.title}
                </h3>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
