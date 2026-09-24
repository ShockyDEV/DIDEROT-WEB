/**
 * Registro de bloques editables de las páginas públicas (patrón ContentEditor
 * del IUCE): cada página se compone de bloques (pageSlug + blockKey) que el
 * panel de administración edita y guarda en la tabla ContentBlock. La web
 * pública usa el bloque de la BD si existe y, si no, el valor por defecto.
 *
 * El contenido vive en un módulo por página (src/lib/content/blocks/*.ts);
 * este archivo solo los agrega en el orden en que aparecen en el panel.
 */
import type { PageDef } from "./blocks/types";
import { PAGE_MODULES } from "./blocks";

export type { PageBlockDef, PageDef } from "./blocks/types";

export const PAGE_BLOCKS: PageDef[] = PAGE_MODULES.filter(
  // Una página sin nada editable no aparece en el selector del panel.
  (m) => m.blocks.blocks.length > 0 || m.lists.length > 0,
).map((m) => m.blocks);
