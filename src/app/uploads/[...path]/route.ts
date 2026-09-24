import { readFile, stat } from "node:fs/promises";
import { mimeForUpload, uploadPathFromSegments } from "@/lib/uploads";

/**
 * Sirve los archivos subidos desde el panel (/uploads/…), que viven fuera de
 * public/ (ver src/lib/uploads.ts).
 *
 * - Solo extensiones de la lista cerrada; el Content-Type lo decide el
 *   servidor, nunca el nombre ni el contenido.
 * - Cabeceras defensivas: nosniff y una CSP «sandbox» que impide ejecutar
 *   nada aunque se colase un documento activo.
 * - Los nombres son únicos (sufijo aleatorio), así que se cachean un año.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } },
) {
  const fullPath = uploadPathFromSegments(params.path ?? []);
  const mime = fullPath ? mimeForUpload(fullPath) : null;
  if (!fullPath || !mime) {
    return new Response("No encontrado", { status: 404 });
  }

  try {
    const info = await stat(fullPath);
    if (!info.isFile()) return new Response("No encontrado", { status: 404 });
    const data = await readFile(fullPath);
    const isInline = mime.startsWith("image/") || mime === "application/pdf" || mime.startsWith("audio/") || mime.startsWith("video/");
    return new Response(data, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // (Salvo en PDF: Chrome no pinta un PDF servido con CSP sandbox.)
        ...(mime === "application/pdf"
          ? {}
          : {
              "Content-Security-Policy":
                "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
            }),
        // Los documentos de ofimática se descargan en vez de abrirse.
        ...(isInline ? {} : { "Content-Disposition": "attachment" }),
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
