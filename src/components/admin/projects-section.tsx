"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import {
  CheckboxField,
  Field,
  IconButton,
  ImageUploadField,
  inputClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { PROJECT_SCOPES } from "@/lib/admin-options";
import { cn } from "@/lib/cn";

export interface ProjectRow {
  id: string;
  title: string;
  titleEn: string | null;
  acronym: string | null;
  reference: string | null;
  funder: string | null;
  ip: string | null;
  scope: string | null;
  amount: string | null;
  period: string | null;
  startYear: number | null;
  endYear: number | null;
  summary: string | null;
  summaryEn: string | null;
  url: string | null;
  image: string | null;
  featured: boolean;
  active: boolean;
}

type TextKey = Exclude<keyof ProjectRow, "id" | "featured" | "active" | "startYear" | "endYear">;

type FormState = { id?: string; startYear: string; endYear: string; featured: boolean; active: boolean } & {
  [K in TextKey]: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    titleEn: "",
    acronym: "",
    reference: "",
    funder: "",
    ip: "",
    scope: "",
    amount: "",
    period: "",
    startYear: "",
    endYear: "",
    summary: "",
    summaryEn: "",
    url: "",
    image: "",
    featured: false,
    active: true,
  };
}

function toForm(p: ProjectRow): FormState {
  return {
    id: p.id,
    title: p.title,
    titleEn: p.titleEn ?? "",
    acronym: p.acronym ?? "",
    reference: p.reference ?? "",
    funder: p.funder ?? "",
    ip: p.ip ?? "",
    scope: p.scope ?? "",
    amount: p.amount ?? "",
    period: p.period ?? "",
    startYear: p.startYear?.toString() ?? "",
    endYear: p.endYear?.toString() ?? "",
    summary: p.summary ?? "",
    summaryEn: p.summaryEn ?? "",
    url: p.url ?? "",
    image: p.image ?? "",
    featured: p.featured,
    active: p.active,
  };
}

