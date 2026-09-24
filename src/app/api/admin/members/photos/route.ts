import { NextResponse } from "next/server";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-guard";

const IMG = /\.(jpe?g|png|webp|gif|avif)$/i;

/**
 * Lista las fotos de miembros ya subidas (migradas + subidas desde el panel),
 * para poder reutilizar una desde la ficha sin volver a subirla. Devuelve las
 * más recientes primero.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const dirs = [
    "uploads/members",
    "uploads/legacy/members",
  ];
  const images: Array<{ url: string; name: string; mtime: number }> = [];
  for (const rel of dirs) {
    const abs = path.join(process.cwd(), "public", ...rel.split("/"));
    let names: string[] = [];
    try {
      names = await readdir(abs);
    } catch {
      continue; // la carpeta puede no existir aún
    }
    for (const name of names) {
      if (!IMG.test(name)) continue;
      let mtime = 0;
      try {
        mtime = (await stat(path.join(abs, name))).mtimeMs;
      } catch {
        // ignorar
      }
      images.push({ url: `/${rel}/${name}`, name, mtime });
    }
  }
  images.sort((a, b) => b.mtime - a.mtime);

  return NextResponse.json({
    images: images.map(({ url, name }) => ({ url, name })),
  });
}
