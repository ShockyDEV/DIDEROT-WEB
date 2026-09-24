/**
 * Saneado del HTML enriquecido que se guarda desde el panel (cuerpo de las
 * noticias, bloques de las páginas y sus traducciones automáticas).
 *
 * Ese HTML se pinta en la web pública con dangerouslySetInnerHTML, así que
 * se limpia al GUARDAR con una lista blanca: solo las etiquetas y atributos
 * que produce el editor (TipTap: párrafos, títulos, listas, citas, enlaces,
 * imágenes, tablas, alineación) y nada ejecutable (scripts, iframes,
 * manejadores on*, URLs javascript:…). Es defensa en profundidad: la web
 * anterior fue atacada y una sesión robada no debe poder sembrar scripts.
 *
 * No depende del DOM (se ejecuta en las API del servidor).
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "span", "div",
  "strong", "b", "em", "i", "u", "s", "strike", "del", "ins", "mark",
  "sub", "sup", "small", "code", "pre", "abbr", "cite", "q",
  "a",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "dl", "dt", "dd",
  "blockquote", "figure", "figcaption",
  "img",
  "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td",
]);

/** Etiquetas sin cierre. */
const VOID_TAGS = new Set(["br", "hr", "img", "col"]);

/** Elementos que se eliminan CON su contenido (código o incrustaciones). */
const DROP_WITH_CONTENT = [
  "script", "style", "iframe", "frame", "frameset", "object", "embed",
  "applet", "noscript", "noembed", "template", "svg", "math", "textarea",
  "select", "title", "head", "xmp",
];

/** Atributos permitidos en cualquier etiqueta. */
const GLOBAL_ATTRS = new Set(["class", "title", "lang", "dir", "style"]);

/** Atributos permitidos por etiqueta. */
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  td: new Set(["colspan", "rowspan", "colwidth"]),
  th: new Set(["colspan", "rowspan", "colwidth", "scope"]),
  col: new Set(["span", "width"]),
  colgroup: new Set(["span"]),
  ol: new Set(["start", "type"]),
  li: new Set(["value"]),
  blockquote: new Set(["cite"]),
  q: new Set(["cite"]),
};

