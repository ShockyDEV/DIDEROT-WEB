import { describe, expect, it } from "vitest";
import {
  accountInputSchema,
  accountUpdateSchema,
  eventInputSchema,
  isMediaUrl,
  isSafeLink,
  memberInputSchema,
  newsInputSchema,
  orcidImportSchema,
  orcidPreviewSchema,
  passwordChangeSchema,
  projectInputSchema,
  publicationInputSchema,
  publicationListQuerySchema,
  publicationPatchSchema,
  siteSettingsSchema,
} from "@/lib/admin-schemas";
import { NEWS_CATEGORIES } from "@/lib/content/news";

const nextYear = new Date().getFullYear() + 1;

function firstError(result: { success: boolean; error?: { issues: Array<{ message: string }> } }) {
  return result.success ? null : result.error?.issues[0]?.message;
}

describe("publicationInputSchema", () => {
  const valid = {
    title: "Artificial Intelligence-Assisted Music Education",
    authors: "Merchán-Sánchez-Jara, J.; González-Gutiérrez, S.",
    year: 2024,
    type: "ARTICLE",
  };

  it("acepta una publicación mínima y rellena los opcionales vacíos con null", () => {
    const r = publicationInputSchema.parse({ ...valid, venue: "", doi: "", url: "  " });
    expect(r.venue).toBeNull();
    expect(r.doi).toBeNull();
    expect(r.url).toBeNull();
  });

  it("normaliza el DOI (sin prefijo, minúsculas)", () => {
    const r = publicationInputSchema.parse({ ...valid, doi: "https://doi.org/10.3390/EDUCSCI14111171" });
    expect(r.doi).toBe("10.3390/educsci14111171");
    expect(publicationInputSchema.parse({ ...valid, doi: "doi: 10.1000/ABC" }).doi).toBe("10.1000/abc");
  });

  it("rechaza DOI mal formados con un mensaje legible", () => {
    const r = publicationInputSchema.safeParse({ ...valid, doi: "no-es-un-doi" });
    expect(firstError(r)).toMatch(/DOI no válido/);
  });

  it("año razonable: de 1900 al año que viene", () => {
    expect(publicationInputSchema.safeParse({ ...valid, year: nextYear }).success).toBe(true);
    expect(publicationInputSchema.safeParse({ ...valid, year: nextYear + 1 }).success).toBe(false);
    expect(publicationInputSchema.safeParse({ ...valid, year: 1899 }).success).toBe(false);
    expect(publicationInputSchema.safeParse({ ...valid, year: "2020" }).success).toBe(true);
    expect(publicationInputSchema.safeParse({ ...valid, year: 2020.5 }).success).toBe(false);
  });

  it("tipo cerrado y enlaces seguros", () => {
    expect(publicationInputSchema.safeParse({ ...valid, type: "PATENT" }).success).toBe(false);
    expect(publicationInputSchema.safeParse({ ...valid, url: "javascript:alert(1)" }).success).toBe(false);
    expect(publicationInputSchema.safeParse({ ...valid, url: "/uploads/informe.pdf" }).success).toBe(true);
    expect(publicationInputSchema.safeParse({ ...valid, url: "//evil.example" }).success).toBe(false);
  });

  it("título y autores obligatorios", () => {
    expect(publicationInputSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
    expect(publicationInputSchema.safeParse({ ...valid, authors: "" }).success).toBe(false);
  });

  it("PATCH parcial: solo lo que llega, y al menos un campo", () => {
    expect(publicationPatchSchema.parse({ published: false })).toEqual({ published: false });
    expect(publicationPatchSchema.safeParse({}).success).toBe(false);
    expect(publicationPatchSchema.safeParse({ year: 1500 }).success).toBe(false);
  });

  it("filtros del listado: lo raro vuelve al valor por defecto", () => {
    expect(publicationListQuerySchema.parse({ page: "3", type: "BOOK", source: "portal" })).toMatchObject({
      page: 3,
      type: "BOOK",
      source: "portal",
    });
    expect(publicationListQuerySchema.parse({ page: "-1", type: "X", year: "abc" })).toMatchObject({
      page: 1,
      type: undefined,
      year: undefined,
    });
  });
});

describe("importación ORCID", () => {
  it("valida los ORCID iD (formato y dígito de control)", () => {
    expect(orcidPreviewSchema.parse({ orcids: ["https://orcid.org/0000-0003-1828-5182"] }).orcids).toEqual([
      "0000-0003-1828-5182",
    ]);
    const bad = orcidPreviewSchema.safeParse({ orcids: ["0000-0003-1828-5183"] });
    expect(firstError(bad)).toMatch(/ORCID iD no válido/);
  });

  it("exige elegir al menos un miembro o un iD", () => {
    expect(orcidPreviewSchema.safeParse({}).success).toBe(false);
    expect(orcidPreviewSchema.safeParse({ memberIds: ["clx8k2m9a0000abcdefghijkl"] }).success).toBe(true);
    expect(orcidPreviewSchema.safeParse({ memberIds: ["../x"] }).success).toBe(false);
  });

  it("la importación solo recibe iD y put-codes válidos", () => {
    expect(
      orcidImportSchema.safeParse({ items: [{ orcid: "0000-0003-1828-5182", putCode: 219341159 }] }).success,
    ).toBe(true);
    expect(orcidImportSchema.safeParse({ items: [] }).success).toBe(false);
    expect(
      orcidImportSchema.safeParse({ items: [{ orcid: "0000-0003-1828-5182", putCode: -1 }] }).success,
    ).toBe(false);
  });
});

describe("memberInputSchema", () => {
  const valid = { name: "Javier Félix Merchán Sánchez-Jara", category: "COORDINATION" };

  it("normaliza el ORCID a su URL canónica", () => {
    expect(memberInputSchema.parse({ ...valid, orcid: "0000-0003-1828-5182" }).orcid).toBe(
      "https://orcid.org/0000-0003-1828-5182",
    );
    expect(memberInputSchema.parse({ ...valid, orcid: "" }).orcid).toBeNull();
    expect(memberInputSchema.safeParse({ ...valid, orcid: "0000-0003-1828-5183" }).success).toBe(false);
  });

  it("perfiles solo http(s): nada de javascript: en un href", () => {
    expect(memberInputSchema.safeParse({ ...valid, website: "javascript:alert(1)" }).success).toBe(false);
    expect(memberInputSchema.safeParse({ ...valid, scholar: "https://scholar.google.com/x" }).success).toBe(true);
    expect(memberInputSchema.safeParse({ ...valid, photo: "/uploads/members/a.webp" }).success).toBe(true);
    expect(memberInputSchema.safeParse({ ...valid, photo: "javascript:x" }).success).toBe(false);
  });

  it("categoría cerrada y correo válido", () => {
    expect(memberInputSchema.safeParse({ ...valid, category: "GROUP" }).success).toBe(false);
    expect(memberInputSchema.safeParse({ ...valid, email: "no-email" }).success).toBe(false);
    expect(memberInputSchema.parse({ ...valid, email: "JM@Usal.es" }).email).toBe("jm@usal.es");
  });
});

describe("projectInputSchema y eventInputSchema", () => {
  it("el año de inicio no puede ser posterior al de fin", () => {
    const base = { title: "Proyecto de prueba" };
    expect(projectInputSchema.safeParse({ ...base, startYear: 2024, endYear: 2022 }).success).toBe(false);
    expect(projectInputSchema.parse({ ...base, startYear: "2021", endYear: "" })).toMatchObject({
      startYear: 2021,
      endYear: null,
    });
  });

  it("tipos de evento de DIDEROT y fin posterior al inicio", () => {
    const base = {
      title: "Seminario de prueba",
      type: "Concierto",
      startsAt: "2026-10-01T09:00:00.000Z",
      status: "UPCOMING",
    };
    expect(eventInputSchema.safeParse(base).success).toBe(true);
    expect(eventInputSchema.safeParse({ ...base, type: "Fiesta" }).success).toBe(false);
    expect(
      eventInputSchema.safeParse({ ...base, endsAt: "2026-09-01T09:00:00.000Z" }).success,
    ).toBe(false);
  });
});

describe("newsInputSchema", () => {
  const valid = {
    title: "Título de prueba",
    content: "<p>Cuerpo</p>",
    category: NEWS_CATEGORIES[0],
    status: "DRAFT",
  };

  it("acepta una noticia mínima válida (sin campo «internal»)", () => {
    const r = newsInputSchema.parse({ ...valid, internal: true });
    expect("internal" in r).toBe(false);
  });

  it("rechaza categoría o estado desconocidos y portadas peligrosas", () => {
    expect(newsInputSchema.safeParse({ ...valid, category: "Otra" }).success).toBe(false);
    expect(newsInputSchema.safeParse({ ...valid, status: "PENDIENTE" }).success).toBe(false);
    expect(newsInputSchema.safeParse({ ...valid, coverImage: "javascript:x" }).success).toBe(false);
  });
});

describe("cuentas y contraseñas", () => {
  it("contraseñas nuevas de al menos 12 caracteres", () => {
    const base = { email: "nueva@usal.es", name: "Nueva Cuenta" };
    expect(accountInputSchema.safeParse({ ...base, password: "corta" }).success).toBe(false);
    expect(accountInputSchema.safeParse({ ...base, password: "once-carac" }).success).toBe(false);
    expect(accountInputSchema.safeParse({ ...base, password: "aaaaaaaaaaaaaa" }).success).toBe(false);
    expect(accountInputSchema.safeParse({ ...base, password: "una-frase-larga" }).success).toBe(true);
  });

  it("normaliza el email a minúsculas y rol ADMIN por defecto", () => {
    const r = accountInputSchema.parse({
      email: "MiXtO@Usal.es",
      name: "Cuenta Mixta",
      password: "contraseña-larga",
    });
    expect(r.email).toBe("mixto@usal.es");
    expect(r.role).toBe("ADMIN");
  });

  it("la contraseña no puede ser el propio correo", () => {
    const r = accountInputSchema.safeParse({
      email: "persona.larga@usal.es",
      name: "Persona",
      password: "persona.larga@usal.es",
    });
    expect(r.success).toBe(false);
  });

  it("cambios de cuenta: al menos un campo, rol cerrado", () => {
    expect(accountUpdateSchema.safeParse({}).success).toBe(false);
    expect(accountUpdateSchema.safeParse({ role: "ROOT" }).success).toBe(false);
    expect(accountUpdateSchema.safeParse({ role: "SUPER_ADMIN" }).success).toBe(true);
  });

  it("cambiar mi contraseña: repetición igual y distinta de la actual", () => {
    const ok = { currentPassword: "vieja-contraseña", newPassword: "nueva-frase-segura", confirmPassword: "nueva-frase-segura" };
    expect(passwordChangeSchema.safeParse(ok).success).toBe(true);
    expect(firstError(passwordChangeSchema.safeParse({ ...ok, confirmPassword: "otra-distinta-xx" }))).toBe(
      "Las dos contraseñas nuevas no coinciden",
    );
    expect(
      passwordChangeSchema.safeParse({ ...ok, newPassword: "vieja-contraseña", confirmPassword: "vieja-contraseña" })
        .success,
    ).toBe(false);
  });
});

describe("datos del sitio", () => {
  it("correo válido y teléfono opcional con formato de teléfono", () => {
    const base = {
      name: "DIDEROT",
      email: "diderot@usal.es",
      seoDescription: "Grupo de Investigación Reconocido de la Universidad de Salamanca.",
    };
    expect(siteSettingsSchema.parse({ ...base, phone: "" }).phone).toBeNull();
    expect(siteSettingsSchema.safeParse({ ...base, phone: "+34 923 29 46 34" }).success).toBe(true);
    expect(siteSettingsSchema.safeParse({ ...base, phone: "<script>" }).success).toBe(false);
    expect(siteSettingsSchema.safeParse({ ...base, email: "no-email" }).success).toBe(false);
  });
});

describe("enlaces", () => {
  it("isSafeLink: http(s), mailto, tel, rutas propias y anclas", () => {
    for (const ok of ["https://usal.es", "/contacto", "#equipo", "mailto:a@usal.es", "tel:+34923294634"]) {
      expect(isSafeLink(ok)).toBe(true);
    }
    for (const bad of ["javascript:alert(1)", "//evil.example", "data:text/html,x", "/\\evil"]) {
      expect(isSafeLink(bad)).toBe(false);
    }
  });

  it("isMediaUrl: archivos propios o http(s)", () => {
    expect(isMediaUrl("/uploads/eventos/cartel.jpg")).toBe(true);
    expect(isMediaUrl("https://example.org/x.jpg")).toBe(true);
    expect(isMediaUrl("//cdn.example/x.jpg")).toBe(false);
    expect(isMediaUrl("data:image/png;base64,AAAA")).toBe(false);
  });
});
