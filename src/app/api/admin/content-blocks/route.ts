import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { contentBlockInputSchema } from "@/lib/admin-schemas";
import { translateHtml, translationEnabled } from "@/lib/translate";

/** GET /api/admin/content-blocks?page=instituto → bloques de esa página. */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { searchParams } = new URL(request.url);
  const pageSlug = searchParams.get("page");

  const items = await prisma.contentBlock.findMany({
    where: pageSlug ? { pageSlug } : undefined,
    orderBy: [{ pageSlug: "asc" }, { blockKey: "asc" }],
  });
  return NextResponse.json({ items });
}

/** PUT: upsert de un bloque (pageSlug + blockKey → content). */
export async function PUT(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = contentBlockInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }
  const { pageSlug, blockKey, content } = parsed.data;
  const item = await prisma.contentBlock.upsert({
    where: { pageSlug_blockKey: { pageSlug, blockKey } },
    update: { content },
    create: { pageSlug, blockKey, content },
  });

  // Auto-traducción EN → fila paralela "blockKey:en" (patrón del handoff).
  // No se traducen ni los ajustes del sitio (_site) ni las listas JSON
  // ("list:…" — traducirlas corrompería el JSON). Fallo no fatal.
  if (
    pageSlug !== "_site" &&
    !blockKey.endsWith(":en") &&
    !blockKey.startsWith("list:") &&
    translationEnabled()
  ) {
    const contentEn = await translateHtml(content);
    if (contentEn) {
      await prisma.contentBlock.upsert({
        where: {
          pageSlug_blockKey: { pageSlug, blockKey: `${blockKey}:en` },
        },
        update: { content: contentEn },
        create: { pageSlug, blockKey: `${blockKey}:en`, content: contentEn },
      });
    }
  }

  return NextResponse.json({ item });
}
