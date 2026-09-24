/**
 * Registro de LISTAS EDITABLES de las páginas públicas: secciones con
 * estructura (icono + título + texto, filas de datos…) que no encajan en un
 * bloque de texto corrido. Cada lista se guarda como JSON en ContentBlock
 * (blockKey con prefijo "list:", que además excluye la auto-traducción) y se
 * edita desde Contenido → Páginas con el editor genérico de listas.
 *
 * El contenido vive en un módulo por página (src/lib/content/blocks/*.ts).
 */
import type { ListBlockDef } from "./blocks/types";
import { PAGE_MODULES } from "./blocks";

export type {
  ListBlockDef,
  ListField,
  ListFieldType,
  ListItem,
} from "./blocks/types";

export const LIST_BLOCKS: ListBlockDef[] = PAGE_MODULES.flatMap((m) => m.lists);
