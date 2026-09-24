import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { projectInputSchema } from "@/lib/admin-schemas";
import { projectData } from "@/lib/admin-mappers";

export const GET = withErrorHandling("projects:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.project.findMany({
    orderBy: [{ endYear: { sort: "desc", nulls: "last" } }, { title: "asc" }],
  });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling("projects:create", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, projectInputSchema, 64 * 1024);
  if (body.response) return body.response;
  const d = body.data;

  const created = await prisma.project.create({
    data: {
      ...(await projectData(d)),
      featured: d.featured ?? false,
      active: d.active ?? true,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
});
