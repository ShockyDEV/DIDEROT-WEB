import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import {
  translateHtml,
  translateText,
  translationEnabled,
} from "@/lib/translate";

const translateSchema = z.object({
  text: z.string().min(1).max(50_000),
  /** true si el texto es HTML (se preservan las etiquetas). */
  html: z.boolean().optional(),
});

/**
 * Traducción bajo demanda ES→EN para el panel (patrón /api/admin/translate
 * de mupes). Responde 501 si no hay proveedor configurado (DEEPL_API_KEY),
 * para que la UI pueda informar en vez de fallar.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  if (!translationEnabled()) {
    return NextResponse.json(
      {
        error:
          "Traducción no configurada: define DEEPL_API_KEY en el entorno del servidor.",
      },
      { status: 501 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = translateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
  }

  const { text, html } = parsed.data;
  const translated = html ? await translateHtml(text) : await translateText(text);

  if (translated === null) {
    return NextResponse.json(
      { error: "El proveedor de traducción no respondió" },
      { status: 502 },
    );
  }
  return NextResponse.json({ translated });
}
