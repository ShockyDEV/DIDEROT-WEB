import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { memberInputSchema } from "@/lib/admin-schemas";
import { memberData } from "@/lib/admin-mappers";

export const GET = withErrorHandling("members:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.member.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ items });
});

export const POST = withErrorHandling("members:create", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, memberInputSchema, 64 * 1024);
  if (body.response) return body.response;
  const d = body.data;

  const created = await prisma.member.create({
    data: {
      ...(await memberData(d)),
      active: d.active ?? true,
      order: d.order ?? 0,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
});
