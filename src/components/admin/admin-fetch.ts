"use client";

import { MAX_UPLOAD_MB, type UploadFolder } from "@/lib/admin-options";

/**
 * Llamadas del panel a sus API: JSON de ida y vuelta y error legible (el
 * campo `error` que devuelven las routes) para mostrarlo en un toast.
 */

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: Record<string, unknown>,
  ) {
    super(message);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      res.status === 401
        ? "Tu sesión ha caducado: vuelve a iniciar sesión"
        : typeof json.error === "string"
          ? json.error
          : `Error ${res.status}`;
    throw new AdminApiError(message, res.status, json);
  }
  return json as T;
}

/** Petición JSON (POST/PUT/PATCH/DELETE) a una API del panel. */
export async function sendJson<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export interface UploadedFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

/**
 * Sube un archivo a Archivos (/api/admin/files): queda registrado y
 * reutilizable. `only: "image"` para portadas, carteles e imágenes.
 */
export async function uploadFile(
  file: File,
  options: { only?: "image" | "document" | "audio" | "video"; folder?: UploadFolder } = {},
): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new AdminApiError(`«${file.name}» supera los ${MAX_UPLOAD_MB} MB`, 413, {});
  }
  const form = new FormData();
  form.append("file", file);
  if (options.only) form.append("only", options.only);
  if (options.folder) form.append("folder", options.folder);
  const res = await fetch("/api/admin/files", { method: "POST", body: form });
  const json = await parseResponse<{ item: UploadedFile }>(res);
  return json.item;
}

/** Texto de error de cualquier excepción. */
export function errorMessage(err: unknown, fallback = "No se pudo completar la operación") {
  return err instanceof Error && err.message ? err.message : fallback;
}
