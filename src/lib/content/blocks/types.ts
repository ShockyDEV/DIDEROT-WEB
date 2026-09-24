/**
 * Tipos del registro de contenido editable (patrón ContentEditor del IUCE).
 *
 * Cada página pública declara en `src/lib/content/blocks/<página>.ts`:
 *  - `blocks`: bloques de texto enriquecido (pageSlug + blockKey) que el panel
 *    edita en Contenido → Páginas y se guardan en la tabla ContentBlock;
 *  - `lists`: LISTAS editables (JSON en ContentBlock, blockKey con prefijo
 *    "list:") para secciones con estructura (icono + título + texto…);
 *  - `blocksEn` / `listsEn`: traducción por defecto de ambos para /en, con
 *    clave "<pageSlug>:<blockKey>".
 *
 * La web usa lo guardado en BD si existe y, si no, estos valores por defecto.
 */

export interface PageBlockDef {
  blockKey: string;
  title: string;
  defaultContent: string;
}

export interface PageDef {
  pageSlug: string;
  label: string;
  blocks: PageBlockDef[];
}

export type ListFieldType = "text" | "textarea" | "icon" | "url" | "check";

export interface ListField {
  key: string;
  label: string;
  type: ListFieldType;
  hint?: string;
}

export type ListItem = Record<string, string | boolean>;

export interface ListBlockDef {
  pageSlug: string;
  /** Con prefijo "list:" (p. ej. "list:lineas"). */
  blockKey: string;
  title: string;
  /** Nombre de cada elemento en el editor ("línea", "tarjeta"…). */
  itemLabel: string;
  fields: ListField[];
  defaultItems: ListItem[];
}

/** Módulo de contenido de una página (ver src/lib/content/blocks/*.ts). */
export interface PageContentModule {
  blocks: PageDef;
  lists: ListBlockDef[];
  blocksEn: Record<string, string>;
  listsEn: Record<string, ListItem[]>;
}

export const ICON_FIELD: ListField = {
  key: "icon",
  label: "Icono",
  type: "icon",
  hint: "nombre de icono Lucide (elige de la lista)",
};
