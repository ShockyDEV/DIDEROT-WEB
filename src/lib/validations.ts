/**
 * Enlace apto para un `href` a partir de un valor escrito en el panel (listas
 * editables, web de un evento…): solo http(s), mailto, rutas internas («/…»)
 * y anclas («#…»). Lo demás —javascript:, data:, rutas «//otro-sitio»— se
 * descarta (null), para que una cuenta del panel comprometida no pueda
 * colar scripts en la web pública. Un dominio sin esquema («www.x.es») se
 * completa con https://.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Los navegadores ignoran tabuladores y saltos de línea dentro de una URL
  // («java\nscript:»): se quitan antes de comprobar nada.
  const url = value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!url) return null;
  if (url.startsWith("#")) return url;
  if (url.startsWith("/")) {
    // «//host» y «/\host» serían enlaces a otro sitio.
    return url.startsWith("//") || url.startsWith("/\\") ? null : url;
  }
  if (/^(https?:\/\/|mailto:)/i.test(url)) {
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(?:[/?#]|$)/i.test(url)) {
    return `https://${url}`;
  }
  return null;
}

/** ¿Es una ruta de este mismo sitio («/uploads/…», «/images/…»)? */
export function isLocalPath(value: string): boolean {
  return (
    value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
  );
}
