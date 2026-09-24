/**
 * Auto-traducción ES → EN al guardar (patrón mupes).
 *
 * Proveedor: DeepL (gratuito hasta 500k caracteres/mes). Se activa definiendo
 * DEEPL_API_KEY en .env; sin clave, la traducción se omite silenciosamente y
 * los campos *En quedan sin rellenar (la web pública hace fallback al
 * español), de modo que el guardado nunca falla por la traducción.
 *
 * DeepL admite HTML con tag_handling=html, así que sirve tanto para textos
 * planos (títulos) como para el HTML de TipTap (cuerpo de noticias, bloques).
 */

const DEEPL_URL_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_URL_PRO = "https://api.deepl.com/v2/translate";

function apiKey(): string | null {
  const key = process.env.DEEPL_API_KEY?.trim();
  if (!key || key.includes("placeholder")) return null;
  return key;
}

export function translationEnabled(): boolean {
  return apiKey() !== null;
}

async function deeplTranslate(
  texts: string[],
  options: { html?: boolean },
): Promise<string[] | null> {
  const key = apiKey();
  if (!key) return null;

  // Las claves free terminan en ":fx" y usan el host api-free.
  const url = key.endsWith(":fx") ? DEEPL_URL_FREE : DEEPL_URL_PRO;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: texts,
        source_lang: "ES",
        target_lang: "EN-GB",
        ...(options.html ? { tag_handling: "html" } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[translate] DeepL respondió ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      translations?: Array<{ text: string }>;
    };
    const out = json.translations?.map((t) => t.text);
    return out && out.length === texts.length ? out : null;
  } catch (e) {
    console.error("[translate] Error llamando a DeepL:", e);
    return null;
  }
}

/** Traduce un texto plano ES→EN. Devuelve null si no hay proveedor o falla. */
export async function translateText(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  const out = await deeplTranslate([text], { html: false });
  return out?.[0] ?? null;
}

/** Traduce un fragmento HTML ES→EN preservando las etiquetas. */
export async function translateHtml(html: string): Promise<string | null> {
  if (!html.trim()) return null;
  const out = await deeplTranslate([html], { html: true });
  return out?.[0] ?? null;
}

/**
 * Traduce los campos de una noticia. Devuelve solo los campos que se pudieron
 * traducir (objeto vacío si el proveedor no está configurado).
 */
export async function translateNewsFields(fields: {
  title: string;
  excerpt?: string | null;
  content: string;
}): Promise<{ titleEn?: string; excerptEn?: string; contentEn?: string }> {
  if (!translationEnabled()) return {};

  const [titleEn, excerptEn, contentEn] = await Promise.all([
    translateText(fields.title),
    fields.excerpt ? translateText(fields.excerpt) : Promise.resolve(null),
    translateHtml(fields.content),
  ]);

  return {
    ...(titleEn ? { titleEn } : {}),
    ...(excerptEn ? { excerptEn } : {}),
    ...(contentEn ? { contentEn } : {}),
  };
}
