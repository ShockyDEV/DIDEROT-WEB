import NextAuth from "next-auth";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { authConfig } from "@/auth.config";

/**
 * Middleware de la web:
 *
 * 1. Versión en inglés: /en/* se reescribe INTERNAMENTE a la ruta española
 *    con la cabecera x-locale=en (getLocale() la lee en los server
 *    components). El panel y las API no tienen versión EN.
 * 2. Protección por roles de /backstage/** y /api/admin/** (solo ADMIN o
 *    SUPER_ADMIN). Usa la configuración edge-safe de NextAuth (sin Prisma):
 *    la verificación es del JWT de sesión.
 * 3. En el resto de rutas el idioma lo decide SOLO la URL: se descarta
 *    cualquier x-locale que envíe el cliente (si no, bastaría esa cabecera
 *    para servir inglés en una URL española y envenenar cachés).
 *
 * OJO: la reescritura de idioma va FUERA del envoltorio de NextAuth. Este
 * sustituye el origen de la petición por el de NEXTAUTH_URL, y una
 * reescritura a otro origen se convierte en un proxy externo: en desarrollo
 * con otro puerto daba 500 en todas las rutas /en y en producción (detrás
 * del proxy, http interno frente a https público) el servidor se habría
 * pedido las páginas a sí mismo a través de Internet.
 */
const { auth } = NextAuth(authConfig);

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

const adminGuard = auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role as string | undefined;
  const isApi = pathname.startsWith("/api/");

  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Aquí sí interesa el origen público (NEXTAUTH_URL): es una redirección
    // que ve el navegador.
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
  if (!role || !ADMIN_ROLES.has(role)) {
    if (isApi) {
      return NextResponse.json(
        { error: "Requiere cuenta de administración" },
        { status: 403 },
      );
    }
    // Sesión sin rol de administración: de vuelta al login del panel.
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname === "/en" ? "/" : pathname.slice(3);
    const url = request.nextUrl.clone();
    url.pathname = rest;
    if (
      rest.startsWith("/backstage") ||
      rest.startsWith("/api") ||
      rest.startsWith("/auth") ||
      rest.startsWith("/_next")
    ) {
      return NextResponse.redirect(url);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", "en");
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/backstage") || pathname.startsWith("/api/admin")) {
    // NextAuth tipa el 2.º argumento como contexto de route handler; en
    // middleware solo lo reenvía a nuestro callback, que no lo usa.
    return adminGuard(
      request,
      event as unknown as Parameters<typeof adminGuard>[1],
    );
  }

  if (request.headers.has("x-locale")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-locale");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todo salvo los estáticos (no llevan idioma ni necesitan sesión).
    "/((?!_next/static|_next/image|images/|uploads/|favicon.ico|icon.png|apple-icon.png|opengraph-image.png).*)",
  ],
};
