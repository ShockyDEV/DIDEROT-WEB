// @vitest-environment node
// (jsdom no implementa File.arrayBuffer; la subida se ejecuta en Node.)
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// UPLOADS_DIR se lee al importar el módulo: carpeta temporal antes de cargarlo.
const tmp = mkdtempSync(path.join(os.tmpdir(), "diderot-uploads-"));
vi.stubEnv("UPLOADS_DIR", tmp);

// Imágenes reales (se recodifican al subir); se generan en beforeAll.
let PNG: Buffer;
let JPG: Buffer;
let JPG_GPS: Buffer;
// Cabecera PNG válida pero imagen truncada: pasa la firma y falla al decodificar.
const PNG_ROTO = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const PDF = Buffer.from("%PDF-1.7\n%âãÏÓ\n");
const HTML = Buffer.from("<html><script>alert(1)</script></html>");
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

const file = (bytes: Buffer, name: string, type = "") =>
  new File([new Uint8Array(bytes)], name, { type });

type UploadsModule = typeof import("@/lib/uploads");
let mod: UploadsModule;

beforeAll(async () => {
  const base = sharp({ create: { width: 8, height: 8, channels: 3, background: "#29235c" } });
  PNG = await base.clone().png().toBuffer();
  JPG = await base.clone().jpeg().toBuffer();
  // JPEG con metadatos EXIF (simula la foto de un móvil)
  JPG_GPS = await base.clone().jpeg().withMetadata({ exif: { IFD0: { Artist: "Autor", Copyright: "GPS 40.96 -5.66" } } }).toBuffer();
  mod = await import("@/lib/uploads");
});

afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(tmp, { recursive: true, force: true });
});

describe("saveUpload", () => {
  it("guarda una imagen válida con nombre generado por el servidor", async () => {
    const saved = await mod.saveUpload(file(PNG, "Foto Grupo.PNG", "image/png"), {
      subdir: "members",
      only: ["image"],
    });
    expect(saved.url).toMatch(/^\/uploads\/members\/foto-grupo-[a-z0-9]+\.png$/);
    expect(saved.kind).toBe("image");
    const onDisk = path.join(tmp, "members", path.basename(saved.url));
    const meta = await sharp(readFileSync(onDisk)).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(8);
  });

  it("normaliza .jpeg a .jpg y acepta PDF como documento", async () => {
    const jpg = await mod.saveUpload(file(JPG, "cartel.jpeg", "image/jpeg"));
    expect(jpg.url.endsWith(".jpg")).toBe(true);
    const pdf = await mod.saveUpload(file(PDF, "programa.pdf", "application/pdf"));
    expect(pdf.kind).toBe("document");
  });

  it("elimina los metadatos EXIF de las fotos", async () => {
    expect((await sharp(JPG_GPS).metadata()).exif).toBeDefined();
    const saved = await mod.saveUpload(file(JPG_GPS, "movil.jpg", "image/jpeg"));
    const meta = await sharp(readFileSync(path.join(tmp, path.basename(saved.url)))).metadata();
    expect(meta.exif).toBeUndefined();
  });

  it("rechaza una imagen dañada aunque la cabecera sea válida", async () => {
    await expect(mod.saveUpload(file(PNG_ROTO, "rota.png", "image/png"))).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza SVG y HTML aunque se declaren como imagen", async () => {
    await expect(mod.saveUpload(file(SVG, "logo.svg", "image/svg+xml"))).rejects.toMatchObject({ status: 415 });
    await expect(mod.saveUpload(file(HTML, "x.html", "text/html"))).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza un HTML disfrazado con extensión de imagen (firma no coincide)", async () => {
    await expect(mod.saveUpload(file(HTML, "foto.png", "image/png"))).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza MIME declarado que no cuadra con la extensión", async () => {
    await expect(mod.saveUpload(file(PNG, "foto.png", "text/html"))).rejects.toMatchObject({ status: 415 });
  });

  it("respeta la restricción de tipo (only)", async () => {
    await expect(
      mod.saveUpload(file(PDF, "doc.pdf", "application/pdf"), { only: ["image"] }),
    ).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza archivos vacíos y demasiado grandes", async () => {
    await expect(mod.saveUpload(file(Buffer.alloc(0), "vacio.png", "image/png"))).rejects.toMatchObject({ status: 400 });
    const big = Buffer.concat([PNG, Buffer.alloc(mod.MAX_UPLOAD_BYTES)]);
    await expect(mod.saveUpload(file(big, "enorme.png", "image/png"))).rejects.toMatchObject({ status: 413 });
  });
});

describe("rutas de uploads", () => {
  it("resuelve rutas válidas dentro de UPLOADS_DIR", () => {
    expect(mod.uploadPathFromSegments(["members", "a.png"])).toBe(path.resolve(tmp, "members", "a.png"));
    expect(mod.uploadPathFromUrl("/uploads/a%20b.png")).toBe(path.resolve(tmp, "a b.png"));
  });

  it("bloquea path traversal y rutas raras", () => {
    expect(mod.uploadPathFromSegments([".."])).toBeNull();
    expect(mod.uploadPathFromSegments(["..", "etc", "passwd"])).toBeNull();
    expect(mod.uploadPathFromSegments(["a\\..\\b"])).toBeNull();
    expect(mod.uploadPathFromSegments([])).toBeNull();
    expect(mod.uploadPathFromUrl("/uploads/..%2F..%2Fetc%2Fpasswd")).toBeNull();
    expect(mod.uploadPathFromUrl("/otra/cosa.png")).toBeNull();
  });

  it("solo sirve extensiones de la lista cerrada", () => {
    expect(mod.mimeForUpload("x.png")).toBe("image/png");
    expect(mod.mimeForUpload("x.svg")).toBeNull();
    expect(mod.mimeForUpload("x.html")).toBeNull();
    expect(mod.mimeForUpload("x")).toBeNull();
  });
});
