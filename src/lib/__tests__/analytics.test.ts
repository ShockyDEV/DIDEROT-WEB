// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  dayKey,
  isBot,
  normalizeTrackedPath,
  prefersNoTracking,
  referrerOrigin,
  trackInputSchema,
  visitorId,
} from "@/lib/analytics";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

describe("isBot", () => {
  it("las personas no son bots", () => {
    expect(isBot(CHROME)).toBe(false);
    expect(
      isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"),
    ).toBe(false);
  });

  it("buscadores, monitores, scripts y clientes sin User-Agent sí", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "curl/8.4.0",
      "python-requests/2.31.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)",
      "",
      null,
    ]) {
      expect(isBot(ua)).toBe(true);
    }
  });
});

describe("normalizeTrackedPath", () => {
  it("rutas públicas: sin query, sin ancla y sin barra final", () => {
    expect(normalizeTrackedPath("/")).toBe("/");
    expect(normalizeTrackedPath("/noticias/?page=2#arriba")).toBe("/noticias");
    expect(normalizeTrackedPath("/en/grupo")).toBe("/en/grupo");
    expect(normalizeTrackedPath("/n%C3%BAmero")).toBe("/número");
  });

  it("no cuenta el panel, la API, el login ni los recursos", () => {
    for (const p of ["/backstage", "/backstage/news", "/api/track", "/auth/signin", "/_next/static/x.js", "/en/backstage", "/uploads/a.jpg"]) {
      expect(normalizeTrackedPath(p)).toBeNull();
    }
  });

  it("rechaza rutas absolutas, protocolo-relativas o raras", () => {
    for (const p of ["https://evil.example/", "//evil.example", "noticias", "/a/../b", "/%E0%A4%A", "/a\\b", "/" + "x".repeat(400)]) {
      expect(normalizeTrackedPath(p)).toBeNull();
    }
  });
});

describe("referrerOrigin", () => {
  it("guarda solo el origen (nunca la URL completa)", () => {
    expect(referrerOrigin("https://www.google.com/search?q=diderot+usal")).toBe("https://www.google.com");
  });

  it("la navegación interna y lo que no es http(s) no cuentan", () => {
    expect(referrerOrigin("https://diderot.usal.es/grupo", ["diderot.usal.es"])).toBeNull();
    expect(referrerOrigin("android-app://com.google.android.gm/")).toBeNull();
    expect(referrerOrigin("")).toBeNull();
    expect(referrerOrigin(undefined)).toBeNull();
  });
});

describe("visitorId", () => {
  it("hash de 16 caracteres, estable en el día y distinto al siguiente", () => {
    const a = visitorId("203.0.113.7", CHROME, "2026-09-24", "secreto");
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(visitorId("203.0.113.7", CHROME, "2026-09-24", "secreto")).toBe(a);
    expect(visitorId("203.0.113.7", CHROME, "2026-09-25", "secreto")).not.toBe(a);
    expect(visitorId("203.0.113.8", CHROME, "2026-09-24", "secreto")).not.toBe(a);
    expect(visitorId("203.0.113.7", CHROME, "2026-09-24", "otro-secreto")).not.toBe(a);
  });

  it("dayKey es la fecha UTC", () => {
    expect(dayKey(new Date("2026-09-24T23:30:00Z"))).toBe("2026-09-24");
  });
});

describe("entrada y privacidad", () => {
  it("respeta Do Not Track y Global Privacy Control", () => {
    expect(prefersNoTracking(new Headers({ dnt: "1" }))).toBe(true);
    expect(prefersNoTracking(new Headers({ "sec-gpc": "1" }))).toBe(true);
    expect(prefersNoTracking(new Headers({}))).toBe(false);
  });

  it("valida el cuerpo del beacon", () => {
    expect(trackInputSchema.safeParse({ path: "/grupo" }).success).toBe(true);
    expect(trackInputSchema.safeParse({ path: "/" + "x".repeat(400) }).success).toBe(false);
    expect(trackInputSchema.safeParse({ referrer: "https://x" }).success).toBe(false);
  });
});
