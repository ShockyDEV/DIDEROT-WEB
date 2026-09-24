import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { accountInputSchema } from "@/lib/admin-schemas";
import { rateLimit } from "@/lib/rate-limit";

/** Coste de bcrypt de las contraseñas nuevas (≈0,25 s por hash). */
const BCRYPT_COST = 12;

export const GET = withErrorHandling("accounts:list", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const items = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json({ items });
});

/** Alta de cuenta de administración: solo SUPER_ADMIN. */
export const POST = withErrorHandling("accounts:create", async (request: Request) => {
  const guard = await requireAdmin({ request, superOnly: true });
  if (guard.response) return guard.response;

  if (!rateLimit(`accounts:${guard.user.id}`, 20, 10 * 60_000)) {
    return apiError("Demasiadas operaciones seguidas; espera unos minutos", 429);
  }

  const body = await readJsonBody(request, accountInputSchema, 8 * 1024);
  if (body.response) return body.response;
  const { email, name, password, role } = body.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return apiError("Ya existe una cuenta con ese correo", 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const created = await prisma.user.create({
    data: { email, name, passwordHash, role },
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json({ item: created }, { status: 201 });
});
