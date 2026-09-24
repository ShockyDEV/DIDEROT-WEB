import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Guard de las API del panel. El middleware ya bloquea /api/admin/** sin
 * sesión, pero las routes vuelven a comprobarla (defensa en profundidad) y
 * aquí se aplican además las restricciones por rol.
 *
 * Uso:
 *   const guard = await requireAdmin();
 *   if (guard.response) return guard.response;
 *   // guard.session está garantizada
 */
export async function requireAdmin(options?: { superOnly?: boolean }) {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  if (options?.superOnly && session.user.role !== "SUPER_ADMIN") {
    return {
      session,
      response: NextResponse.json(
        { error: "Requiere rol de Super Administración" },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}
