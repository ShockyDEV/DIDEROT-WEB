import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { PUBLIC_PAGES, PUBLIC_SECTIONS } from "@/lib/content/public-pages";

const inputSchema = z.object({
  slug: z.string().trim().min(1),
  hidden: z.boolean(),
});

/** GET: estado de visibilidad de las páginas del registro. */
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const rows = await prisma.pageVisibility.findMany();
  const state = new Map(rows.map((r) => [r.slug, r.hidden]));
  return NextResponse.json({
    pages: PUBLIC_PAGES.map((p) => ({
      ...p,
      hidden: state.get(p.slug) ?? false,
    })),
    // Las secciones pueden nacer ocultas: sin fila manda su defaultHidden.
    sections: PUBLIC_SECTIONS.map((s) => ({
      ...s,
      hidden: state.get(s.slug) ?? s.defaultHidden,
    })),
  });
}

/** PUT: oculta o vuelve a mostrar una página pública. */
export async function PUT(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
  }
  const { slug, hidden } = parsed.data;

  // Solo páginas o secciones del registro: nada de ocultar claves arbitrarias.
  if (
    !PUBLIC_PAGES.some((p) => p.slug === slug) &&
    !PUBLIC_SECTIONS.some((s) => s.slug === slug)
  ) {
    return NextResponse.json({ error: "Página desconocida" }, { status: 404 });
  }

  await prisma.pageVisibility.upsert({
    where: { slug },
    update: { hidden },
    create: { slug, hidden },
  });

  return NextResponse.json({ slug, hidden });
}
