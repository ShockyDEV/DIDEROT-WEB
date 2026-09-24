import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, parseId, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { accountUpdateSchema } from "@/lib/admin-schemas";
import { rateLimit } from "@/lib/rate-limit";

interface Params {
  params: { id: string };
}

const BCRYPT_COST = 12;

const LAST_SUPER_ADMIN =
  "Tiene que quedar al menos una cuenta con rol de Super Administración";

/**
 * PATCH (solo SUPER_ADMIN): cambiar el rol, el nombre o fijar una
 * contraseña nueva a otra cuenta (p. ej. si la ha olvidado). Nunca puede
 * quedar el sistema sin ninguna cuenta SUPER_ADMIN.
 */
export const PATCH = withErrorHandling(
  "accounts:update",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request, superOnly: true });
    if (guard.response) return guard.response;

    if (!rateLimit(`accounts:${guard.user.id}`, 20, 10 * 60_000)) {
      return apiError("Demasiadas operaciones seguidas; espera unos minutos", 429);
    }

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    const body = await readJsonBody(request, accountUpdateSchema, 8 * 1024);
    if (body.response) return body.response;
    const { role, password, name } = body.data;

    // La propia contraseña solo se cambia sabiendo la actual (Cambiar mi
    // contraseña): una sesión robada no debe poder fijar otra.
    if (password && id === guard.user.id) {
      return apiError("Para cambiar tu propia contraseña usa «Cambiar mi contraseña»", 409);
    }

    const passwordHash = password ? await bcrypt.hash(password, BCRYPT_COST) : undefined;

    // En transacción: la comprobación de «último SUPER_ADMIN» y el cambio
    // van juntos (dos degradaciones simultáneas no pueden dejarlo a cero).
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
      if (!target) return { error: apiError("Cuenta no encontrada", 404) };

      if (target.role === "SUPER_ADMIN" && role === "ADMIN") {
        const supers = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
        if (supers <= 1) return { error: apiError(LAST_SUPER_ADMIN, 409) };
      }

      const updated = await tx.user.update({
        where: { id },
        data: {
          ...(role ? { role } : {}),
          ...(name ? { name } : {}),
          // Contraseña restablecida: fuera las sesiones abiertas de esa cuenta.
          ...(passwordHash ? { passwordHash, sessionVersion: { increment: 1 } } : {}),
        },
        select: { id: true, email: true, name: true, role: true },
      });
      return { updated };
    });

    if ("error" in result && result.error) return result.error;
    return NextResponse.json({ item: result.updated });
  },
);

/** DELETE (solo SUPER_ADMIN): no a uno mismo ni al último SUPER_ADMIN. */
export const DELETE = withErrorHandling(
  "accounts:delete",
  async (request: Request, { params }: Params) => {
    const guard = await requireAdmin({ request, superOnly: true });
    if (guard.response) return guard.response;

    const id = parseId(params.id);
    if (!id) return apiError("Identificador no válido", 400);

    if (id === guard.user.id) {
      return apiError("No puedes eliminar tu propia cuenta", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
      if (!target) return apiError("Cuenta no encontrada", 404);
      if (target.role === "SUPER_ADMIN") {
        const supers = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
        if (supers <= 1) return apiError(LAST_SUPER_ADMIN, 409);
      }
      await tx.user.delete({ where: { id } });
      return null;
    });

    if (result) return result;
    return NextResponse.json({ ok: true });
  },
);
