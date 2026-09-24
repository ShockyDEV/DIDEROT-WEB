import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { messageStatusSchema } from "@/lib/admin-schemas";

interface Params {
  params: { id: string };
}

/** PUT { status: "NEW" | "REPLIED" } */
export const PUT = withErrorHandling(
  "messages:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, messageStatusSchema, 1024);
    if (body.response) return body.response;

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return apiError("Mensaje no encontrado", 404);

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status: body.data.status },
    });
    return NextResponse.json({ item: updated });
  },
);

export const DELETE = withErrorHandling(
  "messages:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return apiError("Mensaje no encontrado", 404);

    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
