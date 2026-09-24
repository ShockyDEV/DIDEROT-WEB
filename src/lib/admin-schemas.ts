import { z } from "zod";
import { NEWS_CATEGORIES } from "@/lib/content/news";
import { normalizeDoi } from "@/lib/content/publication-types";
import {
  EVENT_TYPES,
  MEMBER_CATEGORY_VALUES,
  PUBLICATION_SOURCE_VALUES,
  PUBLICATION_TYPE_VALUES,
} from "@/lib/admin-options";
import { orcidUrl, parseOrcidId } from "@/lib/orcid-import";

/**
 * Validación de entrada de las API del panel de administración. Todo lo que
 * llega del cliente pasa por aquí antes de tocar la BD; los mensajes están
 * en castellano porque se muestran tal cual en los toasts del panel.
 *
 * Criterios comunes:
 * - Los textos se recortan (trim) y tienen longitud máxima.
 * - Los campos opcionales aceptan "" y lo guardan como null.
 * - Las URLs públicas solo pueden ser http(s): una URL «javascript:» en un
 *   href de la web sería un XSS (z.string().url() las da por buenas).
 */

/* ── Piezas reutilizables ───────────────────────────────────────────────── */

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

/** Texto obligatorio con longitud mínima y máxima. */
const text = (label: string, min: number, max: number) =>
  z
    .string({
      required_error: `Falta ${label}`,
      invalid_type_error: `${capitalize(label)}: valor no válido`,
    })
    .trim()
    .min(min, min <= 1 ? `Falta ${label}` : `${capitalize(label)}: mínimo ${min} caracteres`)
    .max(max, `${capitalize(label)}: máximo ${max} caracteres`);

/** Texto opcional ("" → null). */
const optionalText = (label: string, max: number) =>
  z
    .preprocess(
      emptyToNull,
      z.string().trim().max(max, `${capitalize(label)}: máximo ${max} caracteres`).nullable(),
    )
    .optional();

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** ¿URL absoluta http(s)? */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname);
  } catch {
    return false;
  }
}

/** ¿Ruta propia («/uploads/…», «/images/…») o URL http(s)? (imágenes, fotos) */
export function isMediaUrl(value: string): boolean {
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  return isHttpUrl(value);
}

/**
 * ¿Enlace seguro para una lista editable? http(s), mailto:, tel:, rutas
 * propias («/contacto») y anclas («#equipo»).
 */
export function isSafeLink(value: string): boolean {
  if (/^(\/(?!\/)|#|\?)[^\s\\]*$/.test(value)) return true;
  if (/^mailto:[^\s]+$/i.test(value) || /^tel:[+\d\s().-]+$/i.test(value)) return true;
  return isHttpUrl(value);
}

/** URL pública opcional (solo http/https; "" → null). */
const optionalHttpUrl = (label = "El enlace") =>
  z
    .preprocess(
      emptyToNull,
      z
        .string()
        .trim()
        .max(500, `${label}: máximo 500 caracteres`)
        .refine(isHttpUrl, `${label} debe ser una dirección web completa (https://…)`)
        .nullable(),
    )
    .optional();

/** Enlace opcional: URL http(s) o archivo propio (p. ej. un PDF en /uploads/…). */
const optionalLinkUrl = (label = "El enlace") =>
  z
    .preprocess(
      emptyToNull,
      z
        .string()
        .trim()
        .max(500, `${label}: máximo 500 caracteres`)
        .refine(isMediaUrl, `${label} debe ser una dirección https://… o un archivo subido (/uploads/…)`)
        .nullable(),
    )
    .optional();

/** Imagen opcional: archivo subido (/uploads/…) o URL http(s). */
const optionalMediaUrl = (label = "La imagen") =>
  z
    .preprocess(
      emptyToNull,
      z
        .string()
        .trim()
        .max(500, `${label}: máximo 500 caracteres`)
        .refine(isMediaUrl, `${label} debe ser un archivo subido (/uploads/…) o una URL https://`)
        .nullable(),
    )
    .optional();

const optionalEmail = z
  .preprocess(
    emptyToNull,
    z.string().trim().toLowerCase().max(200).email("Correo electrónico no válido").nullable(),
  )
  .optional();

/** Año opcional ("" → null; admite número o texto numérico). */
const optionalYear = (min: number, max: number) =>
  z
    .preprocess(
      (v) => {
        const n = emptyToNull(v);
        return typeof n === "string" && /^\d+$/.test(n.trim()) ? Number(n) : n;
      },
      z
        .number({ invalid_type_error: "El año debe ser un número" })
        .int("El año debe ser un número entero")
        .min(min, `El año debe estar entre ${min} y ${max}`)
        .max(max, `El año debe estar entre ${min} y ${max}`)
        .nullable(),
    )
    .optional();

/** ORCID opcional: acepta el iD o su URL y lo guarda como https://orcid.org/… */
const optionalOrcid = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(100)
      .transform((v, ctx) => {
        const id = parseOrcidId(v);
        if (!id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "ORCID no válido: usa el formato 0000-0000-0000-0000 (se comprueba el dígito de control)",
          });
          return z.NEVER;
        }
        return orcidUrl(id);
      })
      .nullable(),
  )
  .optional();

