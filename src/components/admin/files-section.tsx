"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Presentation,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { IconButton, inputClass } from "@/components/admin/form-fields";
import {
  AdminApiError,
  errorMessage,
  sendJson,
  uploadFile,
} from "@/components/admin/admin-fetch";
import { ACCEPT_ANY_UPLOAD, MAX_UPLOAD_MB } from "@/lib/admin-options";
import { cn } from "@/lib/cn";

export interface FileRow {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string; // ISO
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function typeOf(mime: string): { label: string; icon: typeof FileText } {
  if (mime.startsWith("image/")) return { label: "Imagen", icon: ImageIcon };
  if (mime === "application/pdf") return { label: "PDF", icon: FileText };
  if (mime.includes("word")) return { label: "Word", icon: FileText };
  if (mime.includes("sheet") || mime.includes("excel")) return { label: "Excel", icon: FileSpreadsheet };
  if (mime.includes("presentation") || mime.includes("powerpoint")) {
    return { label: "PowerPoint", icon: Presentation };
  }
  if (mime.startsWith("audio/")) return { label: "Audio", icon: FileAudio };
  if (mime.startsWith("video/")) return { label: "Vídeo", icon: FileVideo };
  return { label: "Documento", icon: FileText };
}

type KindFilter = "" | "image" | "document" | "audio" | "video";

function kindOf(mime: string): Exclude<KindFilter, ""> {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

/**
 * Archivos del panel: subida (validada en el servidor: lista cerrada de
 * tipos, firma real del archivo, 25 MB) y listado con enlace copiable.
 * Al borrar, si el archivo se usa en alguna página se pide confirmación.
 */
export function FilesSection({ rows }: Readonly<{ rows: FileRow[] }>) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!kind || kindOf(r.mimeType) === kind) &&
        (!q || r.filename.toLowerCase().includes(q) || r.url.toLowerCase().includes(q)),
    );
  }, [rows, query, kind]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of list) {
      try {
        await uploadFile(file);
        ok++;
      } catch (err) {
        toast.error(`${file.name}: ${errorMessage(err, "no se pudo subir")}`);
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(ok === 1 ? "Archivo subido" : `${ok} archivos subidos`);
      router.refresh();
    }
  }

  async function copyLink(row: FileRow) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${row.url}`);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  async function handleDelete(row: FileRow) {
    if (!window.confirm(`¿Eliminar «${row.filename}»?`)) return;
    try {
      await sendJson(`/api/admin/files/${row.id}`, "DELETE");
    } catch (err) {
      // En uso: se explica dónde y se pide una segunda confirmación.
      if (err instanceof AdminApiError && err.status === 409) {
        const usages = Array.isArray(err.data.usages) ? (err.data.usages as string[]) : [];
        const detail = usages.length > 0 ? `\n\n· ${usages.join("\n· ")}` : "";
        if (
          !window.confirm(
            `Este archivo se está usando:${detail}\n\nSi lo eliminas, esas páginas mostrarán una imagen o un enlace roto. ¿Eliminarlo igualmente?`,
          )
        ) {
          return;
        }
        try {
          await sendJson(`/api/admin/files/${row.id}?force=1`, "DELETE");
        } catch (again) {
          toast.error(errorMessage(again, "No se pudo eliminar"));
          return;
        }
      } else {
        toast.error(errorMessage(err, "No se pudo eliminar"));
        return;
      }
    }
    toast.success("Archivo eliminado");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Zona de subida */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        disabled={uploading}
        className={cn(
          "flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed bg-white p-9 text-center transition-colors",
          dragOver ? "border-diderot-violet bg-diderot-pale" : "border-gray-300",
          uploading && "opacity-60",
        )}
      >
        <Upload className="h-[26px] w-[26px] text-gray-500" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-700">
          {uploading ? "Subiendo…" : "Arrastra archivos aquí o haz clic para subir"}
        </p>
        <p className="max-w-[60ch] text-xs text-gray-500">
          Imágenes (JPG, PNG, WebP, GIF), PDF, Office (Word, Excel, PowerPoint), audio
          (MP3, OGG, WAV) y vídeo (MP4) · máx. {MAX_UPLOAD_MB} MB por archivo. Las
          imágenes se optimizan y se les quitan los datos de ubicación al subirlas.
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        tabIndex={-1}
        accept={ACCEPT_ANY_UPLOAD}
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Archivos ({filtered.length}
            {filtered.length !== rows.length ? ` de ${rows.length}` : ""})
          </h3>
          <div className="flex flex-wrap gap-2.5">
            <div className="relative w-[240px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre…"
                aria-label="Buscar archivos"
                className={cn(inputClass, "h-9 pl-9")}
              />
            </div>
            <select
              aria-label="Filtrar por tipo"
              value={kind}
              onChange={(e) => setKind(e.target.value as KindFilter)}
              className={cn(inputClass, "h-9 w-auto")}
            >
              <option value="">Todos los tipos</option>
              <option value="image">Imágenes</option>
              <option value="document">Documentos</option>
              <option value="audio">Audio</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-t border-gray-100">
              <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Nombre
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Tipo
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Tamaño
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Subido
              </th>
              <th scope="col" className="w-[96px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const { label, icon: Icon } = typeOf(row.mimeType);
              const isImage = row.mimeType.startsWith("image/");
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.url}
                          alt=""
                          loading="lazy"
                          className="h-8 w-8 flex-none rounded border border-gray-200 object-cover"
                        />
                      ) : (
                        <Icon className="h-4 w-4 flex-none text-gray-500" aria-hidden="true" />
                      )}
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm font-medium text-gray-900 hover:text-diderot-violet hover:underline"
                      >
                        {row.filename}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">{label}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                    {formatSize(row.size)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <IconButton label="Copiar enlace" onClick={() => copyLink(row)}>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label="Eliminar" danger onClick={() => handleDelete(row)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr className="border-t border-gray-100">
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  {rows.length === 0 ? "No hay archivos todavía." : "Ningún archivo coincide."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
