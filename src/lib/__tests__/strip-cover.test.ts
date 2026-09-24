import { describe, expect, it } from "vitest";
import { stripCoverFromContent } from "@/lib/news-service";

describe("stripCoverFromContent", () => {
  it("quita del cuerpo la figura de la portada, conservando el resto", () => {
    const content = `<p>Intro</p>
<figure class="wp-block-image size-large"><a href="/uploads/legacy/foto.jpeg"><img src="/uploads/legacy/foto-1024x771.jpeg" /></a></figure>
<figure class="wp-block-image"><img src="/uploads/legacy/otra-1024x570.jpeg" /></figure>`;
    const out = stripCoverFromContent(
      content,
      "/uploads/legacy/foto-1024x771.jpeg",
    );
    expect(out).not.toContain("foto-1024x771.jpeg");
    expect(out).toContain("otra-1024x570.jpeg"); // las demás se conservan
    expect(out).toContain("<p>Intro</p>");
  });

  it("reconoce la portada aunque sea otra variante de tamaño", () => {
    const content = `<figure class="wp-block-image"><img src="/uploads/legacy/foto-768x578.jpeg" /></figure>`;
    // La portada apunta a la variante 1024x771 de la misma imagen.
    const out = stripCoverFromContent(
      content,
      "/uploads/legacy/foto-1024x771.jpeg",
    );
    expect(out).not.toContain("foto-");
  });

  it("deja limpias las galerías que quedan vacías", () => {
    const content = `<figure class="wp-block-gallery"><figure class="wp-block-image"><img src="/uploads/legacy/sola-300x200.jpeg" /></figure></figure>`;
    const out = stripCoverFromContent(
      content,
      "/uploads/legacy/sola.jpeg",
    );
    expect(out).not.toContain("wp-block-gallery");
    expect(out.trim()).toBe("");
  });

  it("quita solo la primera aparición y no toca imágenes ajenas", () => {
    const content = `<img src="/uploads/legacy/portada.jpeg" /><img src="/uploads/legacy/cuerpo.jpeg" />`;
    const out = stripCoverFromContent(content, "/uploads/legacy/portada.jpeg");
    expect(out).not.toContain("portada.jpeg");
    expect(out).toContain("cuerpo.jpeg");
  });

  it("no cambia nada si no hay portada o no está en el cuerpo", () => {
    const content = `<p>Sin imágenes</p>`;
    expect(stripCoverFromContent(content, null)).toBe(content);
    expect(stripCoverFromContent(content, "/uploads/legacy/x.jpeg")).toBe(
      content,
    );
  });
});
