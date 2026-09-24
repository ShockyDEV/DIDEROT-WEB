import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { memberInputSchema } from "@/lib/admin-schemas";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.member.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { group: { select: { acronym: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
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
  const d = parsed.data;
  const created = await prisma.member.create({
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
      active: d.active ?? true,
      order: d.order ?? 0,
      groupId: d.groupId || null,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
