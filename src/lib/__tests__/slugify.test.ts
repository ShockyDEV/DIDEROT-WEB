import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("convierte a minúsculas y separa con guiones", () => {
    expect(slugify("Plan de Formación Docente")).toBe(
      "plan-de-formacion-docente",
    );
  });

  it("elimina acentos y diacríticos", () => {
    expect(slugify("Educación, Tecnología y Sociedad")).toBe(
      "educacion-tecnologia-y-sociedad",
    );
    expect(slugify("Begoña Sánchez")).toBe("begona-sanchez");
  });

  it("elimina signos de puntuación", () => {
    expect(slugify("¿Noticias? ¡Sí!: XXII Congreso (2026)")).toBe(
      "noticias-si-xxii-congreso-2026",
    );
  });

  it("colapsa espacios y guiones repetidos", () => {
    expect(slugify("  doble   espacio -- y guiones  ")).toBe(
      "doble-espacio-y-guiones",
    );
  });

  it("devuelve cadena vacía para entradas sin caracteres válidos", () => {
    expect(slugify("¡¡¡???")).toBe("");
  });

  it("coincide con los slugs del contenido semilla", () => {
    expect(
      slugify("XXII Congreso Internacional de Tecnología, Conocimiento y Sociedad"),
    ).toBe("xxii-congreso-internacional-de-tecnologia-conocimiento-y-sociedad");
  });
});
