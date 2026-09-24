"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Reply, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { cn } from "@/lib/cn";

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: "NEW" | "REPLIED";
  createdAt: string; // ISO
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "hace un momento";
  if (hours < 24) return `hace ${hours} h`;
  if (hours < 48) return "ayer";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" })
    .format(date)
    .replace(".", "");
}

export function MessagesSection({
  rows,
  emailEnabled,
  forwardTo,
}: Readonly<{ rows: MessageRow[]; emailEnabled: boolean; forwardTo: string }>) {
  const router = useRouter();
  const [viewing, setViewing] = useState<MessageRow | null>(null);

  async function setStatus(row: MessageRow, status: MessageRow["status"]) {
    try {
      await sendJson(`/api/admin/messages/${row.id}`, "PUT", { status });
      toast.success(status === "REPLIED" ? "Marcado como respondido" : "Marcado como pendiente");
      setViewing(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo actualizar"));
    }
  }

  async function handleDelete(row: MessageRow) {
    if (!window.confirm(`¿Eliminar el mensaje de ${row.name}?`)) return;
    try {
      await sendJson(`/api/admin/messages/${row.id}`, "DELETE");
      toast.success("Mensaje eliminado");
      setViewing(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-baseline justify-between p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Mensajes de contacto ({rows.length})
          </h3>
          <p className="text-xs text-gray-500">
            {emailEnabled
              ? `Los mensajes del formulario llegan también por correo a ${forwardTo}`
              : "El envío por correo no está configurado (RESEND_API_KEY): los mensajes solo se guardan aquí"}
          </p>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-t border-gray-100">
              <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                De
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Asunto
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Estado
              </th>
              <th scope="col" className="w-[130px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isNew = row.status === "NEW";
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-gray-100",
                    isNew && "bg-[#F8FAFD]",
                  )}
                >
                  <td className="px-6 py-3">
                    <p
                      className={cn(
                        "text-sm text-gray-900",
                        isNew ? "font-semibold" : "font-medium text-gray-700",
                      )}
                    >
                      {row.name}
                    </p>
                    <p className="text-xs text-gray-500">{row.email}</p>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-[13px]",
                      isNew ? "text-gray-700" : "text-gray-600",
                    )}
                  >
                    {row.subject}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {formatRelative(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        isNew
                          ? "bg-[#DBEAFE] text-[#1D4ED8]"
                          : "bg-[#DCFCE7] text-[#15803D]",
                      )}
                    >
                      {isNew ? "Nuevo" : "Respondido"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Leer mensaje"
                        onClick={() => setViewing(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <a
                        aria-label="Responder"
                        href={`mailto:${row.email}?subject=${encodeURIComponent(`RE: ${row.subject}`)}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Reply className="h-4 w-4" aria-hidden="true" />
                      </a>
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
                  No hay mensajes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <Modal
          title={`Mensaje de ${viewing.name}`}
          onClose={() => setViewing(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  De
                </p>
                <p className="mt-1 text-gray-900">{viewing.name}</p>
                <p className="text-gray-500">{viewing.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Asunto
                </p>
                <p className="mt-1 text-gray-900">{viewing.subject}</p>
                <p className="text-gray-500">
                  {new Date(viewing.createdAt).toLocaleString("es-ES")}
                </p>
              </div>
            </div>
            <div className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
              {viewing.body}
            </div>
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              {viewing.status === "NEW" ? (
                <Button variant="primary" onClick={() => setStatus(viewing, "REPLIED")}>
                  Marcar como respondido
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setStatus(viewing, "NEW")}>
                  Marcar como pendiente
                </Button>
              )}
              <a
                href={`mailto:${viewing.email}?subject=${encodeURIComponent(`RE: ${viewing.subject}`)}`}
                className="text-sm font-medium text-diderot-violet hover:underline"
              >
                Responder por email →
              </a>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
