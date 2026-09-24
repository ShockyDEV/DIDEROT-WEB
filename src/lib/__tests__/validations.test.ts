import { describe, expect, it } from "vitest";
import { isLocalPath, safeHref } from "@/lib/validations";

describe("safeHref", () => {
  it("deja pasar http(s), mailto, rutas internas y anclas", () => {
    expect(safeHref("https://www.usal.es")).toBe("https://www.usal.es");
    expect(safeHref("mailto:diderot@usal.es")).toBe("mailto:diderot@usal.es");
    expect(safeHref("/eventos")).toBe("/eventos");
    expect(safeHref("#seminario")).toBe("#seminario");
  });

  it("completa con https:// un dominio sin esquema", () => {
    expect(safeHref("www.usal.es/grupos")).toBe("https://www.usal.es/grupos");
  });

  it("descarta esquemas peligrosos y enlaces a otros sitios disfrazados", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("JaVaScRiPt:alert(1)")).toBeNull();
    expect(safeHref("java\nscript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("/\\evil.example")).toBeNull();
    expect(safeHref("/\t/evil.example")).toBeNull();
  });

  it("vacío o no texto → null", () => {
    expect(safeHref("")).toBeNull();
    expect(safeHref("   ")).toBeNull();
    expect(safeHref(undefined)).toBeNull();
    expect(safeHref(true)).toBeNull();
  });
});

describe("isLocalPath", () => {
  it("distingue rutas del propio sitio de las de otros", () => {
    expect(isLocalPath("/uploads/eventos/cartel.jpg")).toBe(true);
    expect(isLocalPath("//cdn.example/x.jpg")).toBe(false);
    expect(isLocalPath("https://example.org/x.jpg")).toBe(false);
  });
});

// Los esquemas del panel (noticias, cuentas, publicaciones…) se prueban en
// admin-schemas.test.ts.
