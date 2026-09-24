import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/slugify";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB (como indica el prototipo)

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.fileAsset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

/** Subida multipart → public/uploads + registro en FileAsset. */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "El archivo supera los 20 MB" },
      { status: 413 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Tipo de archivo no permitido (${file.type || "desconocido"})` },
      { status: 415 },
    );
  }

  // Nombre seguro y único: slug del nombre + sufijo temporal.
  const ext = path.extname(file.name).toLowerCase();
  const base = slugify(path.basename(file.name, ext)) || "archivo";
  const filename = `${base}-${Date.now().toString(36)}${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  const created = await prisma.fileAsset.create({
    data: {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/${filename}`,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
