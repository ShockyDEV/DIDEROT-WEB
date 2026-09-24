import type { MemberCategory, PublicationType } from "@prisma/client";

/**
 * Opciones cerradas de los formularios del panel (selects, chips, filtros).
 * Módulo seguro para componentes de cliente: solo constantes (el import de
 * @prisma/client es de tipos y desaparece al compilar). Los esquemas de
 * validación (admin-schemas.ts) usan estas mismas listas.
 */

/* ── Equipo ─────────────────────────────────────────────────────────────── */

export const MEMBER_CATEGORIES = [
  {
    value: "COORDINATION",
    label: "Coordinación",
    heading: "Coordinación",
  },
  {
    value: "RESEARCHER",
    label: "Personal investigador",
    heading: "Personal investigador",
  },
  {
    value: "PREDOCTORAL",
    label: "Personal investigador en formación",
    heading: "Personal investigador en formación",
  },
  {
    value: "COLLABORATOR",
    label: "Colaborador/a",
    heading: "Colaboradores y colaboradoras",
  },
] as const satisfies ReadonlyArray<{
  value: MemberCategory;
  label: string;
  heading: string;
}>;

export type MemberCategoryValue = (typeof MEMBER_CATEGORIES)[number]["value"];

export const MEMBER_CATEGORY_VALUES = MEMBER_CATEGORIES.map((c) => c.value) as [
  MemberCategoryValue,
  ...MemberCategoryValue[],
];

export function memberCategoryLabel(value: string): string {
  return MEMBER_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/* ── Publicaciones ──────────────────────────────────────────────────────── */

export const PUBLICATION_TYPE_VALUES = [
  "ARTICLE",
  "BOOK",
  "CHAPTER",
  "CONFERENCE",
  "THESIS",
  "OTHER",
] as const satisfies ReadonlyArray<PublicationType>;

export type PublicationTypeValue = (typeof PUBLICATION_TYPE_VALUES)[number];

/**
 * Procedencia de cada publicación: alta a mano en el panel, importada de
 * ORCID o cargada por la semilla desde el Portal de Producción Científica.
 */
export const PUBLICATION_SOURCES = [
  { value: "manual", label: "Manual" },
  { value: "orcid", label: "ORCID" },
  { value: "portal", label: "Portal USAL" },
] as const;

export type PublicationSourceValue = (typeof PUBLICATION_SOURCES)[number]["value"];

export const PUBLICATION_SOURCE_VALUES = PUBLICATION_SOURCES.map(
  (s) => s.value,
) as [PublicationSourceValue, ...PublicationSourceValue[]];

export function publicationSourceLabel(value: string): string {
  return PUBLICATION_SOURCES.find((s) => s.value === value)?.label ?? value;
}

/* ── Eventos ────────────────────────────────────────────────────────────── */

export const EVENT_TYPES = [
  "Seminario",
  "Jornada",
  "Congreso",
  "Concierto",
  "Taller",
  "Conferencia",
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number];

/* ── Proyectos ──────────────────────────────────────────────────────────── */

/** Ámbitos habituales (el campo admite otro valor si ya venía en los datos). */
export const PROJECT_SCOPES = [
  "Europeo",
  "Internacional",
  "Nacional",
  "Autonómico",
  "Institucional",
  "Local",
] as const;

/* ── Páginas ────────────────────────────────────────────────────────────── */

/**
 * Bloques de tipo enlace: claves «url-…», «…-url» o «…:url…». En el panel
 * se editan con un campo de URL (no con el editor de texto) y no se
 * traducen.
 */
export function isUrlBlockKey(blockKey: string): boolean {
  return /(^|[-:])url([-:]|$)/.test(blockKey);
}

/* ── Archivos ───────────────────────────────────────────────────────────── */

/** Carpetas de /uploads a las que se puede subir desde el panel. */
export const UPLOAD_FOLDERS = ["news", "events", "projects", "pages"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Extensiones admitidas (mismas que src/lib/uploads.ts), para <input accept>. */
export const ACCEPT_ANY_UPLOAD =
  ".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.ogg,.wav,.mp4";
export const ACCEPT_IMAGE_UPLOAD = ".jpg,.jpeg,.png,.webp,.gif";

/** Tamaño máximo de subida (igual que MAX_UPLOAD_BYTES del servidor). */
export const MAX_UPLOAD_MB = 25;
