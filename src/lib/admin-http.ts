import { NextResponse } from "next/server";
import { z, type ZodTypeAny } from "zod";

/**
 * Utilidades HTTP de las API del panel (/api/admin/**) y de la analítica.
 *
 * Aquí no se importa ni NextAuth ni Prisma: son funciones puras (o casi) que
 * se prueban con Vitest. El guard con sesión vive en admin-guard.ts.
 *
 * Contexto: la web anterior (WordPress) fue atacada, así que las API del
 * panel aplican defensa en profundidad: comprobación de origen (CSRF),
 * validación de todo lo que entra (también los ids de la URL), límites de
 * tamaño y respuestas de error sin detalles internos (nada de trazas ni de
 * mensajes de Prisma hacia el cliente).
 */

/** Respuesta de error JSON con el formato que esperan las secciones del panel. */
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/* ── Comprobación de origen (CSRF) ──────────────────────────────────────── */

/** Métodos que cambian estado: son los únicos que exigen el mismo origen. */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Origen (esquema://host[:puerto]) de una URL, o null si no es válida. */
export function originOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Orígenes configurados del sitio (NEXTAUTH_URL, AUTH_URL, SITE_URL…). En
 * producción, detrás del proxy inverso, el Host que llega a Next puede ser
 * interno; estas variables dicen cuál es el origen público.
 */
export function configuredOrigins(
  env: Record<string, string | undefined> = process.env,
): string[] {
  return [
    env.NEXTAUTH_URL,
    env.AUTH_URL,
    env.SITE_URL,
    env.NEXT_PUBLIC_SITE_URL,
  ]
    .map(originOf)
    .filter((o): o is string => o !== null);
}

/**
 * ¿La petición viene de una página de este mismo sitio?
 *
 * - GET/HEAD no cambian nada: siempre pasan.
 * - Si el navegador envía Fetch Metadata (Sec-Fetch-Site), debe ser
 *   «same-origin». Se rechaza también «same-site»: otro subdominio de
 *   usal.es (p. ej. una web comprometida) no puede operar en el panel aunque
 *   comparta las cookies SameSite=Lax.
 * - El Origin (o, en su defecto, el Referer) debe coincidir con el Host de
 *   la petición o con uno de los orígenes configurados.
 * - Sin ninguna de esas cabeceras no es un navegador (curl, scripts): no es
 *   un vector de CSRF, porque no lleva las cookies de la víctima.
 */
export function isSameOriginRequest(
  method: string,
  headers: Headers,
  allowedOrigins: readonly string[] = [],
): boolean {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return true;

  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const rawOrigin = headers.get("origin");
  if (rawOrigin === "null") return false; // iframes sandbox, file://…
  const origin = rawOrigin ? originOf(rawOrigin) : originOf(headers.get("referer"));
  if (!origin) {
    // Cabecera presente pero ilegible → fuera. Ausente → cliente no navegador.
    return !rawOrigin && !headers.get("referer");
  }

  if (allowedOrigins.includes(origin)) return true;

  // Host de la propia petición (el primero de X-Forwarded-Host si hay proxy).
  const forwarded = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = (forwarded || headers.get("host") || "").toLowerCase();
  return host !== "" && new URL(origin).host.toLowerCase() === host;
}

/* ── Lectura y validación del cuerpo JSON ───────────────────────────────── */

/** Tamaño máximo por defecto de un cuerpo JSON del panel. */
export const DEFAULT_JSON_LIMIT = 256 * 1024; // 256 KB

/**
 * Lee el cuerpo como texto sin pasar de `maxBytes` (corta la lectura en
 * cuanto se supera, sin cargar en memoria cuerpos enormes). null = excedido.
 */
export async function readTextLimited(
  request: Request,
  maxBytes: number,
): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** Nombres legibles de los campos para los mensajes de validación. */
const FIELD_LABELS: Record<string, string> = {
  title: "título",
  titleEn: "título en inglés",
  authors: "autores",
  year: "año",
  type: "tipo",
  venue: "revista / editorial",
  details: "detalles",
  doi: "DOI",
  url: "enlace",
  abstract: "resumen",
  name: "nombre",
  email: "correo electrónico",
  password: "contraseña",
  newPassword: "contraseña nueva",
  currentPassword: "contraseña actual",
  confirmPassword: "repetición de la contraseña",
  role: "rol",
  category: "categoría",
  status: "estado",
  content: "contenido",
  startsAt: "fecha",
  endsAt: "fecha de fin",
  orcid: "ORCID",
  orcids: "ORCID",
  items: "selección",
  photo: "foto",
  image: "imagen",
  slug: "slug",
};

/**
 * Mensaje de error legible (en español) de una validación de zod. Si el
 * esquema trae un mensaje propio se usa tal cual; si es el mensaje genérico
 * (en inglés) de zod, se sustituye por uno en castellano con el campo.
 */
export function zodMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Datos no válidos";
  const key = [...issue.path].reverse().find((p) => typeof p === "string");
  const field = key ? (FIELD_LABELS[key] ?? key) : null;
  const where = field ? ` en «${field}»` : "";

  const generic = z.defaultErrorMap(issue, { defaultError: "", data: undefined })
    .message;
  if (issue.message && issue.message !== generic) return issue.message;

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return issue.received === "undefined" || issue.received === "null"
        ? field
          ? `Falta el campo «${field}»`
          : "Faltan datos obligatorios"
        : `Tipo de dato no válido${where}`;
    case z.ZodIssueCode.too_small:
      return `Valor demasiado corto o pequeño${where}`;
    case z.ZodIssueCode.too_big:
      return `Valor demasiado largo o grande${where}`;
    case z.ZodIssueCode.invalid_enum_value:
      return `Valor no permitido${where}`;
    case z.ZodIssueCode.invalid_string:
      return `Formato no válido${where}`;
    default:
      return `Datos no válidos${where}`;
  }
}

