import { prisma } from "@/lib/prisma";

export interface PublicProject {
  id: string;
  title: string;
  funder: string | null;
  ip: string | null;
  line: string | null;
  scope: string | null;
  amount: string | null;
  period: string | null;
  startYear: number | null;
  endYear: number | null;
}

/**
 * Proyectos visibles en la web pública (los gestiona el panel: Instituto →
 * Proyectos), ordenados por año de fin descendente (los vigentes primero).
 * Sin BD devuelve lista vacía: la sección muestra su estado vacío.
 *
 * Solo los proyectos DEL IUCE (`iuceLed`): los firmados por el Instituto o
 * con más del 50% del equipo del IUCE, según la Tabla 4 de la memoria. Los
 * proyectos en los que el Instituto solo participa con un porcentaje mínimo
 * se conservan en la BD (estadísticas, panel), pero no se listan aquí.
 */
export async function getPublicProjects(): Promise<PublicProject[]> {
  try {
    const rows = await prisma.project.findMany({
      where: { active: true, iuceLed: true },
      orderBy: [
        { endYear: { sort: "desc", nulls: "last" } },
        { startYear: { sort: "desc", nulls: "last" } },
        { title: "asc" },
      ],
    });
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      funder: p.funder,
      ip: p.ip,
      line: p.line,
      scope: p.scope,
      amount: p.amount,
      period: p.period,
      startYear: p.startYear,
      endYear: p.endYear,
    }));
  } catch {
    return [];
  }
}
