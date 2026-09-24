/**
 * Noticias de DIDEROT: forma de cada noticia en las páginas públicas y
 * categorías del grupo. Las noticias en sí viven en la base de datos (panel
 * → Noticias); aquí ya no hay contenido semilla: sin BD, los listados salen
 * vacíos y las páginas muestran su estado vacío.
 *
 * Seguro para componentes de cliente (lo importa el editor del panel).
 */
export interface NewsItem {
  slug: string;
  title: string;
  category: string;
  /** Fecha ISO (AAAA-MM-DD, hora de Madrid) para ordenar y filtrar por año. */
  publishedAt: string;
  /** Fecha corta para tarjetas («24 sept 2026»). */
  dateDisplay: string;
  /** Fecha larga para el detalle («24 de septiembre de 2026»). */
  dateLong: string;
  author: string;
  excerpt: string;
  photoLabel: string;
  photoCaption?: string;
  /** Ruta de la imagen de portada (p. ej. /uploads/noticias/x.jpg). */
  coverImage?: string | null;
  content: string;
  featured?: boolean;
}

/**
 * Categorías de las noticias, en el orden de los filtros de /noticias. El
 * valor guardado en BD (y el de la URL ?categoria=) es siempre el español.
 */
export const NEWS_CATEGORIES = [
  "Investigación",
  "Publicaciones",
  "Proyectos",
  "Eventos",
  "Transferencia",
  "Formación",
  "Divulgación",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

// Etiqueta EN de cada categoría (el valor guardado y el filtro de URL siguen
// siendo el español). Compartido por la portada, el listado y el detalle.
export const NEWS_CATEGORY_EN: Record<string, string> = {
  Investigación: "Research",
  Publicaciones: "Publications",
  Proyectos: "Projects",
  Eventos: "Events",
  Transferencia: "Knowledge transfer",
  Formación: "Training",
  Divulgación: "Outreach",
};

/** Etiqueta de categoría según idioma (es = tal cual; en = traducida). */
export function categoryLabel(category: string, locale: "es" | "en"): string {
  return locale === "en" ? (NEWS_CATEGORY_EN[category] ?? category) : category;
}

/**
 * Firma de las noticias: el panel no guarda autoría por noticia, así que
 * todas se firman como equipo del grupo.
 */
export const NEWS_AUTHOR = {
  es: "Equipo DIDEROT",
  en: "DIDEROT team",
} as const;
