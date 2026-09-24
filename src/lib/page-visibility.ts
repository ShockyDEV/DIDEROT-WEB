import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGES, PUBLIC_SECTIONS } from "@/lib/content/public-pages";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

/**
 * Visibilidad de las páginas públicas (panel → Visualización). Sin fila en BD
 * la página se ve; solo se guardan las que se han tocado.
 */

/** Slugs de las páginas ocultas. Sin BD devuelve vacío (mejor ver que romper). */
export async function getHiddenPages(): Promise<Set<string>> {
  try {
    const rows = await prisma.pageVisibility.findMany({
      where: { hidden: true },
      select: { slug: true },
    });
    return new Set(rows.map((r) => r.slug));
  } catch {
    return new Set();
  }
}

/** Rutas ocultas (para filtrar el menú de navegación). Incluye tanto páginas
 *  como secciones ocultables (sus rutas con ancla, p. ej.
 *  «/investigacion#proyectos»), de modo que el menú y sus desplegables se
 *  filtran con una única lista. */
export async function getHiddenPaths(): Promise<string[]> {
  try {
    const rows = await prisma.pageVisibility.findMany();
    const state = new Map(rows.map((r) => [r.slug, r.hidden]));
    const paths = PUBLIC_PAGES.filter((p) => state.get(p.slug) === true).map(
      (p) => p.path,
    );
    for (const s of PUBLIC_SECTIONS) {
      if (state.get(s.slug) ?? s.defaultHidden) paths.push(s.path);
    }
    return paths;
  } catch {
    return [];
  }
}

/**
 * Corta con un 404 el render de una página oculta. La administración sí puede
 * verla, para poder retocarla antes de volver a publicarla.
 *
 * Se llama al principio de cada página pública ocultable.
 */
export async function assertVisible(slug: string): Promise<void> {
  const hidden = await getHiddenPages();
  if (!hidden.has(slug)) return;

  // Solo se comprueba la sesión si la página está oculta.
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  if (role && ADMIN_ROLES.has(role)) return;

  notFound();
}

/** ¿Está oculta? (para avisar a la administración que la está previsualizando) */
export async function isPageHidden(slug: string): Promise<boolean> {
  return (await getHiddenPages()).has(slug);
}

/**
 * ¿Se muestra una sección ocultable (registro PUBLIC_SECTIONS)? Sin fila en
 * BD manda su defaultHidden; sin BD, también (mejor el valor previsto que
 * romper).
 */
export async function isSectionVisible(slug: string): Promise<boolean> {
  const def = PUBLIC_SECTIONS.find((s) => s.slug === slug);
  const fallback = !(def?.defaultHidden ?? false);
  try {
    const row = await prisma.pageVisibility.findUnique({ where: { slug } });
    return row ? !row.hidden : fallback;
  } catch {
    return fallback;
  }
}
