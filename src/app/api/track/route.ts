import { prisma } from "@/lib/prisma";
import {
  apiError,
  configuredOrigins,
  isSameOriginRequest,
  readJsonBody,
  withErrorHandling,
} from "@/lib/admin-http";
import {
  dayKey,
  isBot,
  normalizeTrackedPath,
  prefersNoTracking,
  referrerOrigin,
  trackInputSchema,
  visitorId,
} from "@/lib/analytics";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/track { path, referrer? } — una visita a una página pública.
 *
 * Lo envía <PageViewTracker /> (navigator.sendBeacon) en cada navegación.
 * Analítica sin cookies: ver src/lib/analytics.ts (no se guarda la IP ni el
 * User-Agent, solo un hash diario). Siempre responde 204 salvo peticiones
 * mal formadas o de otro sitio: el visitante no tiene por qué enterarse.
 */
const ignored = () => new Response(null, { status: 204 });

export const POST = withErrorHandling("track", async (request: Request) => {
  if (!isSameOriginRequest("POST", request.headers, configuredOrigins())) {
    return apiError("Origen no permitido", 403);
  }

  const userAgent = request.headers.get("user-agent");
  if (isBot(userAgent) || prefersNoTracking(request.headers)) return ignored();

  const ip = clientIp(request);
  // Una persona no ve 60 páginas por minuto: por encima, se descarta.
  if (!rateLimit(`track:${ip}`, 60, 60_000)) return ignored();

  const body = await readJsonBody(request, trackInputSchema, 2 * 1024);
  if (body.response) return body.response;

  const path = normalizeTrackedPath(body.data.path);
  if (!path) return ignored();

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return ignored(); // sin secreto el hash sería reversible

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const ownHosts = [
    forwardedHost,
    request.headers.get("host"),
    ...configuredOrigins().map((o) => new URL(o).host),
  ].filter((h): h is string => Boolean(h));

  const visitor = visitorId(ip, userAgent ?? "", dayKey(), secret);

  // Recargas y dobles envíos: la misma página del mismo visitante cuenta
  // una sola vez cada 30 segundos.
  if (!rateLimit(`track:dup:${visitor}:${path}`, 1, 30_000)) return ignored();

  await prisma.pageView.create({
    data: {
      path,
      referrer: referrerOrigin(body.data.referrer, ownHosts),
      visitorId: visitor,
    },
  });
  return ignored();
});
