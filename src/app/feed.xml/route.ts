import { getPublishedNews } from "@/lib/news-service";
import { categoryLabel } from "@/lib/content/news";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { SITE, SITE_URL } from "@/lib/site";

// Se genera en cada petición (idioma por cabecera y noticias al día); la
// caché HTTP de abajo evita recalcularlo en cada lectura del agregador.
export const dynamic = "force-dynamic";

/** Escapa texto para meterlo en un elemento XML. */
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Feed RSS 2.0 con las últimas 20 noticias del grupo. Da continuidad al feed
 * del WordPress antiguo (/feed redirige aquí). En /en/feed.xml (reescrito por
 * el middleware) sale la versión inglesa, con enlaces a /en/noticias/….
 */
export async function GET() {
  const locale = getLocale();
  const en = locale === "en";
  const news = (await getPublishedNews()).slice(0, 20);
  const link = (path: string) => `${SITE_URL}${withLocale(path, locale)}`;
  const self = link("/feed.xml");

  const items = news
    .map((n) => {
      const url = link(`/noticias/${n.slug}`);
      return `    <item>
      <title>${esc(n.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${new Date(`${n.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(categoryLabel(n.category, locale))}</category>
      <description>${esc(n.excerpt || n.title)}</description>
    </item>`;
    })
    .join("\n");

  const title = `${SITE.shortName} - ${en ? SITE.nameEn : SITE.name}`;
  const description = en
    ? `News from ${SITE.shortName}, a Recognised Research Group of the University of Salamanca: research, projects, publications, events, training and outreach.`
    : `Noticias de ${SITE.shortName}, Grupo de Investigación Reconocido de la Universidad de Salamanca: investigación, proyectos, publicaciones, eventos, formación y divulgación.`;
  const lastBuild = news[0]
    ? `\n    <lastBuildDate>${new Date(`${news[0].publishedAt}T12:00:00Z`).toUTCString()}</lastBuildDate>`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(link("/noticias"))}</link>
    <atom:link href="${esc(self)}" rel="self" type="application/rss+xml"/>
    <description>${esc(description)}</description>
    <language>${en ? "en-GB" : "es-ES"}</language>${lastBuild}
    <image>
      <url>${esc(`${SITE_URL}/images/diderot-logo.png`)}</url>
      <title>${esc(title)}</title>
      <link>${esc(link("/noticias"))}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
