import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

interface Params {
  params: { id: string };
}

const statusSchema = z.object({ status: z.enum(["NEW", "REPLIED"]) });

export async function PUT(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }
  const existing = await prisma.contactMessage.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }
  const updated = await prisma.contactMessage.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const existing = await prisma.contactMessage.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }
  await prisma.contactMessage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
