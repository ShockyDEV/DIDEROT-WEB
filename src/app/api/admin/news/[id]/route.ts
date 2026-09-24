import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/slugify";
import { newsInputSchema } from "@/lib/admin-schemas";
import { translateNewsFields } from "@/lib/translate";

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const item = await prisma.news.findUnique({ where: { id: params.id } });
  if (!item) {
    return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function PUT(request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = newsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }

  const existing = await prisma.news.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
  }

  const data = parsed.data;
  // Slug único (permite conservar el propio)
  let slug = slugify(data.slug || data.title) || "noticia";
  if (slug !== existing.slug) {
    const base = slug;
    for (let i = 2; ; i++) {
      const clash = await prisma.news.findUnique({ where: { slug } });
      if (!clash || clash.id === params.id) break;
      slug = `${base}-${i}`;
    }
  }

  // Retraduce solo si cambió el contenido en español (ahorra cuota DeepL).
  const needsTranslation =
    data.title !== existing.title ||
    (data.excerpt ?? null) !== existing.excerpt ||
    data.content !== existing.content ||
    !existing.contentEn;
  const translated = needsTranslation
    ? await translateNewsFields({
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
      })
    : {};

  const updated = await prisma.news.update({
    where: { id: params.id },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      coverImage: data.coverImage ?? null,
      category: data.category,
      status: data.status,
      internal: data.internal,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      ...translated,
    },
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const existing = await prisma.news.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
  }

  await prisma.news.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
