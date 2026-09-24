"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { IconButton } from "@/components/admin/form-fields";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { cn } from "@/lib/cn";

export interface NewsRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null; // ISO
}

const STATUS_STYLES: Record<NewsRow["status"], { label: string; cls: string }> = {
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
    if (!window.confirm(`¿Eliminar la noticia «${row.title}»?`)) return;
    try {
      await sendJson(`/api/admin/news/${row.id}`, "DELETE");
      toast.success("Noticia eliminada");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"));
    }
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
          <th scope="col" className="w-[130px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const status = STATUS_STYLES[row.status];
          return (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="max-w-[420px] px-6 py-3 text-sm font-medium text-gray-900">
                {row.title}
              </td>
              <td className="px-4 py-3 text-[13px] text-gray-600">{row.category}</td>
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
              <td className="px-4 py-3 text-[13px] text-gray-500">{formatDate(row.publishedAt)}</td>
              <td className="px-6 py-3">
                <div className="flex gap-1">
                  <Link
                    href={`/backstage/news/${row.id}`}
                    aria-label="Editar"
                    title="Editar"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {row.status === "PUBLISHED" ? (
                    <a
                      href={`/noticias/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ver en la web"
                      title="Ver en la web"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  <IconButton label="Eliminar" danger onClick={() => handleDelete(row)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
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
