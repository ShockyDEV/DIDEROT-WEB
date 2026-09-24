import type { MemberCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locale";
import { SITE } from "@/lib/site";

/**
 * Lecturas públicas del equipo (página «El grupo» → Equipo, portada y
 * perfiles ORCID de /publicaciones). Los datos los gestiona el panel
 * (Equipo); aquí solo se leen, se localizan y se sanean los enlaces.
 *
 * Todas las funciones toleran la BD caída: devuelven listas vacías o cero y
 * la página decide su estado vacío.
 */

/** Categorías del equipo en el orden en que se muestran en la web. */
export const MEMBER_CATEGORIES: ReadonlyArray<{
  value: MemberCategory;
  label: string;
  labelEn: string;
}> = [
  { value: "COORDINATION", label: "Coordinación", labelEn: "Coordination" },
  { value: "RESEARCHER", label: "Personal investigador", labelEn: "Researchers" },
  {
    value: "PREDOCTORAL",
    label: "Personal investigador en formación",
    labelEn: "Predoctoral researchers",
  },
  { value: "COLLABORATOR", label: "Colaboradores", labelEn: "Collaborators" },
];

export interface PublicMember {
  id: string;
  name: string;
  category: MemberCategory;
  /** Puesto académico (p. ej. «Profesor Titular de Universidad»), ya localizado. */
  role: string | null;
  /** Institución y departamento. */
  affiliation: string | null;
  /** Área de conocimiento. */
  area: string | null;
  /** Semblanza breve (texto plano), ya localizada. */
  bio: string | null;
  email: string | null;
  /** Ruta local (/uploads/…, /images/…) o URL https. */
  photo: string | null;
  portalUrl: string | null;
  orcid: string | null;
  scopus: string | null;
  scholar: string | null;
  website: string | null;
}

/**
 * Enlace externo seguro: solo http(s). Cualquier otro esquema (javascript:,
 * data:…) se descarta aunque llegue de la BD: la web anterior fue atacada y
 * un href malicioso guardado en el panel no debe llegar nunca a la página.
 */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** Imagen segura: ruta local del propio sitio o URL http(s). */
export function safeImageSrc(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  // Ruta del propio sitio, pero no «//host» (sería otro dominio).
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return safeHttpUrl(value);
}

/** ORCID como URL: admite el identificador suelto o la URL completa. */
export function orcidUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value)) {
    return `https://orcid.org/${value.toUpperCase()}`;
  }
  return safeHttpUrl(value);
}

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

function safeEmail(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  return value && EMAIL_RE.test(value) ? value : null;
}

/** Texto opcional: recortado y sin cadenas vacías. */
function clean(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/**
 * Coordinación por defecto si la BD no responde o aún no tiene miembros:
 * mejor mostrar al coordinador (dato fijo del sitio) que una sección vacía.
 */
function coordinatorFallback(locale: Locale): PublicMember {
  return {
    id: "coordinacion",
    name: SITE.lead,
    category: "COORDINATION",
    role:
      locale === "en" ? "Associate Professor" : "Profesor Titular de Universidad",
    affiliation:
      "Universidad de Salamanca · Departamento de Didáctica de la Expresión Musical, Plástica y Corporal",
    area: null,
    bio: null,
    email: SITE.email,
    photo: null,
    portalUrl: null,
    orcid: null,
    scopus: null,
    scholar: null,
    website: null,
  };
}

/**
 * Miembros activos para la web, ordenados por categoría (orden del enum:
 * coordinación → colaboradores), `order` y nombre. En /en se usan roleEn y
 * bioEn si existen. Sin BD o sin filas: solo la coordinación por defecto.
 */
export async function getPublicMembers(locale: Locale): Promise<PublicMember[]> {
  const en = locale === "en";
  try {
    const rows = await prisma.member.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
    });
    if (rows.length > 0) {
      return rows.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        category: m.category,
        role: clean(en ? (m.roleEn ?? m.role) : m.role),
        affiliation: clean(m.affiliation),
        area: clean(m.area),
        bio: clean(en ? (m.bioEn ?? m.bio) : m.bio),
        email: safeEmail(m.email),
        photo: safeImageSrc(m.photo),
        portalUrl: safeHttpUrl(m.portalUrl),
        orcid: orcidUrl(m.orcid),
        scopus: safeHttpUrl(m.scopus),
        scholar: safeHttpUrl(m.scholar),
        website: safeHttpUrl(m.website),
      }));
    }
  } catch {
    // BD no disponible: seguimos con la coordinación por defecto.
  }
  return [coordinatorFallback(locale)];
}

/** Número de miembros activos (cifras de la portada). */
export async function countActiveMembers(): Promise<number> {
  try {
    return await prisma.member.count({ where: { active: true } });
  } catch {
    return 0;
  }
}

/** Perfiles ORCID de los miembros activos que lo tienen (/publicaciones). */
export async function getMemberOrcids(): Promise<
  Array<{ name: string; orcid: string }>
> {
  try {
    const rows = await prisma.member.findMany({
      where: { active: true, orcid: { not: null } },
      orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
      select: { name: true, orcid: true },
    });
    return rows.flatMap((m) => {
      const orcid = orcidUrl(m.orcid);
      return orcid ? [{ name: m.name.trim(), orcid }] : [];
    });
  } catch {
    return [];
  }
}
