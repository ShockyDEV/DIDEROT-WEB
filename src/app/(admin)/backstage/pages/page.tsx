import { prisma } from "@/lib/prisma";
import { PagesEditor } from "@/components/admin/pages-editor";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  let saved: Record<string, string> = {};
  try {
    const blocks = await prisma.contentBlock.findMany();
    saved = Object.fromEntries(
      blocks.map((b) => [`${b.pageSlug}:${b.blockKey}`, b.content]),
    );
  } catch {
    // BD no disponible: los editores parten del contenido por defecto.
  }

  return <PagesEditor saved={saved} />;
}