/** ORCID iD obligatorio (para la importación): devuelve «0000-0000-0000-0000». */
export const orcidIdSchema = z
  .string({ required_error: "Falta el ORCID iD" })
  .trim()
  .max(100)
  .transform((v, ctx) => {
    const id = parseOrcidId(v);
    if (!id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ORCID iD no válido: «${v.slice(0, 40)}» (formato 0000-0000-0000-0000 y dígito de control)`,
      });
      return z.NEVER;
    }
    return id;
  });

const isoDate = (label: string) =>
  z.string({ required_error: `Falta ${label}` }).datetime({ message: `${capitalize(label)} no válida` });

/* ── Noticias ───────────────────────────────────────────────────────────── */

export const newsInputSchema = z.object({
  title: text("el título", 3, 300),
  slug: z.string().trim().max(300, "Slug: máximo 300 caracteres").optional(),
  excerpt: optionalText("el extracto", 1000),
  content: z
    .string({ required_error: "Falta el contenido" })
    .min(1, "El contenido no puede estar vacío")
    .max(500_000, "El contenido es demasiado largo"),
  coverImage: optionalMediaUrl("La portada"),
  // Categorías: las mantiene src/lib/content/news.ts (NEWS_CATEGORIES).
  category: z
    .string()
    .refine((c) => (NEWS_CATEGORIES as readonly string[]).includes(c), "Categoría no válida"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"], {
    errorMap: () => ({ message: "Estado no válido" }),
  }),
  publishedAt: isoDate("la fecha de publicación").optional().nullable(),
});

export type NewsInput = z.infer<typeof newsInputSchema>;

/* ── Equipo ─────────────────────────────────────────────────────────────── */

export const memberInputSchema = z.object({
  name: text("el nombre", 2, 200),
  category: z.enum(MEMBER_CATEGORY_VALUES, {
    errorMap: () => ({ message: "Categoría no válida" }),
  }),
  role: optionalText("el cargo", 200),
  roleEn: optionalText("el cargo en inglés", 200),
  affiliation: optionalText("la afiliación", 300),
  area: optionalText("el área", 300),
  bio: optionalText("la semblanza", 4000),
  bioEn: optionalText("la semblanza en inglés", 4000),
  email: optionalEmail,
  photo: optionalMediaUrl("La foto"),
  portalUrl: optionalHttpUrl("El perfil del Portal de Investigación"),
  orcid: optionalOrcid,
  scopus: optionalHttpUrl("El perfil de Scopus"),
  scholar: optionalHttpUrl("El perfil de Google Scholar"),
  website: optionalHttpUrl("La web personal"),
  active: z.boolean().optional(),
  order: z
    .number({ invalid_type_error: "El orden debe ser un número" })
    .int()
    .min(0, "El orden no puede ser negativo")
    .max(9999)
    .optional(),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

/* ── Proyectos ──────────────────────────────────────────────────────────── */

export const projectInputSchema = z
  .object({
    title: text("el título", 3, 600),
    titleEn: optionalText("el título en inglés", 600),
    acronym: optionalText("el acrónimo", 80),
    reference: optionalText("la referencia", 120),
    funder: optionalText("la entidad financiadora", 400),
    ip: optionalText("el investigador principal", 400),
    scope: optionalText("el ámbito", 60),
    amount: optionalText("el importe", 60),
    period: optionalText("el periodo", 120),
    startYear: optionalYear(1950, 2100),
    endYear: optionalYear(1950, 2100),
    summary: optionalText("el resumen", 4000),
    summaryEn: optionalText("el resumen en inglés", 4000),
    url: optionalLinkUrl("La web del proyecto"),
    portalUrl: optionalLinkUrl("La ficha del Portal"),
    image: optionalMediaUrl("La imagen"),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => !d.startYear || !d.endYear || d.startYear <= d.endYear, {
    message: "El año de inicio no puede ser posterior al de fin",
    path: ["endYear"],
  });

export type ProjectInput = z.infer<typeof projectInputSchema>;

/* ── Eventos ────────────────────────────────────────────────────────────── */

export const eventInputSchema = z
  .object({
    title: text("el título", 3, 300),
    titleEn: optionalText("el título en inglés", 300),
    type: z.enum(EVENT_TYPES, { errorMap: () => ({ message: "Tipo de evento no válido" }) }),
    description: optionalText("la descripción", 2000),
    descriptionEn: optionalText("la descripción en inglés", 2000),
    startsAt: isoDate("la fecha"),
    endsAt: isoDate("la fecha de fin").optional().nullable(),
    location: optionalText("el lugar", 300),
    url: optionalLinkUrl("La web del evento"),
    image: optionalMediaUrl("El cartel"),
    programUrl: optionalLinkUrl("El programa"),
    // Slug de la noticia que hace de crónica del evento («leer más»).
    newsSlug: z
      .preprocess(
        emptyToNull,
        z
          .string()
          .trim()
          .max(300)
          .regex(/^[a-z0-9-]+$/, "Crónica no válida")
          .nullable(),
      )
      .optional(),
    status: z.enum(["UPCOMING", "PAST", "CANCELLED"], {
      errorMap: () => ({ message: "Estado no válido" }),
    }),
  })
  .refine((d) => !d.endsAt || new Date(d.endsAt) >= new Date(d.startsAt), {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endsAt"],
  });

export type EventInput = z.infer<typeof eventInputSchema>;

/* ── Publicaciones ──────────────────────────────────────────────────────── */

/** Año de publicación razonable: de 1900 al año que viene (en prensa). */
const publicationYear = z
  .preprocess(
    (v) => (typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : v),
    z
      .number({ required_error: "Falta el año", invalid_type_error: "El año debe ser un número" })
      .int("El año debe ser un número entero"),
  )
  .refine((y) => y >= 1900 && y <= new Date().getFullYear() + 1, () => ({
    message: `El año debe estar entre 1900 y ${new Date().getFullYear() + 1}`,
  }));

const optionalDoi = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(300, "DOI: máximo 300 caracteres")
      .transform((v, ctx) => {
        const doi = normalizeDoi(v);
        if (!doi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "DOI no válido (p. ej. 10.3390/educsci14111171 o https://doi.org/…)",
          });
          return z.NEVER;
        }
        return doi;
      })
      .nullable(),
  )
  .optional();

const publicationFields = {
  title: text("el título", 3, 1000),
  authors: text("los autores", 2, 4000),
  year: publicationYear,
  type: z.enum(PUBLICATION_TYPE_VALUES, {
    errorMap: () => ({ message: "Tipo de publicación no válido" }),
  }),
  venue: optionalText("la revista / editorial", 500),
  details: optionalText("los detalles", 500),
  doi: optionalDoi,
  url: optionalLinkUrl("El enlace"),
  abstract: optionalText("el resumen", 10_000),
  openAccess: z.boolean().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
};

/** Alta (y edición completa) de una publicación. */
export const publicationInputSchema = z.object(publicationFields);

/** Edición parcial (PATCH): p. ej. solo { published } desde la tabla. */
export const publicationPatchSchema = z
  .object(publicationFields)
  .partial()
  .refine((d) => Object.keys(d).length > 0, "No hay cambios que guardar");

export type PublicationInput = z.infer<typeof publicationInputSchema>;

/** Filtros del listado (?q=&type=&year=&visible=&source=&page=). */
export const publicationListQuerySchema = z.object({
  q: z.string().trim().max(200).optional().catch(undefined),
  type: z.enum(PUBLICATION_TYPE_VALUES).optional().catch(undefined),
  year: z.coerce.number().int().min(1900).max(2100).optional().catch(undefined),
  visible: z.enum(["visible", "hidden", "featured"]).optional().catch(undefined),
  source: z.enum(PUBLICATION_SOURCE_VALUES).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});

export type PublicationListQuery = z.infer<typeof publicationListQuerySchema>;

/** Vista previa de la importación: ORCID iD escritos y/o miembros del equipo. */
export const orcidPreviewSchema = z
  .object({
    orcids: z.array(orcidIdSchema).max(25, "Como máximo 25 ORCID por consulta").default([]),
    memberIds: z
      .array(z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Miembro no válido"))
      .max(60)
      .default([]),
  })
  .refine((d) => d.orcids.length + d.memberIds.length > 0, {
    message: "Elige al menos un miembro o escribe un ORCID iD",
    path: ["orcids"],
  });

/** Importación: las obras marcadas en la vista previa. */
export const orcidImportSchema = z.object({
  items: z
    .array(
      z.object({
        orcid: orcidIdSchema,
        putCode: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      }),
    )
    .min(1, "No hay ninguna publicación marcada")
    .max(1000, "Como máximo 1000 publicaciones por importación"),
});

/* ── Contenido y sistema ────────────────────────────────────────────────── */

export const contentBlockInputSchema = z.object({
  pageSlug: z.string().trim().min(1).max(100).regex(/^[a-z0-9_-]+$/, "Página no válida"),
  blockKey: z.string().trim().min(1).max(120).regex(/^[a-z0-9:_-]+$/i, "Bloque no válido"),
  content: z.string().max(500_000, "El contenido es demasiado largo"),
});

/** Datos del sitio (Configuración; ContentBlock pageSlug "_site"). */
export const siteSettingsSchema = z.object({
  name: text("el nombre del sitio", 2, 200),
  email: z
    .string({ required_error: "Falta el correo de contacto" })
    .trim()
    .toLowerCase()
    .max(200)
    .email("Correo de contacto no válido"),
  phone: z
    .preprocess(
      emptyToNull,
      z
        .string()
        .trim()
        .max(40)
        .regex(/^[+\d\s().-]{6,40}$/, "Teléfono no válido")
        .nullable(),
    )
    .optional(),
  seoDescription: text("la descripción", 20, 320),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const pageVisibilitySchema = z.object({
  slug: z.string().trim().min(1).max(100),
  hidden: z.boolean(),
});

export const messageStatusSchema = z.object({
  status: z.enum(["NEW", "REPLIED"], { errorMap: () => ({ message: "Estado no válido" }) }),
});

/* ── Cuentas ────────────────────────────────────────────────────────────── */

export const MIN_PASSWORD_LENGTH = 12;

/** Contraseña nueva: ≥ 12 caracteres (bcrypt solo usa los 72 primeros bytes). */
const newPassword = z
  .string({ required_error: "Falta la contraseña" })
  .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
  .max(128, "La contraseña no puede superar los 128 caracteres")
  .refine((p) => new Set(p).size >= 4, "La contraseña es demasiado repetitiva");

const accountRole = z.enum(["ADMIN", "SUPER_ADMIN"], {
  errorMap: () => ({ message: "Rol no válido" }),
});

export const accountInputSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(200).email("Correo electrónico no válido"),
    name: text("el nombre", 2, 200),
    password: newPassword,
    role: accountRole.default("ADMIN"),
  })
  .refine((d) => d.password.toLowerCase() !== d.email, {
    message: "La contraseña no puede ser el propio correo",
    path: ["password"],
  });

/** Cambios de un SUPER_ADMIN sobre otra cuenta: rol y/o nueva contraseña. */
export const accountUpdateSchema = z
  .object({
    role: accountRole.optional(),
    password: newPassword.optional(),
    name: text("el nombre", 2, 200).optional(),
  })
  .refine((d) => d.role !== undefined || d.password !== undefined || d.name !== undefined, {
    message: "No hay cambios que guardar",
  });

/** «Cambiar mi contraseña»: actual + nueva + repetición. */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Escribe tu contraseña actual" })
      .min(1, "Escribe tu contraseña actual")
      .max(256),
    newPassword,
    confirmPassword: z.string({ required_error: "Repite la contraseña nueva" }).max(256),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las dos contraseñas nuevas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "La contraseña nueva debe ser distinta de la actual",
    path: ["newPassword"],
  });

/* ── Traducción bajo demanda ────────────────────────────────────────────── */

export const translateInputSchema = z.object({
  text: z.string().min(1, "No hay texto que traducir").max(50_000, "El texto es demasiado largo"),
  /** true si el texto es HTML (se preservan las etiquetas). */
  html: z.boolean().optional(),
});
