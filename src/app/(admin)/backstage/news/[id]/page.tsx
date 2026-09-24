import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseId } from "@/lib/admin-http";
import { NewsEditor, type NewsFormValues } from "@/components/admin/news-editor";

export const dynamic = "force-dynamic";

export default async function AdminNewsEditPage({
  params,
}: Readonly<{ params: { id: string } }>) {
  const id = parseId(params.id);
  if (!id) notFound();
  const item = await prisma.news.findUnique({ where: { id } });
  if (!item) notFound();

  const initial: NewsFormValues = {
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt ?? "",
    content: item.content,
    coverImage: item.coverImage ?? "",
    category: item.category,
    status: item.status,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString().slice(0, 10) : "",
  };

  return <NewsEditor initial={initial} />;
}
