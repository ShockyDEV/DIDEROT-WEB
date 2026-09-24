import { getPublishedNews } from "@/lib/news-service";

const BASE = "https://iuce.usal.es";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Feed RSS 2.0 con las últimas 20 noticias. Da continuidad al feed del
 * WordPress antiguo (/feed redirige aquí).
 */
export async function GET() {
  const news = (await getPublishedNews()).slice(0, 20);

  const items = news
    .map(
      (n) => `    <item>
      <title>${esc(n.title)}</title>
      <link>${BASE}/noticias/${n.slug}</link>
      <guid isPermaLink="true">${BASE}/noticias/${n.slug}</guid>
      <pubDate>${new Date(`${n.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(n.category)}</category>
      <description>${esc(n.excerpt || n.title)}</description>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IUCE - Instituto Universitario de Ciencias de la Educación</title>
    <link>${BASE}</link>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Noticias del IUCE, Universidad de Salamanca: investigación, formación del profesorado, doctorado y vida académica.</description>
    <language>es-ES</language>
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
