import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { projectInputSchema } from "@/lib/admin-schemas";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.project.findMany({
    orderBy: [{ endYear: { sort: "desc", nulls: "last" } }, { title: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
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
  const d = parsed.data;
  const created = await prisma.project.create({
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
      active: d.active ?? true,
      iuceLed: d.iuceLed ?? false,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