/** Proyectos de investigación, innovación y transferencia del grupo. */
export function ProjectsSection({ rows }: Readonly<{ rows: ProjectRow[] }>) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.title, r.acronym, r.reference, r.funder, r.ip]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  async function handleSave() {
    if (!form) return;
    if (form.title.trim().length < 3) {
      toast.error("El título es obligatorio");
      return;
    }
    const start = form.startYear ? Number(form.startYear) : null;
    const end = form.endYear ? Number(form.endYear) : null;
    if (start && end && start > end) {
      toast.error("El año de inicio no puede ser posterior al de fin");
      return;
    }
    setSaving(true);
    try {
      const { id, ...rest } = form;
      const payload = { ...rest, startYear: start, endYear: end };
      if (id) await sendJson(`/api/admin/projects/${id}`, "PUT", payload);
      else await sendJson("/api/admin/projects", "POST", payload);
      toast.success("Proyecto guardado");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: ProjectRow) {
    const title = row.title.length > 80 ? `${row.title.slice(0, 80)}…` : row.title;
    if (!window.confirm(`¿Eliminar el proyecto «${title}»?`)) return;
    try {
      await sendJson(`/api/admin/projects/${row.id}`, "DELETE");
      toast.success("Proyecto eliminado");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"));
    }
  }

  // Ámbitos estándar + el guardado si no es uno de ellos (datos migrados).
  const scopeOptions =
    form && form.scope && !(PROJECT_SCOPES as readonly string[]).includes(form.scope)
      ? [...PROJECT_SCOPES, form.scope]
      : [...PROJECT_SCOPES];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[340px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, acrónimo, IP, financiadora…"
            aria-label="Buscar proyectos"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <Button variant="primary" className="gap-1.5" onClick={() => setForm(emptyForm())}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo proyecto
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-baseline justify-between p-6">
          <h3 className="text-base font-semibold text-gray-900">Proyectos ({filtered.length})</h3>
          <p className="text-xs text-gray-500">Los ocultos no se muestran en la web pública</p>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-t border-gray-100">
              <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Título
              </th>
              <th scope="col" className="hidden px-4 py-3 text-left text-[13px] font-medium text-gray-500 lg:table-cell">
                IP
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Años
              </th>
              <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                Ámbito
              </th>
              <th scope="col" className="w-[96px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 align-top">
                <td className="max-w-[440px] px-6 py-3">
                  <p className={cn("text-sm font-medium text-gray-900", !row.active && "opacity-60")}>
                    {row.acronym ? (
                      <span className="mr-1.5 inline-flex rounded bg-diderot-pale px-1.5 py-px text-[11px] font-semibold text-diderot-indigo">
                        {row.acronym}
                      </span>
                    ) : null}
                    {row.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {row.funder ? <span>{row.funder}</span> : null}
                    {row.reference ? <span className="font-mono">{row.reference}</span> : null}
                    {row.featured ? (
                      <span className="inline-flex items-center gap-0.5 text-diderot-amber">
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        Destacado
                      </span>
                    ) : null}
                    {!row.active ? (
                      <span className="rounded-full bg-gray-100 px-2 py-px text-[11px] font-semibold text-gray-600">
                        Oculto
                      </span>
                    ) : null}
                  </p>
                </td>
                <td className="hidden max-w-[220px] truncate px-4 py-3 text-[13px] text-gray-600 lg:table-cell">
                  {row.ip ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                  {row.startYear && row.endYear
                    ? `${row.startYear}–${row.endYear}`
                    : (row.endYear ?? row.startYear ?? "—")}
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-500">{row.scope ?? "—"}</td>
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
            ))}
            {filtered.length === 0 ? (
              <tr className="border-t border-gray-100">
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  {query
                    ? "Ningún proyecto coincide con la búsqueda."
                    : "No hay proyectos. Añade el primero con «Nuevo proyecto»."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {form ? (
        <Modal
          title={form.id ? "Editar proyecto" : "Nuevo proyecto"}
          onClose={() => setForm(null)}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <Field id="p-title" label="Título *">
              <textarea
                id="p-title"
                rows={2}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field id="p-title-en" label="Título en inglés" hint="Vacío = traducción automática al guardar">
              <textarea
                id="p-title-en"
                rows={2}
                value={form.titleEn}
                onChange={(e) => set("titleEn", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="p-acronym" label="Acrónimo">
                <input
                  id="p-acronym"
                  value={form.acronym}
                  placeholder="p. ej. EA-DIGIFOLK"
                  onChange={(e) => set("acronym", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="p-reference" label="Referencia de la convocatoria">
                <input
                  id="p-reference"
                  value={form.reference}
                  placeholder="p. ej. PID2019-107523GB-I00"
                  onChange={(e) => set("reference", e.target.value)}
                  className={cn(inputClass, "font-mono text-[13px]")}
                />
              </Field>
              <Field id="p-funder" label="Entidad financiadora">
                <input
                  id="p-funder"
                  value={form.funder}
                  onChange={(e) => set("funder", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="p-ip" label="Investigador/a principal">
                <input
                  id="p-ip"
                  value={form.ip}
                  onChange={(e) => set("ip", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="p-scope" label="Ámbito">
                <select
                  id="p-scope"
                  value={form.scope}
                  onChange={(e) => set("scope", e.target.value)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {scopeOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="p-amount" label="Importe">
                <input
                  id="p-amount"
                  value={form.amount}
                  placeholder="p. ej. 60.500,00 €"
                  onChange={(e) => set("amount", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="p-start" label="Año de inicio">
                <input
                  id="p-start"
                  type="number"
                  value={form.startYear}
                  onChange={(e) => set("startYear", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field id="p-end" label="Año de fin">
                <input
                  id="p-end"
                  type="number"
                  value={form.endYear}
                  onChange={(e) => set("endYear", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="p-period" label="Periodo (texto)" hint="Tal como figura en la resolución, p. ej. 01/01/2024-31/12/2027">
              <input
                id="p-period"
                value={form.period}
                onChange={(e) => set("period", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id="p-summary" label="Resumen breve (texto)">
              <textarea
                id="p-summary"
                rows={3}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field id="p-summary-en" label="Resumen en inglés" hint="Vacío = traducción automática al guardar">
              <textarea
                id="p-summary-en"
                rows={3}
                value={form.summaryEn}
                onChange={(e) => set("summaryEn", e.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field id="p-url" label="Web del proyecto">
              <input
                id="p-url"
                type="text"
                value={form.url}
                placeholder="https://…"
                onChange={(e) => set("url", e.target.value)}
                className={inputClass}
              />
            </Field>
            <ImageUploadField
              id="p-image"
              label="Logotipo o imagen"
              value={form.image}
              onChange={(image) => set("image", image)}
              folder="projects"
              wide={false}
            />
            <div className="flex flex-col gap-2.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <CheckboxField
                checked={form.active}
                onChange={(active) => set("active", active)}
                label="Visible en la web pública"
              />
              <CheckboxField
                checked={form.featured}
                onChange={(featured) => set("featured", featured)}
                label="Destacado en la portada"
              />
            </div>
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