type BodyResult<T> =
  | { data: T; response?: undefined }
  | { data?: undefined; response: NextResponse };

/**
 * Lee, limita y valida un cuerpo JSON. Uso:
 *   const body = await readJsonBody(request, schema);
 *   if (body.response) return body.response;
 *   body.data // tipado y validado
 */
export async function readJsonBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
  maxBytes = DEFAULT_JSON_LIMIT,
): Promise<BodyResult<z.output<S>>> {
  let text: string | null;
  try {
    text = await readTextLimited(request, maxBytes);
  } catch {
    return { response: apiError("No se pudo leer la petición", 400) };
  }
  if (text === null) {
    return { response: apiError("La petición es demasiado grande", 413) };
  }
  let json: unknown;
  try {
    json = text.trim() === "" ? undefined : JSON.parse(text);
  } catch {
    return { response: apiError("El cuerpo de la petición no es JSON válido", 400) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { response: apiError(zodMessage(parsed.error), 400) };
  }
  return { data: parsed.data };
}

/* ── Identificadores de la URL ──────────────────────────────────────────── */

/** Ids de Prisma (cuid) y, por tolerancia, cualquier id corto y seguro. */
export const idSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,64}$/, "Identificador no válido");

/** Valida el id de un segmento dinámico ([id]); null si no es válido. */
export function parseId(raw: string | undefined): string | null {
  const parsed = idSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/* ── Errores inesperados ────────────────────────────────────────────────── */

/** Código de error de Prisma (P2002, P2025…) sin importar el cliente. */
function prismaCode(err: unknown): string | null {
  if (typeof err !== "object" || err === null || !("code" in err)) return null;
  const code = (err as { code: unknown }).code;
  return typeof code === "string" && /^P\d{4}$/.test(code) ? code : null;
}

/**
 * Traduce un error no controlado a una respuesta genérica: el detalle se
 * queda en el log del servidor y el cliente solo recibe un mensaje neutro.
 */
export function errorResponse(err: unknown, context: string) {
  const code = prismaCode(err);
  if (code === "P2002") {
    return apiError("Ya existe un registro con esos datos (valor duplicado)", 409);
  }
  if (code === "P2025") return apiError("No encontrado", 404);
  console.error(`[api] ${context}:`, err);
  return apiError("Error interno del servidor. Inténtalo de nuevo.", 500);
}

/**
 * Envuelve un handler de ruta para que ningún error escape sin control
 * (Next devolvería un 500 con detalles en desarrollo).
 */
export function withErrorHandling<C>(
  context: string,
  handler: (request: Request, ctx: C) => Promise<Response>,
): (request: Request, ctx: C) => Promise<Response> {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      return errorResponse(err, context);
    }
  };
}
