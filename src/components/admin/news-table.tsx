"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/cn";

export interface NewsRow {
  id: string;
  title: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** Noticia interna: solo visible en la intranet. */
  internal: boolean;
  publishedAt: string | null; // ISO
}

const STATUS_STYLES: Record<NewsRow["status"], { label: string; cls: string }> =
  {
    PUBLISHED: { label: "Publicada", cls: "bg-[#DCFCE7] text-[#15803D]" },
    DRAFT: { label: "Borrador", cls: "bg-gray-100 text-gray-700" },
    ARCHIVED: { label: "Archivada", cls: "bg-[#FEF9C3] text-[#A16207]" },
  };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function NewsTable({ rows }: Readonly<{ rows: NewsRow[] }>) {
  const router = useRouter();

  async function handleDelete(row: NewsRow) {
    const ok = window.confirm(`¿Eliminar la noticia «${row.title}»?`);
    if (!ok) return;
    const res = await fetch(`/api/admin/news/${row.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Noticia eliminada");
    router.refresh();
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-t border-gray-100">
          <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
            Título
          </th>
          <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
            Categoría
          </th>
          <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
            Estado
          </th>
          <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
            Publicación
          </th>
          <th scope="col" className="w-[110px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const status = STATUS_STYLES[row.status];
          return (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="max-w-[380px] px-6 py-3 text-sm font-medium text-gray-900">
                {row.title}
                {row.internal ? (
                  <span className="ml-2 inline-flex rounded-full bg-[#E0E7FF] px-2 py-0.5 text-[11px] font-semibold text-[#3730A3]">
                    Interna
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-[13px] text-gray-600">
                {row.category}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    status.cls,
                  )}
                >
                  {status.label}
                </span>
              </td>
              <td className="px-4 py-3 text-[13px] text-gray-500">
                {formatDate(row.publishedAt)}
              </td>
              <td className="px-6 py-3">
                <div className="flex gap-1">
                  <Link
                    href={`/backstage/news/${row.id}`}
                    aria-label="Editar"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
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
              No hay noticias todavía. Crea la primera con «+ Nueva noticia».
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}
