import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { memberInputSchema } from "@/lib/admin-schemas";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = memberInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }
  const existing = await prisma.member.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }
  const d = parsed.data;
  const updated = await prisma.member.update({
    where: { id: params.id },
    data: {
      name: d.name,
      area: d.area || null,
      email: d.email || null,
      extension: d.extension || null,
      role: d.role || null,
      photo: d.photo || null,
      portalUrl: d.portalUrl || null,
      orcid: d.orcid || null,
      scopus: d.scopus || null,
      active: d.active ?? existing.active,
      order: d.order ?? existing.order,
      groupId: d.groupId || null,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const existing = await prisma.member.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }
  await prisma.member.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
