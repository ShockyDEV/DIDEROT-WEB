/**
 * Utilidades de idioma compartidas (seguras para componentes de cliente).
 * La detección en servidor (cabecera x-locale del middleware) vive en
 * locale-server.ts; en cliente el idioma se deduce del pathname (/en/*).
 */
export type Locale = "es" | "en";

/** Idioma de una ruta: pathLocale("/en/instituto") → "en". */
export function pathLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";
}

/** Ruta sin el prefijo de idioma: stripLocale("/en/instituto") → "/instituto". */
export function stripLocale(pathname: string): string {
  if (pathname === "/en") return "/";
  return pathname.startsWith("/en/") ? pathname.slice(3) : pathname;
}

/** Ruta equivalente en un idioma: withLocale("/instituto", "en") → "/en/instituto". */
export function withLocale(path: string, locale: Locale): string {
  const clean = stripLocale(path);
  if (locale === "es") return clean;
  return clean === "/" ? "/en" : `/en${clean}`;
}

/** Diccionario mínimo: elige la variante del idioma. */
export function pick<T>(locale: Locale, es: T, en: T): T {
  return locale === "en" ? en : es;
}
