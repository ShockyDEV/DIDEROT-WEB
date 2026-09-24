import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

interface Params {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const existing = await prisma.fileAsset.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  // Borra el fichero físico (si sigue existiendo) y el registro.
  if (existing.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", existing.url);
    await unlink(filePath).catch(() => {
      /* ya no existe: seguimos */
    });
  }
  await prisma.fileAsset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
