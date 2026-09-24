import type { MetadataRoute } from "next";
import { getPublishedNews } from "@/lib/news-service";
import { getHiddenPaths } from "@/lib/page-visibility";
import { SITE_URL as BASE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allStatic: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/grupo`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/investigacion`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/publicaciones`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/transferencia`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/formacion`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/eventos`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/noticias`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/contacto`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/aviso-legal`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/privacidad`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/politica-de-cookies`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/accesibilidad`, changeFrequency: "yearly", priority: 0.1 },
  ];

  // Las páginas ocultas (panel → Visualización) no se indexan.
  const hiddenPaths = await getHiddenPaths();
  const staticRoutes = allStatic.filter(
    (r) => !hiddenPaths.some((p) => r.url === `${BASE}${p}`),
  );
  const noticiasOculta = hiddenPaths.includes("/noticias");

  const news = noticiasOculta ? [] : await getPublishedNews();
  const newsRoutes: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${BASE}/noticias/${n.slug}`,
    lastModified: new Date(n.publishedAt),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Versión en inglés: mismas rutas estáticas bajo /en.
  const enRoutes: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    ...r,
    url: r.url === `${BASE}/` ? `${BASE}/en` : r.url.replace(BASE, `${BASE}/en`),
    priority: (r.priority ?? 0.5) * 0.8,
  }));

  return [...staticRoutes, ...enRoutes, ...newsRoutes];
}
