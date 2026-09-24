"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import {
  Field,
  IconButton,
  ImageUploadField,
  inputClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { EVENT_TYPES } from "@/lib/admin-options";
import { cn } from "@/lib/cn";

export interface EventRow {
  id: string;
  title: string;
  titleEn: string | null;
  type: string;
  description: string | null;
  descriptionEn: string | null;
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

const STATUS_STYLES: Record<EventRow["status"], { label: string; cls: string }> = {
  UPCOMING: { label: "Próximo", cls: "bg-[#DBEAFE] text-[#1D4ED8]" },
  PAST: { label: "Celebrado", cls: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Cancelado", cls: "bg-[#FEF2F2] text-[#B42318]" },
};

interface FormState {
  id?: string;
  title: string;
  titleEn: string;
  type: string;
  description: string;
  descriptionEn: string;
  date: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd o ""
  location: string;
  url: string;
  image: string;
  newsSlug: string;
  status: EventRow["status"];
}

function emptyForm(): FormState {
  return {
    title: "",
    titleEn: "",
    type: "Seminario",
    description: "",
    descriptionEn: "",
    date: "",
    endDate: "",
    location: "",
    url: "",
    image: "",
    newsSlug: "",
    status: "UPCOMING",
  };
}

function toForm(row: EventRow): FormState {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.titleEn ?? "",
    type: row.type,
    description: row.description ?? "",
    descriptionEn: row.descriptionEn ?? "",
    date: row.startsAt.slice(0, 10),
    endDate: row.endsAt?.slice(0, 10) ?? "",
    location: row.location ?? "",
    url: row.url ?? "",
    image: row.image ?? "",
    newsSlug: row.newsSlug ?? "",
    status: row.status,
  };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(iso))
    .replace(".", "");
}

/** Las fechas se guardan a las 09:00 UTC (convención heredada del IUCE). */
const toIso = (date: string) => new Date(`${date}T09:00:00Z`).toISOString();

export function EventsSection({
  rows,
  newsOptions,
  openNew = false,
}: Readonly<{ rows: EventRow[]; newsOptions: NewsOption[]; openNew?: boolean }>) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  // «Nuevo evento» desde el Dashboard (?accion=nuevo): una vez, y URL limpia.
  const opened = useRef(false);
  useEffect(() => {
    if (!openNew || opened.current) return;
    opened.current = true;
    setForm(emptyForm());
    router.replace("/backstage/events", { scroll: false });
  }, [openNew, router]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  async function handleSave() {
    if (!form) return;
    if (form.title.trim().length < 3 || !form.date) {
      toast.error("Título y fecha son obligatorios");
      return;
    }
    if (form.endDate && form.endDate < form.date) {
      toast.error("La fecha de fin no puede ser anterior a la de inicio");
      return;
    }
    if (
      !form.image.trim() &&
      !window.confirm(
        "Este evento no tiene cartel ni imagen: en la web se verá un marcador en su lugar. ¿Guardar igualmente?",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        titleEn: form.titleEn,
        type: form.type,
        description: form.description,
        descriptionEn: form.descriptionEn,
        startsAt: toIso(form.date),
        endsAt: form.endDate ? toIso(form.endDate) : null,
        location: form.location,
        url: form.url,
        image: form.image,
        newsSlug: form.newsSlug,
        status: form.status,
      };
      if (form.id) await sendJson(`/api/admin/events/${form.id}`, "PUT", payload);
      else await sendJson("/api/admin/events", "POST", payload);
      toast.success("Evento guardado");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: EventRow) {
    if (!window.confirm(`¿Eliminar el evento «${row.title}»?`)) return;
    try {
      await sendJson(`/api/admin/events/${row.id}`, "DELETE");
      toast.success("Evento eliminado");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"));
    }
  }

  const typeOptions: string[] =
    form && form.type && !(EVENT_TYPES as readonly string[]).includes(form.type)
      ? [...EVENT_TYPES, form.type]
      : [...EVENT_TYPES];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Button variant="primary" className="gap-1.5" onClick={() => setForm(emptyForm())}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo evento
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900">Eventos ({rows.length})</h3>
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
              <th scope="col" className="hidden px-4 py-3 text-left text-[13px] font-medium text-gray-500 lg:table-cell">
                Lugar
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Estado
              </th>
              <th scope="col" className="w-[96px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = STATUS_STYLES[row.status];
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {row.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.image}
                          alt=""
                          className="h-10 w-14 flex-none rounded border border-gray-200 object-cover"
                        />
                      ) : (
                        <span
                          className="flex h-10 w-14 flex-none items-center justify-center rounded border border-dashed border-gray-300 text-gray-400"
                          title="Sin cartel"
                        >
                          <ImageOff className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-900">{row.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-diderot-pale px-2.5 py-0.5 text-xs font-medium text-diderot-indigo">
                      {row.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                    {formatDate(row.startsAt)}
                    {row.endsAt && row.endsAt.slice(0, 10) !== row.startsAt.slice(0, 10)
                      ? ` – ${formatDate(row.endsAt)}`
                      : ""}
                  </td>
                  <td className="hidden px-4 py-3 text-[13px] text-gray-600 lg:table-cell">
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
                      <IconButton label="Editar" onClick={() => setForm(toForm(row))}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
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
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <Field id="e-title" label="Título *">
              <input
                id="e-title"
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id="e-title-en" label="Título en inglés" hint="Vacío = traducción automática al guardar">
              <input
                id="e-title-en"
                type="text"
                value={form.titleEn}
                onChange={(e) => set("titleEn", e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="e-type" label="Tipo *">
                <select
                  id="e-type"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className={inputClass}
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {(EVENT_TYPES as readonly string[]).includes(t) ? t : `${t} (antiguo: elige otro)`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="e-date" label="Fecha *">
                <input
                  id="e-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="e-end" label="Fecha de fin" hint="Solo si dura varios días">
                <input
                  id="e-end"
                  type="date"
                  value={form.endDate}
                  min={form.date || undefined}
                  onChange={(e) => set("endDate", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="e-description" label="Descripción breve (texto)">
              <textarea
                id="e-description"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field
              id="e-description-en"
              label="Descripción en inglés"
              hint="Vacía = traducción automática al guardar"
            >
              <textarea
                id="e-description-en"
                rows={3}
                value={form.descriptionEn}
                onChange={(e) => set("descriptionEn", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="e-location" label="Lugar">
                <input
                  id="e-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field
                id="e-status"
                label="Estado"
                hint="«Próximo» o «celebrado» se calcula con las fechas; hace falta sobre todo para «Cancelado»."
              >
                <select
                  id="e-status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as EventRow["status"])}
                  className={inputClass}
                >
                  <option value="UPCOMING">Próximo</option>
                  <option value="PAST">Celebrado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </Field>
            </div>
            <Field id="e-url" label="Web del evento (opcional)">
              <input
                id="e-url"
                type="text"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                className={inputClass}
              />
            </Field>
            <ImageUploadField
              id="e-image"
              label="Cartel o imagen del evento"
              value={form.image}
              onChange={(image) => set("image", image)}
              folder="events"
              hint="Se muestra en la agenda, en el destacado y en los eventos celebrados."
            />
            <Field
              id="e-news"
              label="Crónica asociada (noticia, opcional)"
              hint="En la web, el evento mostrará «Leer la crónica» con el enlace a esa noticia."
            >
              <select
                id="e-news"
                value={form.newsSlug}
                onChange={(e) => set("newsSlug", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sin crónica —</option>
                {newsOptions.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.title.length > 90 ? `${n.title.slice(0, 90)}…` : n.title}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
