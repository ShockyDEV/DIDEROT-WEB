import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { eventInputSchema } from "@/lib/admin-schemas";
import { eventData } from "@/lib/admin-mappers";

interface Params {
  params: { id: string };
}

export const PUT = withErrorHandling(
  "events:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, eventInputSchema, 64 * 1024);
    if (body.response) return body.response;

    const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiError("Evento no encontrado", 404);

    const updated = await prisma.event.update({
      where: { id },
      data: await eventData(body.data),
    });
    return NextResponse.json({ item: updated });
  },
);

export const DELETE = withErrorHandling(
  "events:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiError("Evento no encontrado", 404);

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
