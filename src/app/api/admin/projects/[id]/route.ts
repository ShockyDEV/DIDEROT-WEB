import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { projectInputSchema } from "@/lib/admin-schemas";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }
  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }
  const d = parsed.data;
  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      title: d.title,
      funder: d.funder || null,
      ip: d.ip || null,
      line: d.line || null,
      scope: d.scope || null,
      amount: d.amount || null,
      period: d.period || null,
      startYear: d.startYear ?? null,
      endYear: d.endYear ?? null,
      active: d.active ?? existing.active,
      iuceLed: d.iuceLed ?? existing.iuceLed,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
  }
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
