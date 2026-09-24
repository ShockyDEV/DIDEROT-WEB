import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { slugify } from "@/lib/slugify";
import { newsInputSchema } from "@/lib/admin-schemas";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { translateNewsFields } from "@/lib/translate";

interface Params {
  params: { id: string };
}

const NEWS_BODY_LIMIT = 1024 * 1024;

export const GET = withErrorHandling(
  "news:get",
  async (_request: Request, { params }: Params) => {
    const guard = await requireAdmin();
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) return apiError("Noticia no encontrada", 404);
    return NextResponse.json({ item });
  },
);

export const PUT = withErrorHandling(
  "news:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, newsInputSchema, NEWS_BODY_LIMIT);
    if (body.response) return body.response;

    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return apiError("Noticia no encontrada", 404);

    const data = body.data;
    const content = sanitizeHtml(data.content);

    // Slug único (permite conservar el propio).
    let slug = slugify(data.slug || data.title).slice(0, 200) || "noticia";
    if (slug !== existing.slug) {
      const base = slug;
      for (let i = 2; ; i++) {
        const clash = await prisma.news.findUnique({ where: { slug }, select: { id: true } });
        if (!clash || clash.id === id) break;
        slug = `${base}-${i}`;
      }
    }

    // Retraduce solo si cambió el contenido en español (ahorra cuota DeepL).
    const needsTranslation =
      data.title !== existing.title ||
      (data.excerpt ?? null) !== existing.excerpt ||
      content !== existing.content ||
      !existing.contentEn;
    const translated = needsTranslation
      ? await translateNewsFields({ title: data.title, excerpt: data.excerpt, content })
      : {};

    const updated = await prisma.news.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt ?? null,
        content,
        coverImage: data.coverImage ?? null,
        category: data.category,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        ...translated,
      },
    });
    return NextResponse.json({ item: updated });
  },
);

export const DELETE = withErrorHandling(
  "news:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.news.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiError("Noticia no encontrada", 404);

    await prisma.news.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
