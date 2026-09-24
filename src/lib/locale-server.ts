import { headers } from "next/headers";
import type { Locale } from "@/lib/locale";

export type { Locale };

/**
 * Idioma de la petición (solo server components / rutas). El middleware
 * reescribe /en/* a la ruta española añadiendo la cabecera x-locale=en;
 * sin cabecera, la web es en español.
 *
 * Llamar a getLocale() dentro de una página la convierte en dinámica (usa
 * headers()); las páginas públicas ya lo son (force-dynamic).
 */
export function getLocale(): Locale {
  try {
    return headers().get("x-locale") === "en" ? "en" : "es";
  } catch {
    // Fuera del ámbito de una petición (build estático): español.
    return "es";
  }
}
