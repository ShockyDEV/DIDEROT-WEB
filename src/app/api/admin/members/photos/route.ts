import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { withErrorHandling } from "@/lib/admin-http";
import { mimeForUpload, UPLOADS_DIR } from "@/lib/uploads";

/**
 * GET /api/admin/members/photos
 *
 * Fotos del equipo ya subidas (uploads/members), para reutilizar una desde
 * la ficha sin volver a subirla (p. ej. al rehacer la ficha de alguien o al
 * elegir entre las fotos migradas). Igual que en el IUCE, pero leyendo la
 * carpeta de subidas fuera de public/. Solo imágenes de la lista cerrada;
 * las más recientes primero.
 */
export const GET = withErrorHandling("members:photos", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const dir = path.join(UPLOADS_DIR, "members");
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return NextResponse.json({ images: [] }); // la carpeta aún no existe
  }

  const images: Array<{ url: string; name: string; mtime: number }> = [];
  for (const name of names) {
    if (!/^[\w.-]+$/.test(name)) continue; // nombres generados por el servidor
    if (!mimeForUpload(name)?.startsWith("image/")) continue;
    try {
      const info = await stat(path.join(dir, name));
      if (!info.isFile()) continue;
      images.push({ url: `/uploads/members/${name}`, name, mtime: info.mtimeMs });
    } catch {
      // borrado entretanto: se ignora
    }
  }
  images.sort((a, b) => b.mtime - a.mtime);

  return NextResponse.json({
    images: images.slice(0, 500).map(({ url, name }) => ({ url, name })),
  });
});
