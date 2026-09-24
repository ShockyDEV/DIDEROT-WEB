import { describe, expect, it } from "vitest";
import { htmlToText, safeUrl, sanitizeHtml } from "@/lib/sanitize-html";

describe("sanitizeHtml", () => {
  it("conserva el HTML que produce el editor (TipTap)", () => {
    const html =
      '<h2>Título</h2><p style="text-align: center">Texto <strong>fuerte</strong>, <em>cursiva</em>, <u>subrayado</u> y <s>tachado</s>.</p>' +
      '<ul><li><p>uno</p></li></ul><blockquote><p>cita</p></blockquote>' +
      '<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://usal.es">enlace</a></p>' +
      '<img src="/uploads/news/foto.jpg" alt="Foto">' +
      '<table style="min-width: 75px"><colgroup><col style="min-width: 25px"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>A</p></th></tr></tbody></table>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("elimina scripts, estilos, iframes y formularios", () => {
    expect(sanitizeHtml('<p>a</p><script>alert(1)</script><p>b</p>')).toBe("<p>a</p><p>b</p>");
    expect(sanitizeHtml("<style>body{display:none}</style>x")).toBe("x");
    expect(sanitizeHtml('<iframe src="https://evil.example"></iframe>y')).toBe("y");
    expect(sanitizeHtml('<form action="https://evil.example"><input name="p"></form>z')).toBe("z");
    expect(sanitizeHtml("<svg><script>alert(1)</script></svg>ok")).toBe("ok");
  });

  it("quita los manejadores de eventos y las URL peligrosas", () => {
    expect(sanitizeHtml('<img src="x.jpg" onerror="alert(1)">')).toBe('<img src="x.jpg">');
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<a href="JaVa&#x09;ScRiPt:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<a href="&#106;avascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<p onclick="alert(1)" onmouseover=alert(1)>hola</p>')).toBe("<p>hola</p>");
    expect(sanitizeHtml('<img src="javascript:alert(1)">')).toBe("");
  });

  it("añade rel=noopener a los enlaces que abren pestaña nueva", () => {
    expect(sanitizeHtml('<a href="https://usal.es" target="_blank">x</a>')).toBe(
      '<a href="https://usal.es" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  it("solo estilos de alineación y anchos", () => {
    expect(sanitizeHtml('<p style="color: red; text-align: right; background: url(javascript:x)">t</p>')).toBe(
      '<p style="text-align: right">t</p>',
    );
    expect(sanitizeHtml('<p style="behavior: url(x.htc)">t</p>')).toBe("<p>t</p>");
  });

  it("imágenes pegadas en base64 sí, documentos incrustados no", () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,iVBORw0KGgo=">')).toBe(
      '<img src="data:image/png;base64,iVBORw0KGgo=">',
    );
    expect(sanitizeHtml('<img src="data:image/svg+xml;base64,PHN2Zz4=">')).toBe("");
  });

  it("un «<» suelto o una etiqueta a medias no abren nada", () => {
    expect(sanitizeHtml("<p>1 < 2</p>")).toBe("<p>1 &lt; 2</p>");
    expect(sanitizeHtml('texto <img src=x onerror=alert(1)')).toBe("texto &lt;img src=x onerror=alert(1)");
    expect(sanitizeHtml("<!-- comentario --><p>x</p>")).toBe("<p>x</p>");
  });

  it("etiquetas desconocidas: fuera la etiqueta, queda el texto", () => {
    expect(sanitizeHtml("<marquee>hola</marquee>")).toBe("hola");
    expect(sanitizeHtml('<meta http-equiv="refresh" content="0;url=https://evil.example">x')).toBe("x");
  });
});

describe("safeUrl y htmlToText", () => {
  it("safeUrl admite relativas, http(s), mailto y tel", () => {
    expect(safeUrl("/contacto")).toBe("/contacto");
    expect(safeUrl("mailto:diderot@usal.es")).toBe("mailto:diderot@usal.es");
    expect(safeUrl(" vbscript:msgbox(1)")).toBeNull();
  });

  it("htmlToText extrae el texto de un bloque «<p>URL</p>»", () => {
    expect(htmlToText("<p>https://usal.es/?a=1&amp;b=2</p>")).toBe("https://usal.es/?a=1&b=2");
  });
});
