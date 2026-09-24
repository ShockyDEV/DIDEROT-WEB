// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  configuredOrigins,
  errorResponse,
  isSameOriginRequest,
  originOf,
  parseId,
  readJsonBody,
  zodMessage,
} from "@/lib/admin-http";

const SITE = ["https://diderot.usal.es"];

function headers(init: Record<string, string>) {
  return new Headers(init);
}

describe("isSameOriginRequest (protección CSRF de las mutaciones)", () => {
  it("las lecturas siempre pasan", () => {
    expect(isSameOriginRequest("GET", headers({ origin: "https://evil.example" }), SITE)).toBe(true);
    expect(isSameOriginRequest("HEAD", headers({}), SITE)).toBe(true);
  });

  it("acepta el origen configurado y el Host de la propia petición", () => {
    expect(
      isSameOriginRequest("POST", headers({ origin: "https://diderot.usal.es", host: "127.0.0.1:3000" }), SITE),
    ).toBe(true);
    expect(
      isSameOriginRequest("DELETE", headers({ origin: "http://localhost:3200", host: "localhost:3200" }), SITE),
    ).toBe(true);
    // Detrás del proxy inverso: X-Forwarded-Host
    expect(
      isSameOriginRequest(
        "PATCH",
        headers({ origin: "https://web.example", host: "app:3000", "x-forwarded-host": "web.example" }),
        [],
      ),
    ).toBe(true);
  });

  it("rechaza otros sitios, incluidos subdominios hermanos (same-site)", () => {
    expect(
      isSameOriginRequest("POST", headers({ origin: "https://evil.example", host: "diderot.usal.es" }), SITE),
    ).toBe(false);
    expect(
      isSameOriginRequest("PUT", headers({ origin: "https://otra.usal.es", host: "diderot.usal.es" }), SITE),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        "POST",
        headers({ "sec-fetch-site": "same-site", origin: "https://diderot.usal.es" }),
        SITE,
      ),
    ).toBe(false);
    expect(
      isSameOriginRequest("POST", headers({ "sec-fetch-site": "cross-site" }), SITE),
    ).toBe(false);
  });

  it("Origin «null» o ilegible → fuera", () => {
    expect(isSameOriginRequest("POST", headers({ origin: "null", host: "diderot.usal.es" }), SITE)).toBe(false);
    expect(isSameOriginRequest("POST", headers({ origin: "nada", host: "diderot.usal.es" }), SITE)).toBe(false);
  });

  it("sin Origin se usa el Referer", () => {
    expect(
      isSameOriginRequest("POST", headers({ referer: "https://diderot.usal.es/backstage", host: "x" }), SITE),
    ).toBe(true);
    expect(
      isSameOriginRequest("POST", headers({ referer: "https://evil.example/page", host: "diderot.usal.es" }), SITE),
    ).toBe(false);
  });

  it("sin cabeceras de navegador (curl, scripts) no hay riesgo de CSRF", () => {
    expect(isSameOriginRequest("POST", headers({ host: "diderot.usal.es" }), SITE)).toBe(true);
  });
});

describe("orígenes configurados", () => {
  it("toma NEXTAUTH_URL, AUTH_URL y SITE_URL (solo http/https)", () => {
    expect(
      configuredOrigins({
        NEXTAUTH_URL: "https://diderot.usal.es/api/auth",
        SITE_URL: "http://localhost:3200",
        AUTH_URL: "javascript:alert(1)",
      }),
    ).toEqual(["https://diderot.usal.es", "http://localhost:3200"]);
    expect(originOf("no es una url")).toBeNull();
  });
});

describe("parseId", () => {
  it("acepta cuid y rechaza rutas o inyecciones", () => {
    expect(parseId("clx8k2m9a0000abcdefghijkl")).toBe("clx8k2m9a0000abcdefghijkl");
    expect(parseId("../../etc/passwd")).toBeNull();
    expect(parseId("a b")).toBeNull();
    expect(parseId("")).toBeNull();
    expect(parseId("x".repeat(65))).toBeNull();
    expect(parseId(undefined)).toBeNull();
  });
});

describe("readJsonBody", () => {
  const schema = z.object({ title: z.string().min(3, "Título demasiado corto") });

  function post(body: string, extra: Record<string, string> = {}) {
    return new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json", ...extra },
      body,
    });
  }

  it("devuelve los datos validados", async () => {
    const r = await readJsonBody(post(JSON.stringify({ title: "Hola mundo" })), schema);
    expect(r.data).toEqual({ title: "Hola mundo" });
  });

  it("JSON roto → 400", async () => {
    const r = await readJsonBody(post("{no json"), schema);
    expect(r.response?.status).toBe(400);
  });

  it("errores de validación → 400 con el mensaje del esquema", async () => {
    const r = await readJsonBody(post(JSON.stringify({ title: "a" })), schema);
    expect(r.response?.status).toBe(400);
    expect(await r.response?.json()).toEqual({ error: "Título demasiado corto" });
  });

  it("cuerpo demasiado grande → 413 (sin leerlo entero)", async () => {
    const big = JSON.stringify({ title: "x".repeat(5000) });
    const r = await readJsonBody(post(big), schema, 1024);
    expect(r.response?.status).toBe(413);
  });
});

describe("zodMessage", () => {
  it("traduce los mensajes genéricos de zod con el nombre del campo", () => {
    const r = z.object({ year: z.number() }).safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) expect(zodMessage(r.error)).toBe("Falta el campo «año»");
  });

  it("respeta los mensajes propios", () => {
    const r = z.object({ doi: z.string().min(5, "DOI no válido") }).safeParse({ doi: "x" });
    if (!r.success) expect(zodMessage(r.error)).toBe("DOI no válido");
  });
});

describe("errorResponse", () => {
  it("no filtra detalles internos al cliente", async () => {
    const original = console.error;
    console.error = () => undefined; // el detalle va al log del servidor
    try {
      const res = errorResponse(new Error("column \"secreto\" does not exist"), "test");
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(JSON.stringify(body)).not.toContain("secreto");
    } finally {
      console.error = original;
    }
  });

  it("duplicado de Prisma (P2002) → 409; no encontrado (P2025) → 404", () => {
    expect(errorResponse({ code: "P2002" }, "t").status).toBe(409);
    expect(errorResponse({ code: "P2025" }, "t").status).toBe(404);
  });
});
