import { NextResponse } from "next/server";
import { mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-guard";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Subida de la foto de un miembro desde el panel: recorta a 512×512 (como el
 * resto de fotos de miembros) y devuelve la URL para el campo «foto» de la
 * ficha. Guardar el miembro es un paso aparte (PUT/POST del formulario).
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "La imagen supera los 8 MB" },
      { status: 413 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido (usa JPG, PNG o WebP)" },
      { status: 415 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", "members");
  await mkdir(dir, { recursive: true });
  const filename = `miembro-${randomBytes(6).toString("hex")}.webp`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await sharp(buffer)
    .rotate() // respeta la orientación EXIF de las fotos de móvil
    .resize({ width: 512, height: 512, fit: "cover" })
    .webp({ quality: 88 })
    .toFile(path.join(dir, filename));

  return NextResponse.json(
    { photo: `/uploads/members/${filename}` },
    { status: 201 },
  );
}
