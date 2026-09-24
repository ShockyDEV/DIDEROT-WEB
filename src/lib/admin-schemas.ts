import { z } from "zod";
import { NEWS_CATEGORIES } from "@/lib/content/news";

/** Validación de entrada de las API del panel de administración. */

export const newsInputSchema = z.object({
  title: z.string().trim().min(3).max(300),
  slug: z.string().trim().max(300).optional(),
  excerpt: z.string().trim().max(1000).optional().nullable(),
  content: z.string().min(1),
  coverImage: z.string().trim().max(500).optional().nullable(),
  category: z.enum(NEWS_CATEGORIES),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  // Noticia interna: solo visible en la intranet, nunca en la web pública.
  internal: z.boolean().optional().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type NewsInput = z.infer<typeof newsInputSchema>;

export const memberInputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  area: z.string().trim().max(300).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
  extension: z.string().trim().max(20).optional().nullable(),
  role: z.string().trim().max(100).optional().nullable(),
  photo: z.string().trim().max(500).optional().nullable(),
  portalUrl: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("")),
  orcid: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("")),
  scopus: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("")),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  groupId: z.string().optional().nullable(),
});

export const groupInputSchema = z.object({
  acronym: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2).max(500),
  lead: z.string().trim().max(200).optional().nullable(),
  url: z.string().trim().url().max(300).optional().nullable().or(z.literal("")),
  logo: z.string().trim().max(500).optional().nullable(),
  chip: z.string().trim().max(50).optional().nullable(),
});

export const eventInputSchema = z.object({
  title: z.string().trim().min(3).max(300),
  type: z.enum(["Congreso", "Seminario", "Jornada"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  url: z.string().trim().url().max(300).optional().nullable().or(z.literal("")),
  image: z.string().trim().max(500).optional().nullable(),
  // Slug de la noticia que hace de crónica del evento («leer más»).
  newsSlug: z.string().trim().max(300).optional().nullable().or(z.literal("")),
  status: z.enum(["UPCOMING", "PAST", "CANCELLED"]),
});

export const projectInputSchema = z.object({
  title: z.string().trim().min(3).max(600),
  funder: z.string().trim().max(400).optional().nullable(),
  ip: z.string().trim().max(400).optional().nullable(),
  line: z.string().trim().max(300).optional().nullable(),
  scope: z.string().trim().max(60).optional().nullable(),
  amount: z.string().trim().max(60).optional().nullable(),
  period: z.string().trim().max(120).optional().nullable(),
  startYear: z.number().int().min(1990).max(2100).optional().nullable(),
  endYear: z.number().int().min(1990).max(2100).optional().nullable(),
  active: z.boolean().optional(),
  iuceLed: z.boolean().optional(),
});

export const contentBlockInputSchema = z.object({
  pageSlug: z.string().trim().min(1).max(100),
  blockKey: z.string().trim().min(1).max(100),
  content: z.string(),
});

export const accountInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(2).max(200),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
});
