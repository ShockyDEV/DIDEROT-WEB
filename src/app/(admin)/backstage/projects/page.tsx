import Link from "next/link";
import { EyeOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isSectionVisible } from "@/lib/page-visibility";
import {
  ProjectsSection,
  type ProjectRow,
} from "@/components/admin/projects-section";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const [items, seccionVisible] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ endYear: { sort: "desc", nulls: "last" } }, { title: "asc" }],
    }),
    isSectionVisible("seccion-proyectos"),
  ]);

  const rows: ProjectRow[] = items.map((p) => ({
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
    active: p.active,
    iuceLed: p.iuceLed,
  }));

  return (
    <div className="flex flex-col gap-5">
      {!seccionVisible ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-5 py-4">
          <EyeOff
            className="mt-0.5 h-4 w-4 flex-none text-[#B45309]"
            aria-hidden="true"
          />
          <p className="text-sm text-[#92400E]">
            La sección de Proyectos está <strong>oculta en la web pública</strong>
            {" "}(los datos se conservan y se pueden seguir editando aquí). Para
            mostrarla, activa «Investigación — Proyectos» en{" "}
            <Link
              href="/backstage/visualizacion"
              className="font-medium underline"
            >
              Visualización
            </Link>
            .
          </p>
        </div>
      ) : null}
      <ProjectsSection rows={rows} />
    </div>
  );
}
