import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { memberInputSchema } from "@/lib/admin-schemas";
import { memberData } from "@/lib/admin-mappers";

interface Params {
  params: { id: string };
}

export const PUT = withErrorHandling(
  "members:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, memberInputSchema, 64 * 1024);
    if (body.response) return body.response;

    const existing = await prisma.member.findUnique({
      where: { id },
      select: { active: true, order: true },
    });
    if (!existing) return apiError("Miembro no encontrado", 404);

    const d = body.data;
    const updated = await prisma.member.update({
      where: { id },
      data: {
        ...(await memberData(d)),
        active: d.active ?? existing.active,
        order: d.order ?? existing.order,
      },
    });
    return NextResponse.json({ item: updated });
  },
);

export const DELETE = withErrorHandling(
  "members:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.member.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiError("Miembro no encontrado", 404);

    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
