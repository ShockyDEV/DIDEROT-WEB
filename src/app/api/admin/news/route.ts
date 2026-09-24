import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/slugify";
import { newsInputSchema } from "@/lib/admin-schemas";
import { translateNewsFields } from "@/lib/translate";

/** Garantiza un slug único añadiendo -2, -3… si ya existe. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base) || "noticia";
  let candidate = slug;
  for (let i = 2; ; i++) {
    const existing = await prisma.news.findUnique({
      where: { slug: candidate },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${i}`;
  }
}

export async function GET() {
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
      internal: true,
      publishedAt: true,
    },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
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

  const data = parsed.data;
  const slug = await uniqueSlug(data.slug || data.title);

  // Auto-traducción EN (patrón mupes); vacío si no hay DEEPL_API_KEY.
  const translated = await translateNewsFields({
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
  });

  const created = await prisma.news.create({
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
  return NextResponse.json({ item: created }, { status: 201 });
}
