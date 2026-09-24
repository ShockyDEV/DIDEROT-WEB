import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonClassName } from "@/components/ui/button";
import { NewsTable, type NewsRow } from "@/components/admin/news-table";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const items = await prisma.news.findMany({
    orderBy: [
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      internal: true,
      publishedAt: true,
    },
  });

  const rows: NewsRow[] = items.map((n) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    status: n.status,
    internal: n.internal,
    publishedAt: n.publishedAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Link
          href="/backstage/news/new"
          className={buttonClassName({ variant: "primary" })}
        >
          + Nueva noticia
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Noticias ({rows.length})
          </h3>
        </div>
        <NewsTable rows={rows} />
      </div>
    </div>
  );
}
