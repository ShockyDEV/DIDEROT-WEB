import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { pageVisibilitySchema } from "@/lib/admin-schemas";
import { PUBLIC_PAGES, PUBLIC_SECTIONS } from "@/lib/content/public-pages";

/** GET: estado de visibilidad de las páginas y secciones del registro. */
export const GET = withErrorHandling("page-visibility:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const rows = await prisma.pageVisibility.findMany();
  const state = new Map(rows.map((r) => [r.slug, r.hidden]));
  return NextResponse.json({
    pages: PUBLIC_PAGES.map((p) => ({ ...p, hidden: state.get(p.slug) ?? false })),
    // Las secciones pueden nacer ocultas: sin fila manda su defaultHidden.
    sections: PUBLIC_SECTIONS.map((s) => ({
      ...s,
      hidden: state.get(s.slug) ?? s.defaultHidden,
    })),
  });
});

/** PUT: oculta o vuelve a mostrar una página o sección pública. */
export const PUT = withErrorHandling("page-visibility:save", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, pageVisibilitySchema, 4 * 1024);
  if (body.response) return body.response;
  const { slug, hidden } = body.data;

  // Solo páginas o secciones del registro: nada de ocultar claves arbitrarias.
  if (
    !PUBLIC_PAGES.some((p) => p.slug === slug) &&
    !PUBLIC_SECTIONS.some((s) => s.slug === slug)
  ) {
    return apiError("Página desconocida", 404);
  }

  await prisma.pageVisibility.upsert({
    where: { slug },
    update: { hidden },
    create: { slug, hidden },
  });
  return NextResponse.json({ slug, hidden });
});
