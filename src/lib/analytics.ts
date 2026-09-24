import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * Analítica ligera y SIN COOKIES de la web pública (POST /api/track).
 *
 * Privacidad por diseño (no requiere banner de consentimiento):
 * - No se guarda la IP ni el User-Agent: solo un identificador de visitante
 *   = SHA-256(IP + User-Agent + día + secreto), truncado. Cambia cada día y
 *   no se puede revertir ni cruzar entre días.
 * - Del referente solo se guarda el origen (https://www.google.com), nunca
 *   la URL completa (podría llevar datos personales en la query).
 * - Se respeta Do Not Track / Global Privacy Control.
 * - Bots y rutas internas (panel, API, login) no se cuentan.
 *
 * Funciones puras (salvo el hash) para poder probarlas con Vitest.
 */

export const trackInputSchema = z.object({
  path: z.string().max(300),
  referrer: z.string().max(1000).optional().nullable(),
});

/** Rutas que no se cuentan (el tracker tampoco las envía). */
const EXCLUDED_PREFIXES = ["/backstage", "/api", "/auth", "/_next", "/uploads"];

/** Agentes que no son personas: buscadores, monitores, scripts, IA… */
const BOT_RE =
  /bot|crawl|spider|slurp|scrap|fetch|preview|facebookexternalhit|embedly|whatsapp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python|httpclient|http-client|axios|node-fetch|undici|okhttp|java\/|libwww|go-http|ruby|perl|php\/|postman|insomnia|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|claude|ccbot|perplexity|yandex|baidu|bingpreview|duckduck/i;

/** ¿Es un bot (o un cliente sin User-Agent)? */
export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 10) return true;
  return BOT_RE.test(userAgent);
}

/**
 * Normaliza la ruta visitada: relativa, sin query ni ancla, sin barra final
 * y fuera de las zonas internas. null = no se cuenta.
 */
export function normalizeTrackedPath(raw: string): string | null {
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  let path = raw.split(/[?#]/)[0];
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return null;
  try {
    // Normaliza el %-encoding (/n%C3%BAmero → /número) y rechaza el inválido.
    path = decodeURI(path);
  } catch {
    return null;
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (path.length === 0 || path.length > 300) return null;
  if (path.split("/").some((s) => s === "..")) return null;
  const lower = path.toLowerCase();
  // Las rutas /en/… son la versión inglesa de las mismas páginas.
  const bare = lower === "/en" ? "/" : lower.startsWith("/en/") ? lower.slice(3) : lower;
  if (EXCLUDED_PREFIXES.some((p) => bare === p || bare.startsWith(`${p}/`))) return null;
  return path;
}

/**
 * Origen del referente externo (https://www.google.com). null si no hay,
 * no es http(s) o es el propio sitio (navegación interna).
 */
export function referrerOrigin(
  raw: string | null | undefined,
  ownHosts: readonly string[] = [],
): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.host.toLowerCase();
    if (ownHosts.some((h) => h.toLowerCase() === host)) return null;
    return u.origin.slice(0, 200);
  } catch {
    return null;
  }
}

/** ¿El navegador pide no ser rastreado? (DNT o Global Privacy Control) */
export function prefersNoTracking(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

/** Día (UTC) con el que rota el identificador de visitante. */
export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Identificador anónimo de visitante: SHA-256(IP + UA + día + secreto)
 * truncado a 16 caracteres hex. Sin el secreto no se puede recalcular.
 */
export function visitorId(ip: string, userAgent: string, day: string, secret: string): string {
  return createHash("sha256")
    .update(`${ip}\n${userAgent}\n${day}\n${secret}`)
    .digest("hex")
    .slice(0, 16);
}
