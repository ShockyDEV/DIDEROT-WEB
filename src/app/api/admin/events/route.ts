import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { eventInputSchema } from "@/lib/admin-schemas";
import { eventData } from "@/lib/admin-mappers";

export const GET = withErrorHandling("events:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling("events:create", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, eventInputSchema, 64 * 1024);
  if (body.response) return body.response;

  const created = await prisma.event.create({ data: await eventData(body.data) });
  return NextResponse.json({ item: created }, { status: 201 });
});