const URL_ATTRS = new Set(["href", "src", "cite"]);
const NUMERIC_ATTRS = new Set(["width", "height", "colspan", "rowspan", "span", "start", "value"]);
const REL_TOKENS = new Set(["noopener", "noreferrer", "nofollow", "ugc", "sponsored", "external"]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Decodifica las referencias de carácter de un valor de atributo. */
export function decodeEntities(value: string): string {
  return value.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi,
    (match, ref: string) => {
      if (ref[0] === "#") {
        const code =
          ref[1] === "x" || ref[1] === "X"
            ? parseInt(ref.slice(2), 16)
            : parseInt(ref.slice(1), 10);
        if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
        return String.fromCodePoint(code);
      }
      const named = NAMED_ENTITIES[ref.toLowerCase()];
      return named ?? match;
    },
  );
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Texto entre etiquetas: un «<» suelto nunca debe abrir una etiqueta. */
function escapeText(text: string): string {
  return text.replace(/</g, "&lt;");
}

/**
 * ¿Es segura esta URL para un href/src? Relativas, http(s), mailto y tel;
 * en <img src> también imágenes incrustadas en base64 (pegadas en TipTap).
 * Devuelve la URL a usar o null.
 */
export function safeUrl(raw: string, options: { allowDataImage?: boolean } = {}): string | null {
  const value = raw.trim();
  // El navegador ignora espacios y caracteres de control al leer el
  // esquema («java\tscript:»): se comprueba sin ellos.
  const compact = value.replace(/[\u0000- \u007f]+/g, "");
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  if (!scheme) return value; // relativa: /ruta, #ancla, ?q=, ./x
  if (scheme === "http" || scheme === "https" || scheme === "mailto" || scheme === "tel") {
    return value;
  }
  if (
    options.allowDataImage &&
    /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(compact)
  ) {
    return compact;
  }
  return null;
}

/** Solo estilos de maquetación inocuos (alineación y anchos de tabla). */
function safeStyle(value: string): string | null {
  const kept: string[] = [];
  for (const decl of value.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim().toLowerCase();
    if (prop === "text-align" && /^(left|right|center|justify|start|end)$/.test(val)) {
      kept.push(`text-align: ${val}`);
    } else if (
      (prop === "width" || prop === "min-width") &&
      /^\d{1,5}(\.\d{1,3})?(px|%|em|rem)$/.test(val)
    ) {
      kept.push(`${prop}: ${val}`);
    }
  }
  return kept.length > 0 ? kept.join("; ") : null;
}

const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function sanitizeAttributes(tag: string, raw: string): string {
  const allowed = TAG_ATTRS[tag];
  const attrs = new Map<string, string>();

  for (const m of raw.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    if (name.startsWith("on")) continue; // onclick, onerror…
    if (!GLOBAL_ATTRS.has(name) && !allowed?.has(name)) continue;
    const value = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");

    let clean: string | null = value;
    if (URL_ATTRS.has(name)) {
      clean = safeUrl(value, { allowDataImage: tag === "img" && name === "src" });
    } else if (name === "style") {
      clean = safeStyle(value);
    } else if (name === "target") {
      clean = value === "_blank" ? "_blank" : null;
    } else if (name === "rel") {
      const tokens = value.toLowerCase().split(/\s+/).filter((t) => REL_TOKENS.has(t));
      clean = tokens.length > 0 ? tokens.join(" ") : null;
    } else if (NUMERIC_ATTRS.has(name)) {
      clean = /^\d{1,5}(%|px)?$/.test(value.trim()) ? value.trim() : null;
    } else if (name === "colwidth") {
      clean = /^[\d,]{1,60}$/.test(value) ? value : null;
    } else if (name === "type") {
      clean = /^[1aAiI]$/.test(value) ? value : null;
    } else if (name === "loading") {
      clean = value === "lazy" || value === "eager" ? value : null;
    } else if (name === "scope") {
      clean = /^(row|col|rowgroup|colgroup)$/.test(value) ? value : null;
    } else if (name === "dir") {
      clean = /^(ltr|rtl|auto)$/.test(value) ? value : null;
    }
    if (clean === null) continue;
    attrs.set(name, clean);
  }

  // Los enlaces que abren pestaña nueva no dan acceso a window.opener.
  if (tag === "a" && attrs.get("target") === "_blank") {
    const rel = new Set((attrs.get("rel") ?? "").split(" ").filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    attrs.set("rel", [...rel].join(" "));
  }
  // Una imagen sin src no sirve de nada (y src vacío es sospechoso).
  if (tag === "img" && !attrs.get("src")) return "";

  let out = "";
  for (const [name, value] of attrs) out += ` ${name}="${escapeAttr(value)}"`;
  return out;
}

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

/** Devuelve el HTML con solo etiquetas y atributos de la lista blanca. */
export function sanitizeHtml(input: string): string {
  let html = input
    // comentarios, CDATA, doctype e instrucciones de proceso
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/gi, "")
    .replace(/<![^>]*>/g, "")
    .replace(/<\?[^>]*>/g, "");

  for (const tag of DROP_WITH_CONTENT) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "");
  }

  const out: string[] = [];
  let last = 0;
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(html)) !== null) {
    out.push(escapeText(html.slice(last, m.index)));
    last = TAG_RE.lastIndex;
    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    if (!ALLOWED_TAGS.has(name)) continue; // se quita la etiqueta, no su texto
    if (closing) {
      if (!VOID_TAGS.has(name)) out.push(`</${name}>`);
      continue;
    }
    if (name === "img") {
      const attrs = sanitizeAttributes(name, m[3]);
      if (attrs) out.push(`<img${attrs}>`);
      continue;
    }
    out.push(`<${name}${sanitizeAttributes(name, m[3])}>`);
  }
  out.push(escapeText(html.slice(last)));
  return out.join("");
}

/** Texto plano de un fragmento HTML (para validar bloques de tipo URL). */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  ).trim();
}
