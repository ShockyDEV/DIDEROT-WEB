import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";

/**
 * Datos generales del sitio editables en el panel (Configuración → Datos
 * del sitio). Se guardan como ContentBlock con pageSlug "_site" (sin
 * auto-traducción) y, si no hay fila, valen los de src/lib/site.ts.
 *
 * Solo servidor. La web pública puede usar getSiteSettings() para el correo
 * y el teléfono de contacto o la descripción SEO.
 */

export const SITE_SETTINGS_PAGE = "_site";

/** Campo → blockKey en ContentBlock. */
export const SITE_SETTINGS_KEYS = {
  name: "name",
  email: "email",
  phone: "phone",
  seoDescription: "seo-description",
} as const;

export interface SiteSettings {
  name: string;
  email: string;
  /** Opcional: "" si el grupo no publica teléfono. */
  phone: string;
  seoDescription: string;
}

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  name: `${SITE.shortName} — ${SITE.name}`,
  email: SITE.email,
  phone: "",
  // Misma descripción que los metadatos por defecto de src/app/layout.tsx.
  seoDescription:
    "DIDEROT es un Grupo de Investigación Reconocido de la Universidad de Salamanca, adscrito al IUCE, que investiga nuevas metodologías y didácticas digitales en la intersección entre la educación musical, el arte y la vanguardia tecnológica.",
};

/** Datos del sitio con sus valores por defecto (sin BD, los por defecto). */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.contentBlock.findMany({
      where: { pageSlug: SITE_SETTINGS_PAGE },
      select: { blockKey: true, content: true },
    });
    const saved = new Map(rows.map((r) => [r.blockKey, r.content]));
    const get = (field: keyof SiteSettings) =>
      saved.get(SITE_SETTINGS_KEYS[field]) ?? SITE_SETTINGS_DEFAULTS[field];
    return {
      name: get("name") || SITE_SETTINGS_DEFAULTS.name,
      email: get("email") || SITE_SETTINGS_DEFAULTS.email,
      phone: get("phone"),
      seoDescription: get("seoDescription") || SITE_SETTINGS_DEFAULTS.seoDescription,
    };
  } catch {
    return SITE_SETTINGS_DEFAULTS;
  }
}
