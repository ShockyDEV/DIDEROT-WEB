import { describe, expect, it } from "vitest";
import {
  CONTACT_SUBJECTS,
  CONTACT_SUBJECT_EN,
  CONTACT_SUBJECT_KEYS,
  contactSchema,
  isLocalPath,
  safeHref,
} from "@/lib/validations";

const validContact = {
  name: "María López",
  email: "mlopez@usal.es",
  subject: "Doctorado y TFG/TFM",
  message: "Quisiera información sobre cómo hacer la tesis con el grupo.",
  gdpr: true,
};

describe("contactSchema", () => {
  it("acepta un mensaje válido", () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true);
  });

  it("acepta el idioma de la página (es/en) y rechaza otros", () => {
    expect(contactSchema.safeParse({ ...validContact, locale: "en" }).success).toBe(true);
    expect(contactSchema.safeParse({ ...validContact, locale: "fr" }).success).toBe(false);
  });

  it("rechaza sin aceptar el RGPD", () => {
    const r = contactSchema.safeParse({ ...validContact, gdpr: false });
    expect(r.success).toBe(false);
  });

  it("rechaza email no válido", () => {
    const r = contactSchema.safeParse({ ...validContact, email: "no-email" });
    expect(r.success).toBe(false);
  });

  it("rechaza asunto fuera de la lista", () => {
    const r = contactSchema.safeParse({ ...validContact, subject: "Spam" });
    expect(r.success).toBe(false);
  });

  it("rechaza mensajes demasiado cortos", () => {
    const r = contactSchema.safeParse({ ...validContact, message: "hola" });
    expect(r.success).toBe(false);
  });

  it("deja el nombre en una sola línea (acaba en el asunto del correo)", () => {
    const r = contactSchema.parse({ ...validContact, name: "María\r\nLópez\tRuiz" });
    expect(r.name).toBe("María López Ruiz");
  });
});

describe("asuntos de contacto", () => {
  it("todos tienen etiqueta en inglés", () => {
    for (const s of CONTACT_SUBJECTS) {
      expect(CONTACT_SUBJECT_EN[s]).toBeTruthy();
    }
  });

  it("los atajos de URL apuntan a asuntos válidos", () => {
    for (const s of Object.values(CONTACT_SUBJECT_KEYS)) {
      expect(CONTACT_SUBJECTS).toContain(s);
    }
  });
});

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
