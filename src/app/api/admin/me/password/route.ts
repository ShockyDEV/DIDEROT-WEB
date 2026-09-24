import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { passwordChangeSchema } from "@/lib/admin-schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const BCRYPT_COST = 12;

/**
 * POST /api/admin/me/password — «Cambiar mi contraseña».
 * { currentPassword, newPassword, confirmPassword }
 *
 * Exige la contraseña actual (una sesión abierta en un equipo ajeno no basta
 * para cambiarla) y está limitado a 5 intentos cada 15 minutos por cuenta,
 * para que no sirva para adivinar la contraseña actual por fuerza bruta.
 */
export const POST = withErrorHandling("me:password", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  if (
    !rateLimit(`password:user:${guard.user.id}`, 5, 15 * 60_000) ||
    !rateLimit(`password:ip:${clientIp(request)}`, 10, 15 * 60_000)
  ) {
    return apiError("Demasiados intentos; espera unos minutos y vuelve a probar", 429);
  }

  const body = await readJsonBody(request, passwordChangeSchema, 4 * 1024);
  if (body.response) return body.response;
  const { currentPassword, newPassword } = body.data;

  const user = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: { email: true, passwordHash: true },
  });
  if (!user) return apiError("Cuenta no encontrada", 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return apiError("La contraseña actual no es correcta", 400);

  if (newPassword.toLowerCase() === user.email.toLowerCase()) {
    return apiError("La contraseña no puede ser tu propio correo", 400);
  }

  // Nueva versión de sesión: se cierran TODAS las sesiones abiertas de la
  // cuenta (también esta; el panel pide volver a entrar con la nueva).
  await prisma.user.update({
    where: { id: guard.user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST),
      sessionVersion: { increment: 1 },
    },
  });
  return NextResponse.json({ ok: true, reauth: true });
});
