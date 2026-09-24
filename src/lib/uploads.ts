import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { slugify } from "@/lib/slugify";

/**
 * Archivos subidos desde el panel (Archivos, fotos del equipo, carteles…).
 *
 * Se guardan FUERA de public/ (en UPLOADS_DIR, por defecto ./uploads) y los
 * sirve la ruta /uploads/[...path]. Motivo: en producción Next.js indexa
 * public/ una sola vez al arrancar, así que un archivo subido después daría
 * 404 hasta reiniciar el servidor.
 *
 * Seguridad (la web anterior fue atacada): solo se aceptan tipos de una lista
 * cerrada, comprobando a la vez la extensión, el MIME declarado y la firma
 * real del archivo (magic bytes); el nombre en disco lo genera el servidor.
 * Sin SVG ni HTML: podrían ejecutar scripts en el dominio de la web.
 */

export const UPLOADS_DIR =
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");

/** Tamaño máximo por archivo. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export type UploadKind = "image" | "document" | "audio" | "video";

interface AllowedType {
  mime: string;
  kind: UploadKind;
  /** Comprueba la firma binaria del archivo. */
  sniff: (b: Buffer) => boolean;
}

const startsWith = (b: Buffer, bytes: number[], offset = 0) =>
  bytes.every((byte, i) => b[offset + i] === byte);
const ascii = (b: Buffer, text: string, offset = 0) =>
  b.subarray(offset, offset + text.length).toString("latin1") === text;

const isZip = (b: Buffer) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
const isOle = (b: Buffer) =>
  startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

/** Extensión (en minúsculas, con punto) → tipo permitido. */
export const ALLOWED_UPLOADS: Record<string, AllowedType> = {
  ".jpg": { mime: "image/jpeg", kind: "image", sniff: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  ".jpeg": { mime: "image/jpeg", kind: "image", sniff: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  ".png": { mime: "image/png", kind: "image", sniff: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  ".gif": { mime: "image/gif", kind: "image", sniff: (b) => ascii(b, "GIF87a") || ascii(b, "GIF89a") },
  ".webp": { mime: "image/webp", kind: "image", sniff: (b) => ascii(b, "RIFF") && ascii(b, "WEBP", 8) },
  ".pdf": { mime: "application/pdf", kind: "document", sniff: (b) => ascii(b, "%PDF-") },
  ".doc": { mime: "application/msword", kind: "document", sniff: isOle },
  ".xls": { mime: "application/vnd.ms-excel", kind: "document", sniff: isOle },
  ".ppt": { mime: "application/vnd.ms-powerpoint", kind: "document", sniff: isOle },
  ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "document", sniff: isZip },
  ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "document", sniff: isZip },
  ".pptx": { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "document", sniff: isZip },
  ".mp3": { mime: "audio/mpeg", kind: "audio", sniff: (b) => ascii(b, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
  ".ogg": { mime: "audio/ogg", kind: "audio", sniff: (b) => ascii(b, "OggS") },
  ".wav": { mime: "audio/wav", kind: "audio", sniff: (b) => ascii(b, "RIFF") && ascii(b, "WAVE", 8) },
  ".mp4": { mime: "video/mp4", kind: "video", sniff: (b) => ascii(b, "ftyp", 4) },
};

/** MIME con el que se SIRVE un archivo según su extensión (o null si no se sirve). */
export function mimeForUpload(filename: string): string | null {
  return ALLOWED_UPLOADS[path.extname(filename).toLowerCase()]?.mime ?? null;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export interface SavedUpload {
  /** URL pública (/uploads/…) */
  url: string;
  /** Nombre original, para mostrarlo en el panel */
  originalName: string;
  mimeType: string;
  size: number;
  kind: UploadKind;
}

/**
 * Valida y guarda un archivo subido. Lanza UploadError (con el código HTTP
 * adecuado) si no es válido.
 *
 * @param subdir subcarpeta opcional dentro de uploads (p. ej. "members")
 * @param only   restringe a ciertos tipos (p. ej. ["image"] para fotos)
 */
export async function saveUpload(
  file: File,
  options: { subdir?: string; only?: UploadKind[] } = {},
): Promise<SavedUpload> {
  if (file.size === 0) throw new UploadError("El archivo está vacío", 400);
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("El archivo supera los 25 MB", 413);
  }

  const rawExt = path.extname(file.name); // «.PNG» tal cual, para recortar el nombre
  const ext = rawExt.toLowerCase();
  const allowed = ALLOWED_UPLOADS[ext];
  if (!allowed || (options.only && !options.only.includes(allowed.kind))) {
    throw new UploadError(
      `Tipo de archivo no permitido (${ext || "sin extensión"})`,
      415,
    );
  }
  // El MIME declarado por el navegador debe cuadrar (si lo declara).
  if (file.type && file.type !== allowed.mime && !(ext === ".mp3" && file.type === "audio/mp3")) {
    throw new UploadError("El tipo del archivo no coincide con su extensión", 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!allowed.sniff(buffer)) {
    throw new UploadError(
      "El contenido del archivo no corresponde a su tipo",
      415,
    );
  }

  // Las imágenes (salvo GIF, por la animación) se recodifican: se eliminan
  // los metadatos EXIF (p. ej. la ubicación GPS de una foto hecha con el
  // móvil), se neutralizan ficheros «políglota» y se acotan a 2000 px.
  const data = allowed.kind === "image" && ext !== ".gif" ? await reencodeImage(buffer, ext) : buffer;

  // Nombre seguro y único generado por el servidor.
  const base = slugify(path.basename(file.name, rawExt)).slice(0, 60) || "archivo";
  const filename = `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${ext === ".jpeg" ? ".jpg" : ext}`;
  const subdir = options.subdir ? slugify(options.subdir) : "";

  const dir = path.join(UPLOADS_DIR, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), data);

  return {
    url: `/uploads/${subdir ? `${subdir}/` : ""}${filename}`,
    originalName: file.name,
    mimeType: allowed.mime,
    size: data.length,
    kind: allowed.kind,
  };
}

const MAX_IMAGE_PX = 2000;

async function reencodeImage(buffer: Buffer, ext: string): Promise<Buffer> {
  try {
    const img = sharp(buffer, { failOn: "error" })
      .rotate() // orientación según EXIF antes de descartarlo
      .resize({
        width: MAX_IMAGE_PX,
        height: MAX_IMAGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      });
    if (ext === ".png") return await img.png({ compressionLevel: 9 }).toBuffer();
    if (ext === ".webp") return await img.webp({ quality: 86 }).toBuffer();
    return await img.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  } catch {
    throw new UploadError("La imagen está dañada o no se puede procesar", 415);
  }
}

/**
 * Ruta absoluta en disco de una URL /uploads/… o null si no es válida
 * (bloquea «..», rutas absolutas y cualquier cosa fuera de UPLOADS_DIR).
 */
export function uploadPathFromSegments(segments: string[]): string | null {
  if (segments.length === 0) return null;
  if (segments.some((s) => !s || s === "." || s === ".." || /[\\/\0]/.test(s))) {
    return null;
  }
  const root = path.resolve(UPLOADS_DIR);
  const full = path.resolve(root, ...segments);
  if (!full.startsWith(root + path.sep)) return null;
  return full;
}

/** Ruta en disco de una URL pública /uploads/… (para borrar desde el panel). */
export function uploadPathFromUrl(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const segments = url
    .slice("/uploads/".length)
    .split("/")
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return "";
      }
    });
  return uploadPathFromSegments(segments);
}
