import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, withErrorHandling } from "@/lib/admin-http";
import { UPLOAD_FOLDERS, type UploadFolder } from "@/lib/admin-options";
import { rateLimit } from "@/lib/rate-limit";
import {
  MAX_UPLOAD_BYTES,
  saveUpload,
  uploadPathFromUrl,
  UploadError,
  type UploadKind,
} from "@/lib/uploads";

const KINDS: readonly UploadKind[] = ["image", "document", "audio", "video"];

export const GET = withErrorHandling("files:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.fileAsset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
});

/**
 * POST (multipart) → /uploads + registro en Archivos (FileAsset).
 *
 * Campos: file (obligatorio); only = image|document|audio|video (restringe
 * el tipo, p. ej. la portada de una noticia o el cartel de un evento) y
 * folder = news|events|projects|pages (subcarpeta). Toda la validación del
 * archivo (lista cerrada, MIME, firma, recodificación de imágenes) la hace
 * saveUpload.
 */
export const POST = withErrorHandling("files:upload", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  if (!rateLimit(`upload:${guard.user.id}`, 60, 10 * 60_000)) {
    return apiError("Demasiadas subidas seguidas; espera unos minutos", 429);
  }

  // Se corta ANTES de leer el cuerpo: nada de cargar en memoria subidas
  // enormes para rechazarlas después.
  const declared = Number(request.headers.get("content-length") ?? "");
  if (!Number.isFinite(declared) || declared <= 0) {
    return apiError("Falta el archivo", 411);
  }
  if (declared > MAX_UPLOAD_BYTES + 256 * 1024) {
    return apiError("El archivo supera los 25 MB", 413);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return apiError("Falta el archivo", 400);
  }

  const onlyRaw = form?.get("only");
  const only = KINDS.find((k) => k === onlyRaw);
  if (onlyRaw && !only) return apiError("Tipo de subida no válido", 400);

  const folderRaw = form?.get("folder");
  const folder = UPLOAD_FOLDERS.find((f) => f === folderRaw) as UploadFolder | undefined;
  if (folderRaw && !folder) return apiError("Carpeta no válida", 400);

  let saved;
  try {
    saved = await saveUpload(file, { subdir: folder, only: only ? [only] : undefined });
  } catch (err) {
    if (err instanceof UploadError) return apiError(err.message, err.status);
    throw err;
  }

  // Nombre visible en el panel: el original, sin caracteres de control.
  const filename =
    saved.originalName.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200) || "archivo";

  try {
    const created = await prisma.fileAsset.create({
      data: {
        filename,
        // Tamaño y tipo FINALES (las imágenes se recodifican al guardarlas).
        mimeType: saved.mimeType,
        size: saved.size,
        url: saved.url,
      },
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    // Sin registro no se podría borrar desde el panel: fuera también del disco.
    const diskPath = uploadPathFromUrl(saved.url);
    if (diskPath) await unlink(diskPath).catch(() => undefined);
    throw err;
  }
});
