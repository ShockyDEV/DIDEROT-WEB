/**
 * Traducción por defecto (inglés) de las listas editables, clave
 * "<pageSlug>:<blockKey>". Prioridad en /en: fila «list:clave:en» de la BD →
 * este registro → español. (Las listas no se auto-traducen: son datos.)
 */
import type { ListItem } from "./blocks/types";
import { PAGE_MODULES } from "./blocks";

export const LIST_BLOCKS_EN: Record<string, ListItem[]> = Object.assign(
  {},
  ...PAGE_MODULES.map((m) => m.listsEn),
);
