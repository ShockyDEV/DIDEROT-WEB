import type { News } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { news as staticNews, type NewsItem } from "@/lib/content/news";
import { getLocale, type Locale } from "@/lib/locale-server";

/**
 * Servicio de noticias para las páginas públicas: lee de la base de datos
 * (contenido gestionado desde el panel) y, si la BD no está disponible
 * (p. ej. desarrollo sin Docker), recurre al contenido semilla estático.
 *
 * En la versión inglesa (/en) se usan los campos *En si existen (los rellena
 * la auto-traducción al guardar); si no, se sirve el original en español.
 */

function formatShort(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(".", "");
}

function formatLong(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Nombre de archivo de una imagen, sin ruta ni sufijo de tamaño de WordPress
 * (`-1024x771`). Permite reconocer como la misma imagen dos variantes de
 * distinto tamaño (la portada suele ser una variante de la del cuerpo).
 */
function imageStem(url: string): string {
  const base = (url.split(/[?#]/)[0].split("/").pop() ?? "").toLowerCase();
  return base.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, "$1");
}

/**
 * Quita del cuerpo de la noticia la imagen marcada como portada, para que no
 * se muestre dos veces (arriba como cabecera y de nuevo dentro del texto).
 * Las noticias migradas de WordPress traían la imagen destacada también
 * incrustada en el HTML; esto la elimina solo en la vista pública de detalle
 * (el editor conserva el cuerpo íntegro). Deja intactas las demás imágenes.
 */
export function stripCoverFromContent(
  content: string,
  cover: string | null | undefined,
): string {
  if (!cover) return content;
  const target = imageStem(cover);
  if (!target) return content;

  let removed = false;

  // 1) Figuras de Gutenberg (<figure class="wp-block-image">…</figure>) que
  //    contienen la portada — se elimina la figura completa (con su <a>).
  let out = content.replace(
    /<figure\b[^>]*\bwp-block-image\b[^>]*>[\s\S]*?<\/figure>/gi,
    (figure) => {
      if (removed) return figure;
      const m = /<img\b[^>]*\bsrc="([^"]+)"/i.exec(figure);
      if (m && imageStem(m[1]) === target) {
        removed = true;
        return "";
      }
      return figure;
    },
  );

  // 2) Si no estaba en una figura, quitar la primera <img> suelta (y su <a>).
  if (!removed) {
    out = out.replace(
      /(?:<a\b[^>]*>\s*)?<img\b[^>]*\bsrc="([^"]+)"[^>]*>(?:\s*<\/a>)?/gi,
      (tag, src: string) => {
        if (removed) return tag;
        if (imageStem(src) === target) {
          removed = true;
          return "";
        }
        return tag;
      },
    );
  }

  // 3) Limpiar galerías que hayan quedado vacías tras quitar la portada.
  out = out.replace(
    /<figure\b[^>]*\bwp-block-gallery\b[^>]*>\s*<\/figure>/gi,
    "",
  );

  return out;
}

function toItem(row: News, locale: Locale): NewsItem {
  const published = row.publishedAt ?? row.createdAt;
  const en = locale === "en";
  return {
    slug: row.slug,
    title: (en ? row.titleEn : null) ?? row.title,
    category: row.category,
    publishedAt: published.toISOString().slice(0, 10),
    dateDisplay: formatShort(published, locale),
    dateLong: formatLong(published, locale),
    author: en ? "IUCE editorial team" : "Redacción IUCE",
    excerpt: (en ? row.excerptEn : null) ?? row.excerpt ?? "",
    // Las noticias migradas no traen descripción propia de la imagen, y
    // «Imagen de la noticia» no aporta nada: el lector de pantalla ya lee el
    // titular, que va en el mismo enlace. Alt vacío = imagen decorativa.
    photoLabel: "",
    coverImage: row.coverImage,
    content: (en ? row.contentEn : null) ?? row.content,
  };
}

/**
 * Noticias publicadas, más recientes primero. Para listados (tarjetas) el
 * cuerpo no se necesita: `withContent: false` (por defecto) lo omite de la
 * consulta — con 212 noticias históricas la diferencia importa.
 */
export async function getPublishedNews(
  options: { withContent?: boolean; category?: string } = {},
): Promise<NewsItem[]> {
  const locale = getLocale();
  try {
    const rows = await prisma.news.findMany({
      where: {
        status: "PUBLISHED",
        ...(options.category ? { category: options.category } : {}),
      },
      orderBy: [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      ...(options.withContent
        ? {}
        : {
            select: {
              id: true,
              title: true,
              titleEn: true,
              slug: true,
              excerpt: true,
              excerptEn: true,
              coverImage: true,
              category: true,
              status: true,
              publishedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
    });
    if (rows.length > 0) {
      // Sin withContent la consulta no trae `content`: se rellena con "".
      return rows.map((r) =>
        toItem(
          {
            ...r,
            content: (r as { content?: string }).content ?? "",
          } as News,
          locale,
        ),
      );
    }
  } catch {
    // BD no disponible: seguimos con el contenido semilla.
  }
  const fallback = [...staticNews].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  return options.category
    ? fallback.filter((n) => n.category === options.category)
    : fallback;
}

export async function getPublishedNewsBySlug(
  slug: string,
): Promise<NewsItem | null> {
  const locale = getLocale();
  try {
    const row = await prisma.news.findUnique({ where: { slug } });
    if (row && row.status === "PUBLISHED") {
      const item = toItem(row, locale);
      // La portada se muestra como cabecera: no repetirla dentro del cuerpo.
      return {
        ...item,
        content: stripCoverFromContent(item.content, item.coverImage),
      };
    }
    if (row) return null; // existe pero no está publicada
  } catch {
    // BD no disponible
  }
  return staticNews.find((n) => n.slug === slug) ?? null;
}

