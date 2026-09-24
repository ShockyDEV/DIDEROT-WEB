import type { Session } from "next-auth";
import type { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, configuredOrigins, isSameOriginRequest } from "@/lib/admin-http";

/**
 * Guard de las API del panel. El middleware ya bloquea /api/admin/** sin
 * sesión, pero las routes vuelven a comprobarlo todo (defensa en
 * profundidad):
 *
 * 1. Origen: las peticiones que cambian datos (POST/PUT/PATCH/DELETE) deben
 *    venir de una página del propio sitio (protección CSRF). Se activa
 *    pasando `request`.
 * 2. Sesión válida y cuenta VIVA: el JWT dura 24 h, así que se comprueba en
 *    la BD que la cuenta sigue existiendo y con qué rol. Una cuenta borrada
 *    o degradada pierde el acceso al instante, no al caducar la sesión.
 * 3. Rol: ADMIN o SUPER_ADMIN; `superOnly` exige SUPER_ADMIN (cuentas).
 *
 * Uso:
 *   const guard = await requireAdmin({ request });        // mutaciones
 *   const guard = await requireAdmin();                   // lecturas
 *   if (guard.response) return guard.response;
 *   guard.user // { id, email, name, role } recién leído de la BD
 */

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

type GuardResult =
  | { session: Session; user: AdminUser; response: null }
  | { session: Session | null; user: null; response: NextResponse };

const ADMIN_ROLES = new Set<string>(["ADMIN", "SUPER_ADMIN"]);

/** Cuenta de administración de la sesión actual (leída de la BD) o null. */
export async function getCurrentAdmin(
  session?: Session | null,
): Promise<AdminUser | null> {
  const current = session === undefined ? await auth() : session;
  const id = current?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user || !ADMIN_ROLES.has(user.role)) return null;
  return user as AdminUser;
}

export async function requireAdmin(options?: {
  superOnly?: boolean;
  /** Pásala en las mutaciones para comprobar el origen. */
  request?: Request;
}): Promise<GuardResult> {
  const request = options?.request;
  if (
    request &&
    !isSameOriginRequest(request.method, request.headers, configuredOrigins())
  ) {
    return {
      session: null,
      user: null,
      response: apiError("Petición rechazada: origen no permitido", 403),
    };
  }

  const session = await auth();
  if (!session?.user) {
    return { session: null, user: null, response: apiError("No autorizado", 401) };
  }

  const user = await getCurrentAdmin(session);
  if (!user) {
    return {
      session,
      user: null,
      response: apiError("Tu sesión ya no es válida: vuelve a iniciar sesión", 401),
    };
  }

  if (options?.superOnly && user.role !== "SUPER_ADMIN") {
    return {
      session,
      user: null,
      response: apiError("Requiere rol de Super Administración", 403),
    };
  }

  return { session, user, response: null };
}
