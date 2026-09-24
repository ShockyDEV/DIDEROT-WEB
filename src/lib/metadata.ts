import type { Metadata } from "next";
import { getLocale } from "@/lib/locale-server";

export interface MetaTexto {
  title: string;
  description: string;
}

/**
 * Metadatos bilingües de una página pública.
 *
 * Devuelve la función que Next espera en `export const generateMetadata`. El
 * idioma sale de la cabecera x-locale que el middleware pone en /en, así que
 * el título de la pestaña y la descripción para buscadores acompañan al
 * idioma de la página en vez de quedarse siempre en español.
 */
export function metadataBilingue(es: MetaTexto, en: MetaTexto) {
  return function generateMetadata(): Metadata {
    const t = getLocale() === "en" ? en : es;
    return { title: t.title, description: t.description };
  };
}
