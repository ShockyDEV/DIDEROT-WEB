"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
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
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function typeLabel(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Imagen";
  if (mime.includes("word")) return "Word";
  if (mime.includes("sheet") || mime.includes("excel")) return "Excel";
  return "Documento";
}

export function FilesSection({ rows }: Readonly<{ rows: FileRow[] }>) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/files", {
          method: "POST",
          body: form,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error ?? `No se pudo subir ${file.name}`);
        }
      }
      toast.success(
        list.length === 1 ? "Archivo subido" : `${list.length} archivos subidos`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  async function copyLink(row: FileRow) {
    const url = `${window.location.origin}${row.url}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  async function handleDelete(row: FileRow) {
    if (!window.confirm(`¿Eliminar «${row.filename}»?`)) return;
    const res = await fetch(`/api/admin/files/${row.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Archivo eliminado");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Dropzone */}
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
          upload(e.dataTransfer.files);
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
          {uploading
            ? "Subiendo…"
            : "Arrastra archivos aquí o haz clic para subir"}
        </p>
        <p className="text-xs text-gray-500">
          PDF, imágenes y documentos · máx. 20 MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.svg,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </button>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Archivos ({rows.length})
          </h3>
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
              <th scope="col" className="w-[110px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const Icon = row.mimeType.startsWith("image/")
                ? ImageIcon
                : FileText;
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="h-4 w-4 flex-none text-gray-500"
                        aria-hidden="true"
                      />
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-diderot-violet hover:underline"
                      >
                        {row.filename}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">
                    {typeLabel(row.mimeType)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {formatSize(row.size)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Copiar enlace"
                        onClick={() => copyLink(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => handleDelete(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr className="border-t border-gray-100">
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay archivos todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
