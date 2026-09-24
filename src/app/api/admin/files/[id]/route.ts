import { unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, withErrorHandling } from "@/lib/admin-http";
import { uploadPathFromUrl } from "@/lib/uploads";

interface Params {
  params: { id: string };
}

function quote(text: string) {
  return `«${text.length > 60 ? `${text.slice(0, 59)}…` : text}»`;
}

/**
 * Dónde se usa un archivo (portadas y cuerpo de noticias, carteles,
 * imágenes de proyectos, fotos del equipo, enlaces de publicaciones y
 * bloques de páginas). Borrarlo dejaría esas páginas con la imagen rota.
 */
async function findUsages(url: string): Promise<string[]> {
  const take = 5;
  const [news, events, projects, members, publications, blocks] = await Promise.all([
    prisma.news.findMany({
      where: {
        OR: [
          { coverImage: url },
          { content: { contains: url } },
          { contentEn: { contains: url } },
        ],
      },
      select: { title: true },
      take,
    }),
    prisma.event.findMany({
      where: { OR: [{ image: url }, { url }] },
      select: { title: true },
      take,
    }),
    prisma.project.findMany({
      where: { OR: [{ image: url }, { url }] },
      select: { title: true },
      take,
    }),
    prisma.member.findMany({ where: { photo: url }, select: { name: true }, take }),
    prisma.publication.findMany({ where: { url }, select: { title: true }, take }),
    prisma.contentBlock.findMany({
      where: { content: { contains: url } },
      select: { pageSlug: true, blockKey: true },
      take,
    }),
  ]);
  return [
    ...news.map((n) => `Noticia ${quote(n.title)}`),
    ...events.map((e) => `Evento ${quote(e.title)}`),
    ...projects.map((p) => `Proyecto ${quote(p.title)}`),
    ...members.map((m) => `Equipo: ${m.name}`),
    ...publications.map((p) => `Publicación ${quote(p.title)}`),
    ...blocks.map((b) =>
      b.pageSlug === "_site" ? "Datos del sitio" : `Página «${b.pageSlug}» (${b.blockKey})`,
    ),
  ];
}

/**
 * DELETE /api/admin/files/{id}[?force=1]
 *
 * Si el archivo se está usando responde 409 con la lista de usos (el panel
 * pide confirmación y repite con ?force=1). Solo se borra del disco lo que
 * está dentro de la carpeta de subidas (uploadPathFromUrl lo garantiza);
 * cualquier otra URL registrada solo pierde su fila.
 */
export const DELETE = withErrorHandling(
  "files:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const existing = await prisma.fileAsset.findUnique({ where: { id } });
    if (!existing) return apiError("Archivo no encontrado", 404);

    const force = new URL(request.url).searchParams.get("force") === "1";
    if (!force) {
      const usages = await findUsages(existing.url);
      if (usages.length > 0) {
        return NextResponse.json(
          {
            error: `El archivo se está usando en: ${usages.join("; ")}`,
            usages,
          },
          { status: 409 },
        );
      }
    }

    const diskPath = uploadPathFromUrl(existing.url);
    if (diskPath) {
      await unlink(diskPath).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== "ENOENT") throw err; // ya no existía: seguimos
      });
    }
    await prisma.fileAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
