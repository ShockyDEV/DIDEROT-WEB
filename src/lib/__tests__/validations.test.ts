import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/validations";
import { newsInputSchema, accountInputSchema } from "@/lib/admin-schemas";

const validContact = {
  name: "María López",
  email: "mlopez@usal.es",
  subject: "Doctorado",
  message: "Quisiera información sobre el programa de doctorado.",
  gdpr: true,
};

describe("contactSchema", () => {
  it("acepta un mensaje válido", () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true);
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
});

describe("newsInputSchema", () => {
  const valid = {
    title: "Título de prueba",
    content: "<p>Cuerpo</p>",
    category: "Congresos",
    status: "DRAFT",
  };

  it("acepta una noticia mínima válida", () => {
    expect(newsInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza categoría desconocida", () => {
    const r = newsInputSchema.safeParse({ ...valid, category: "Otra" });
    expect(r.success).toBe(false);
  });

  it("rechaza estado desconocido", () => {
    const r = newsInputSchema.safeParse({ ...valid, status: "PENDIENTE" });
    expect(r.success).toBe(false);
  });
});

describe("accountInputSchema", () => {
  it("exige contraseña de al menos 8 caracteres", () => {
    const r = accountInputSchema.safeParse({
      email: "nueva@usal.es",
      name: "Nueva Cuenta",
      password: "corta",
    });
    expect(r.success).toBe(false);
  });

  it("normaliza el email a minúsculas", () => {
    const r = accountInputSchema.parse({
      email: "MiXtO@Usal.es",
      name: "Cuenta Mixta",
      password: "contraseña-larga",
    });
    expect(r.email).toBe("mixto@usal.es");
    expect(r.role).toBe("ADMIN"); // rol por defecto
  });
});
