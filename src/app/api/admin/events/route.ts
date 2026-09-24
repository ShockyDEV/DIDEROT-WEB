import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { eventInputSchema } from "@/lib/admin-schemas";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.event.findMany({
    orderBy: { startsAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
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
  const d = parsed.data;
  const created = await prisma.event.create({
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
  return NextResponse.json({ item: created }, { status: 201 });
}
