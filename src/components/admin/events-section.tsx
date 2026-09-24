"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { cn } from "@/lib/cn";

const inputClass =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";
const labelClass = "text-[13px] font-medium text-gray-700";

export interface EventRow {
  id: string;
  title: string;
  type: string;
  startsAt: string; // ISO
  endsAt: string | null;
  location: string | null;
  url: string | null;
  image: string | null;
  newsSlug: string | null;
  status: "UPCOMING" | "PAST" | "CANCELLED";
}

export interface NewsOption {
  slug: string;
  title: string;
}

const STATUS_STYLES: Record<
  EventRow["status"],
  { label: string; cls: string }
> = {
  UPCOMING: { label: "Próximo", cls: "bg-[#DBEAFE] text-[#1D4ED8]" },
  PAST: { label: "Celebrado", cls: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Cancelado", cls: "bg-[#FEF2F2] text-[#B42318]" },
};

interface FormState {
  id?: string;
  title: string;
  type: string;
  date: string; // yyyy-mm-dd
  location: string;
  url: string;
  image: string;
  newsSlug: string;
  status: EventRow["status"];
}

const EMPTY: FormState = {
  title: "",
  type: "Congreso",
  date: "",
  location: "",
  url: "",
  image: "",
  newsSlug: "",
  status: "UPCOMING",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(".", "");
}

export function EventsSection({
  rows,
  newsOptions,
}: Readonly<{ rows: EventRow[]; newsOptions: NewsOption[] }>) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/files", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen");
      setForm((f) => (f ? { ...f, image: json.item?.url ?? "" } : f));
      toast.success("Imagen subida");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo subir la imagen",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    if (form.title.trim().length < 3 || !form.date) {
      toast.error("Título y fecha son obligatorios");
      return;
    }
    if (!form.image.trim()) {
      toast.error(
        "Cada evento necesita una imagen: súbela o pega su URL antes de guardar",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        startsAt: new Date(`${form.date}T09:00:00Z`).toISOString(),
        endsAt: null,
        location: form.location || null,
        url: form.url || "",
        image: form.image.trim(),
        newsSlug: form.newsSlug || null,
        status: form.status,
      };
      const res = await fetch(
        form.id ? `/api/admin/events/${form.id}` : "/api/admin/events",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
      toast.success("Guardado");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: EventRow) {
    if (!window.confirm(`¿Eliminar el evento «${row.title}»?`)) return;
    const res = await fetch(`/api/admin/events/${row.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Evento eliminado");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Button variant="primary" onClick={() => setForm(EMPTY)}>
          + Nuevo evento
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Eventos ({rows.length})
          </h3>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-t border-gray-100">
              <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Evento
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Tipo
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Lugar
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Estado
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
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {row.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-diderot-pale px-2.5 py-0.5 text-xs font-medium text-diderot-indigo">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-500">
                    {formatDate(row.startsAt)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-600">
                    {row.location ?? "—"}
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
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() =>
                          setForm({
                            id: row.id,
                            title: row.title,
                            type: row.type,
                            date: row.startsAt.slice(0, 10),
                            location: row.location ?? "",
                            url: row.url ?? "",
                            image: row.image ?? "",
                            newsSlug: row.newsSlug ?? "",
                            status: row.status,
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
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
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay eventos todavía.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {form ? (
        <Modal
          title={form.id ? "Editar evento" : "Nuevo evento"}
          onClose={() => setForm(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="e-title" className={labelClass}>
                Título
              </label>
              <input
                id="e-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="e-type" className={labelClass}>
                  Tipo
                </label>
                <select
                  id="e-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={inputClass}
                >
                  <option>Congreso</option>
                  <option>Seminario</option>
                  <option>Jornada</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="e-date" className={labelClass}>
                  Fecha
                </label>
                <input
                  id="e-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="e-location" className={labelClass}>
                  Lugar
                </label>
                <input
                  id="e-location"
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="e-status" className={labelClass}>
                  Estado
                </label>
                <select
                  id="e-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as EventRow["status"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="UPCOMING">Próximo</option>
                  <option value="PAST">Celebrado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
                <p className="text-xs text-gray-500">
                  En la web, «próximo» o «celebrado» se calcula solo a partir
                  de las fechas; este campo únicamente hace falta para
                  «Cancelado».
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="e-url" className={labelClass}>
                Web del evento (opcional)
              </label>
              <input
                id="e-url"
                type="url"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Imagen del evento (obligatoria)</label>
              <div className="flex items-center gap-3">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt=""
                    className="h-16 w-24 flex-none rounded-md border border-gray-200 object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-24 flex-none items-center justify-center rounded-md border border-dashed border-gray-300 text-[11px] text-gray-400">
                    Sin imagen
                  </span>
                )}
                <label
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50",
                    uploading && "pointer-events-none opacity-60",
                  )}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploading
                    ? "Subiendo…"
                    : form.image
                      ? "Cambiar imagen"
                      : "Subir imagen"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <input
                id="e-image"
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="…o pega una URL (/uploads/…)"
                className={inputClass}
              />
              <p className="text-xs text-gray-500">
                Se muestra en la agenda, en el destacado y junto a los eventos
                celebrados; no se puede guardar un evento sin imagen.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="e-news" className={labelClass}>
                Crónica asociada (noticia, opcional)
              </label>
              <select
                id="e-news"
                value={form.newsSlug}
                onChange={(e) =>
                  setForm({ ...form, newsSlug: e.target.value })
                }
                className={inputClass}
              >
                <option value="">— Sin crónica —</option>
                {newsOptions.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.title.length > 90 ? `${n.title.slice(0, 90)}…` : n.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                En la web pública, el evento mostrará «Leer la crónica» con el
                enlace a esa noticia.
              </p>
            </div>
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
