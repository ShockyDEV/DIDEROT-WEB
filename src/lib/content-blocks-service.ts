import { prisma } from "@/lib/prisma";
import { PAGE_BLOCKS } from "@/lib/content/page-blocks";
import { LIST_BLOCKS, type ListItem } from "@/lib/content/list-blocks";
import { PAGE_BLOCKS_EN } from "@/lib/content/page-blocks-en";
import { LIST_BLOCKS_EN } from "@/lib/content/list-blocks-en";
import { getLocale } from "@/lib/locale-server";

/**
 * Contenido de bloques de páginas estáticas (patrón mupes): devuelve el HTML
 * guardado desde el panel de administración o, si no existe (o la BD no está
 * disponible), el contenido por defecto registrado en page-blocks.ts.
 *
 * En la versión inglesa (/en) la prioridad es: fila «clave:en» de la BD
 * (la escribe la auto-traducción al guardar) → traducción por defecto de
 * page-blocks-en.ts → español (fila de BD o registro).
 */
export async function getBlock(
  pageSlug: string,
  blockKey: string,
): Promise<string> {
  const def = PAGE_BLOCKS.find((p) => p.pageSlug === pageSlug)?.blocks.find(
    (b) => b.blockKey === blockKey,
  );
  const fallback = def?.defaultContent ?? "";
  const en = getLocale() === "en";
  const enDefault = en ? PAGE_BLOCKS_EN[`${pageSlug}:${blockKey}`] : undefined;

  try {
    if (en) {
      const [enRow, esRow] = await Promise.all([
        prisma.contentBlock.findUnique({
          where: {
            pageSlug_blockKey: { pageSlug, blockKey: `${blockKey}:en` },
          },
        }),
        prisma.contentBlock.findUnique({
          where: { pageSlug_blockKey: { pageSlug, blockKey } },
        }),
      ]);
      return enRow?.content ?? enDefault ?? esRow?.content ?? fallback;
    }
    const row = await prisma.contentBlock.findUnique({
      where: { pageSlug_blockKey: { pageSlug, blockKey } },
    });
    return row?.content ?? fallback;
  } catch {
    return enDefault ?? fallback;
  }
}

/**
 * Variante para textos planos (títulos, eyebrows, líneas de datos): devuelve
 * el bloque sin etiquetas HTML, para poder inyectarlo dentro de <h1>, <p>…
 */
export async function getBlockText(
  pageSlug: string,
  blockKey: string,
): Promise<string> {
  const html = await getBlock(pageSlug, blockKey);
  return html
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Lista editable (JSON en ContentBlock, blockKey con prefijo "list:").
 * Devuelve los elementos guardados desde el gestor o, si no existen o no son
 * un JSON válido, los defaultItems del registro.
 *
 * En /en: fila «list:clave:en» de la BD → list-blocks-en.ts → español.
 * (Las listas no se auto-traducen al guardar: contienen datos, no prosa.)
 */
export async function getListBlock(
  pageSlug: string,
  blockKey: string,
): Promise<ListItem[]> {
  const def = LIST_BLOCKS.find(
    (l) => l.pageSlug === pageSlug && l.blockKey === blockKey,
  );
  const fallback = def?.defaultItems ?? [];
  const en = getLocale() === "en";
  const enDefault = en ? LIST_BLOCKS_EN[`${pageSlug}:${blockKey}`] : undefined;

  try {
    if (en) {
      const enRow = await prisma.contentBlock.findUnique({
        where: { pageSlug_blockKey: { pageSlug, blockKey: `${blockKey}:en` } },
      });
      if (enRow) {
        const parsed: unknown = JSON.parse(enRow.content);
        if (Array.isArray(parsed)) return parsed as ListItem[];
      }
      if (enDefault) return enDefault;
    }
    const row = await prisma.contentBlock.findUnique({
      where: { pageSlug_blockKey: { pageSlug, blockKey } },
    });
    if (!row) return fallback;
    const parsed: unknown = JSON.parse(row.content);
    if (Array.isArray(parsed)) return parsed as ListItem[];
  } catch {
    // BD no disponible o JSON corrupto: usamos el contenido por defecto.
    if (enDefault) return enDefault;
  }
  return fallback;
}
