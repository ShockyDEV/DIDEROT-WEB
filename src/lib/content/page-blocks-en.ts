/**
 * Traducción por defecto (inglés) de los bloques de texto de las páginas
 * públicas, clave "<pageSlug>:<blockKey>". Prioridad en /en: fila «clave:en»
 * de la BD (auto-traducción al guardar) → este registro → español.
 */
import { PAGE_MODULES } from "./blocks";

export const PAGE_BLOCKS_EN: Record<string, string> = Object.assign(
  {},
  ...PAGE_MODULES.map((m) => m.blocksEn),
);
