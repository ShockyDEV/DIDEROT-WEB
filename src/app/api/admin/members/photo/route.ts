import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, withErrorHandling } from "@/lib/admin-http";
import { rateLimit } from "@/lib/rate-limit";
import { ALLOWED_UPLOADS, saveUpload, UploadError } from "@/lib/uploads";

/** Una foto de ficha no necesita más (el recorte final es de 512×512). */
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/**
 * POST /api/admin/members/photo (multipart: file)
 *
 * Foto de un miembro del equipo: se comprueba que es una imagen real
 * (extensión + MIME + firma), se recorta a 512×512 (como el resto de fotos
 * del equipo) y el resultado se guarda con saveUpload en uploads/members.
 * Devuelve la URL para el campo «foto»; guardar la ficha es un paso aparte.
 */
export const POST = withErrorHandling("members:photo", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  if (!rateLimit(`upload:${guard.user.id}`, 60, 10 * 60_000)) {
    return apiError("Demasiadas subidas seguidas; espera unos minutos", 429);
  }

  const declared = Number(request.headers.get("content-length") ?? "");
  if (!Number.isFinite(declared) || declared <= 0) {
    return apiError("Falta la imagen", 411);
  }
  if (declared > MAX_PHOTO_BYTES + 64 * 1024) {
    return apiError("La imagen supera los 15 MB", 413);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return apiError("Falta la imagen", 400);
  }

  // Misma lista cerrada que el resto de subidas, solo imágenes.
  const ext = path.extname(file.name).toLowerCase();
  const allowed = ALLOWED_UPLOADS[ext];
  if (!allowed || allowed.kind !== "image") {
    return apiError("Formato no permitido (usa JPG, PNG, WebP o GIF)", 415);
  }
  if (file.type && file.type !== allowed.mime) {
    return apiError("El tipo del archivo no coincide con su extensión", 415);
  }
  const input = Buffer.from(await file.arrayBuffer());
  if (!allowed.sniff(input)) {
    return apiError("El contenido del archivo no es una imagen válida", 415);
  }

  let cropped: Buffer;
  try {
    cropped = await sharp(input, { failOn: "error", limitInputPixels: 50_000_000 })
      .rotate() // respeta la orientación EXIF de las fotos de móvil
      .resize({ width: 512, height: 512, fit: "cover" })
      .webp({ quality: 88 })
      .toBuffer();
  } catch {
    return apiError("La imagen está dañada o no se puede procesar", 415);
  }

  try {
    const base = path.basename(file.name, path.extname(file.name)) || "miembro";
    const saved = await saveUpload(
      new File([new Uint8Array(cropped)], `${base}.webp`, { type: "image/webp" }),
      { subdir: "members", only: ["image"] },
    );
    return NextResponse.json({ photo: saved.url }, { status: 201 });
  } catch (err) {
    if (err instanceof UploadError) return apiError(err.message, err.status);
    throw err;
  }
});
