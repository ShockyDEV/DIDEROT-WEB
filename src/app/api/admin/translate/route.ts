import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { translateInputSchema } from "@/lib/admin-schemas";
import { rateLimit } from "@/lib/rate-limit";
import { translateHtml, translateText, translationEnabled } from "@/lib/translate";

/**
 * Traducción bajo demanda ES→EN para el panel (patrón /api/admin/translate
 * de mupes). Responde 501 si no hay proveedor configurado (DEEPL_API_KEY),
 * para que la UI pueda informar en vez de fallar.
 */
export const POST = withErrorHandling("translate", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  if (!translationEnabled()) {
    return apiError(
      "Traducción no configurada: define DEEPL_API_KEY en el entorno del servidor.",
      501,
    );
  }

  // La cuota de DeepL es limitada (500 000 caracteres/mes en el plan gratis).
  if (!rateLimit(`translate:${guard.user.id}`, 60, 10 * 60_000)) {
    return apiError("Demasiadas traducciones seguidas; espera unos minutos", 429);
  }

  const body = await readJsonBody(request, translateInputSchema, 256 * 1024);
  if (body.response) return body.response;

  const { text, html } = body.data;
  const translated = html ? await translateHtml(text) : await translateText(text);
  if (translated === null) {
    return apiError("El proveedor de traducción no respondió", 502);
  }
  return NextResponse.json({ translated });
});
