import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { projectInputSchema } from "@/lib/admin-schemas";
import { projectData } from "@/lib/admin-mappers";

interface Params {
  params: { id: string };
}

export const PUT = withErrorHandling(
  "projects:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, projectInputSchema, 64 * 1024);
    if (body.response) return body.response;

    const existing = await prisma.project.findUnique({
      where: { id },
      select: { featured: true, active: true },
    });
    if (!existing) return apiError("Proyecto no encontrado", 404);

    const d = body.data;
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(await projectData(d)),
        featured: d.featured ?? existing.featured,
        active: d.active ?? existing.active,
      },
    });
    return NextResponse.json({ item: updated });
  },
);

export const DELETE = withErrorHandling(
  "projects:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiError("Proyecto no encontrado", 404);

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
