import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { slugify } from "@/lib/slugify";
import { newsInputSchema } from "@/lib/admin-schemas";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { translateNewsFields } from "@/lib/translate";

/** Cuerpo máximo de una noticia (HTML de TipTap con imágenes enlazadas). */
const NEWS_BODY_LIMIT = 1024 * 1024;

/** Garantiza un slug único añadiendo -2, -3… si ya existe. */
async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base).slice(0, 200) || "noticia";
  let candidate = slug;
  for (let i = 2; ; i++) {
    const existing = await prisma.news.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${slug}-${i}`;
  }
}

export const GET = withErrorHandling("news:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.news.findMany({
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      status: true,
      publishedAt: true,
    },
  });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling("news:create", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, newsInputSchema, NEWS_BODY_LIMIT);
  if (body.response) return body.response;

  const data = body.data;
  const content = sanitizeHtml(data.content);
  const slug = await uniqueSlug(data.slug || data.title);

  // Auto-traducción EN (patrón mupes); vacío si no hay DEEPL_API_KEY.
  const translated = await translateNewsFields({
    title: data.title,
    excerpt: data.excerpt,
    content,
  });

  const created = await prisma.news.create({
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
  return NextResponse.json({ item: created }, { status: 201 });
});
