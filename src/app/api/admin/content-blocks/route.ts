import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { contentBlockInputSchema, isSafeLink } from "@/lib/admin-schemas";
import { isUrlBlockKey } from "@/lib/admin-options";
import { PAGE_BLOCKS } from "@/lib/content/page-blocks";
import { LIST_BLOCKS, type ListBlockDef } from "@/lib/content/list-blocks";
import { htmlToText, sanitizeHtml } from "@/lib/sanitize-html";
import { translateHtml, translationEnabled } from "@/lib/translate";

/** GET /api/admin/content-blocks?page=grupo → bloques guardados de esa página. */
export const GET = withErrorHandling("content-blocks:list", async (request: Request) => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const pageSlug = new URL(request.url).searchParams.get("page");
  const items = await prisma.contentBlock.findMany({
    where: pageSlug ? { pageSlug: pageSlug.slice(0, 100) } : undefined,
    orderBy: [{ pageSlug: "asc" }, { blockKey: "asc" }],
  });
  return NextResponse.json({ items });
});

const MAX_LIST_ITEMS = 300;
const MAX_FIELD_LENGTH = 5000;

/**
 * Valida una lista editable (JSON) contra su definición del registro: un
 * array de objetos con textos acotados, casillas booleanas, iconos con
 * nombre de Lucide y enlaces seguros (nada de «javascript:» en un href).
 * Las claves que no declara el registro se conservan si son primitivas.
 */
function validateList(def: ListBlockDef, raw: string): { json: string } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "La lista no es JSON válido" };
  }
  if (!Array.isArray(parsed)) return { error: "La lista debe ser una lista de elementos" };
  if (parsed.length > MAX_LIST_ITEMS) {
    return { error: `La lista tiene demasiados elementos (máximo ${MAX_LIST_ITEMS})` };
  }

  const fields = new Map(def.fields.map((f) => [f.key, f]));
  const items: Array<Record<string, string | boolean | number>> = [];
  for (const [index, item] of parsed.entries()) {
    const n = index + 1;
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return { error: `El elemento ${n} no es válido` };
    }
    const out: Record<string, string | boolean | number> = {};
    const entries = Object.entries(item as Record<string, unknown>);
    for (const f of def.fields) {
      if (!entries.some(([k]) => k === f.key)) entries.push([f.key, f.type === "check" ? false : ""]);
    }
    for (const [key, value] of entries) {
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(key)) return { error: `Campo no válido en el elemento ${n}` };
      const field = fields.get(key);
      const label = field?.label ?? key;
      if (field?.type === "check") {
        out[key] = value === true;
        continue;
      }
      if (value === null || value === undefined) {
        out[key] = "";
        continue;
      }
      if (typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) {
        out[key] = value;
        continue;
      }
      if (typeof value !== "string") return { error: `«${label}» del elemento ${n} no es texto` };
      if (value.length > MAX_FIELD_LENGTH) {
        return { error: `«${label}» del elemento ${n} es demasiado largo` };
      }
      const text = value.trim();
      const isLink = field ? field.type === "url" : /url|href|link|enlace/i.test(key);
      if (isLink && text && !isSafeLink(text)) {
        return {
          error: `Enlace no válido en «${label}» (elemento ${n}): usa https://…, /ruta, #ancla, mailto: o tel:`,
        };
      }
      if (field?.type === "icon" && text && !/^[A-Za-z0-9]{1,60}$/.test(text)) {
        return { error: `Icono no válido en el elemento ${n}` };
      }
      out[key] = text;
    }
    items.push(out);
  }
  return { json: JSON.stringify(items) };
}

/**
 * PUT: guarda un bloque (pageSlug + blockKey → content). Solo se admiten
 * bloques y listas del registro de contenido (y su variante «:en»). Los
 * datos del sitio (_site) tienen su propia API (/api/admin/site-settings).
 */
export const PUT = withErrorHandling("content-blocks:save", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, contentBlockInputSchema, 1024 * 1024);
  if (body.response) return body.response;
  const { pageSlug, blockKey } = body.data;
  const baseKey = blockKey.endsWith(":en") ? blockKey.slice(0, -3) : blockKey;

  const list = LIST_BLOCKS.find((l) => l.pageSlug === pageSlug && l.blockKey === baseKey);
  const block = PAGE_BLOCKS.find((p) => p.pageSlug === pageSlug)?.blocks.find(
    (b) => b.blockKey === baseKey,
  );
  if (!list && !block) {
    return apiError("Ese bloque no existe en el registro de contenido", 404);
  }

  let content: string;
  if (list) {
    const checked = validateList(list, body.data.content);
    if ("error" in checked) return apiError(checked.error, 400);
    content = checked.json;
  } else if (isUrlBlockKey(baseKey)) {
    const url = htmlToText(body.data.content);
    if (url && !isSafeLink(url)) {
      return apiError("Enlace no válido: usa https://…, /ruta, mailto: o tel:", 400);
    }
    content = sanitizeHtml(body.data.content);
  } else {
    content = sanitizeHtml(body.data.content);
  }

  const item = await prisma.contentBlock.upsert({
    where: { pageSlug_blockKey: { pageSlug, blockKey } },
    update: { content },
    create: { pageSlug, blockKey, content },
  });

  // Auto-traducción EN → fila paralela "blockKey:en" (patrón del IUCE). Ni
  // las listas (traducirlas corrompería el JSON) ni los enlaces se
  // traducen. Un fallo de DeepL no impide guardar.
  let translated = false;
  if (!list && !isUrlBlockKey(baseKey) && blockKey === baseKey && translationEnabled()) {
    const contentEn = await translateHtml(content);
    if (contentEn) {
      await prisma.contentBlock.upsert({
        where: { pageSlug_blockKey: { pageSlug, blockKey: `${blockKey}:en` } },
        update: { content: contentEn },
        create: { pageSlug, blockKey: `${blockKey}:en`, content: contentEn },
      });
      translated = true;
    }
  }

  return NextResponse.json({ item, translated });
});
