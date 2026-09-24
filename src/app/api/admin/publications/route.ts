import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import {
  publicationInputSchema,
  publicationListQuerySchema,
} from "@/lib/admin-schemas";
import { publicationData } from "@/lib/admin-mappers";
import { listPublications } from "@/lib/publications-admin";

/**
 * GET /api/admin/publications?q=&type=&year=&visible=&source=&page=
 * Listado paginado (50 por página) con los mismos filtros que el panel.
 */
export const GET = withErrorHandling("publications:list", async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = publicationListQuerySchema.parse(params); // valores raros → por defecto
  return NextResponse.json(await listPublications(query));
});

/** POST: alta manual de una publicación. */
export const POST = withErrorHandling("publications:create", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, publicationInputSchema, 64 * 1024);
  if (body.response) return body.response;
  const data = publicationData(body.data);

  // DOI único: mensaje legible en vez del error de la BD.
  if (data.doi) {
    const clash = await prisma.publication.findUnique({
      where: { doi: data.doi },
      select: { title: true },
    });
    if (clash) {
      return apiError(
        `Ya existe una publicación con ese DOI: «${clash.title.slice(0, 120)}»`,
        409,
      );
    }
  }

  const created = await prisma.publication.create({
    data: { ...data, source: "manual" },
  });
  return NextResponse.json({ item: created }, { status: 201 });
});
