import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { eventInputSchema } from "@/lib/admin-schemas";

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }
  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  const d = parsed.data;
  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      title: d.title,
      type: d.type,
      startsAt: new Date(d.startsAt),
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      location: d.location || null,
      url: d.url || null,
      image: d.image || null,
      newsSlug: d.newsSlug || null,
      status: d.status,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const existing = await prisma.event.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
