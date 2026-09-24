import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/locale";
import { safeHttpUrl, safeImageSrc } from "@/lib/members-service";

/**
 * Proyecto tal y como lo pinta el explorador público (/investigacion). Los
 * textos llegan ya localizados (titleEn / summaryEn en /en, con el español
 * de respaldo) y los enlaces saneados.
 */
export interface PublicProject {
  id: string;
  title: string;
  acronym: string | null;
  reference: string | null;
  funder: string | null;
  ip: string | null;
  /** Ámbito tal cual en BD (Europeo, Nacional…): el filtro usa este valor. */
  scope: string | null;
  period: string | null;
  startYear: number | null;
  endYear: number | null;
  summary: string | null;
  url: string | null;
  /** Ficha en el Portal de Producción Científica de la USAL. */
  portalUrl: string | null;
  image: string | null;
  featured: boolean;
}

const clean = (v: string | null | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};

/**
 * Proyectos visibles en la web (los gestiona el panel: Proyectos), ordenados
 * por año de fin descendente (los vigentes primero). Sin BD devuelve lista
 * vacía: la sección muestra su estado vacío.
 */
export async function getPublicProjects(locale: Locale): Promise<PublicProject[]> {
  const en = locale === "en";
  try {
    const rows = await prisma.project.findMany({
      where: { active: true },
      orderBy: [
        { endYear: { sort: "desc", nulls: "last" } },
        { startYear: { sort: "desc", nulls: "last" } },
        { title: "asc" },
      ],
    });
    return rows.map((p) => ({
      id: p.id,
      title: (en ? clean(p.titleEn) : null) ?? p.title.trim(),
      acronym: clean(p.acronym),
      reference: clean(p.reference),
      funder: clean(p.funder),
      ip: clean(p.ip),
      scope: clean(p.scope),
      period: clean(p.period),
      startYear: p.startYear,
      endYear: p.endYear,
      summary: (en ? clean(p.summaryEn) : null) ?? clean(p.summary),
      url: safeHttpUrl(p.url),
      portalUrl: safeHttpUrl(p.portalUrl),
      image: safeImageSrc(p.image),
      featured: p.featured,
    }));
  } catch {
    return [];
  }
}

/** ¿Ámbito europeo? Tolera «Europeo», «Europea», «European»… */
function isEuropean(scope: string | null): boolean {
  if (!scope) return false;
  return scope
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .startsWith("europe");
}

/**
 * Cifras vivas de proyectos para la portada: total visible, cuántos son
 * europeos y cuántos siguen vigentes este año. Sin BD, todo a cero (la
 * banda de cifras oculta las que valen 0).
 */
export async function getProjectStats(): Promise<{
  total: number;
  european: number;
  ongoing: number;
}> {
  try {
    const rows = await prisma.project.findMany({
      where: { active: true },
      select: { scope: true, endYear: true },
    });
    const year = new Date().getFullYear();
    return {
      total: rows.length,
      european: rows.filter((p) => isEuropean(p.scope)).length,
      ongoing: rows.filter((p) => p.endYear !== null && p.endYear >= year)
        .length,
    };
  } catch {
    return { total: 0, european: 0, ongoing: 0 };
  }
}
