import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { publicationPatchSchema } from "@/lib/admin-schemas";

interface Params {
  params: { id: string };
}

/**
 * PATCH: edición parcial. Sirve tanto para el formulario completo como para
 * los conmutadores de la tabla ({ published } / { featured }): solo se
 * tocan los campos que llegan.
 */
export const PATCH = withErrorHandling(
  "publications:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, publicationPatchSchema, 64 * 1024);
    if (body.response) return body.response;

    const existing = await prisma.publication.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return apiError("Publicación no encontrada", 404);

    const d = body.data;
    if (d.doi) {
      const clash = await prisma.publication.findFirst({
        where: { doi: d.doi, NOT: { id } },
        select: { title: true },
      });
      if (clash) {
        return apiError(
          `Ya existe otra publicación con ese DOI: «${clash.title.slice(0, 120)}»`,
          409,
        );
      }
    }

    // Solo los campos presentes (undefined = no se toca).
    const data = Object.fromEntries(
      Object.entries(d).filter(([, value]) => value !== undefined),
    ) as Prisma.PublicationUpdateInput;

    const updated = await prisma.publication.update({ where: { id }, data });
    return NextResponse.json({ item: updated });
  },
);

export const DELETE = withErrorHandling(
  "publications:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.publication.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return apiError("Publicación no encontrada", 404);

    await prisma.publication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
