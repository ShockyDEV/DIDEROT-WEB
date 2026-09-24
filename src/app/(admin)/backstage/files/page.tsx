import { prisma } from "@/lib/prisma";
import { FilesSection, type FileRow } from "@/components/admin/files-section";

export const dynamic = "force-dynamic";

export default async function AdminFilesPage() {
  const files = await prisma.fileAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: FileRow[] = files.map((f) => ({
    id: f.id,
    filename: f.filename,
    mimeType: f.mimeType,
    size: f.size,
    url: f.url,
    createdAt: f.createdAt.toISOString(),
  }));

  return <FilesSection rows={rows} />;
}
