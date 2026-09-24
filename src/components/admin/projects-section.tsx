"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { cn } from "@/lib/cn";

const inputClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";
const labelClass = "text-[13px] font-medium text-gray-700";

export interface ProjectRow {
  id: string;
  title: string;
  funder: string | null;
  ip: string | null;
  line: string | null;
  scope: string | null;
  amount: string | null;
  period: string | null;
  startYear: number | null;
  endYear: number | null;
  active: boolean;
  iuceLed: boolean;
}

interface FormState {
  id?: string;
  title: string;
  funder: string;
  ip: string;
  line: string;
  scope: string;
  amount: string;
  period: string;
  startYear: string;
  endYear: string;
  active: boolean;
  iuceLed: boolean;
}

const EMPTY: FormState = {
  title: "",
  funder: "",
  ip: "",
  line: "",
  scope: "",
  amount: "",
  period: "",
  startYear: "",
  endYear: "",
  active: true,
  iuceLed: true,
};

function toForm(p: ProjectRow): FormState {
  return {
    id: p.id,
    title: p.title,
    funder: p.funder ?? "",
    ip: p.ip ?? "",
    line: p.line ?? "",
    scope: p.scope ?? "",
    amount: p.amount ?? "",
    period: p.period ?? "",
    startYear: p.startYear?.toString() ?? "",
    endYear: p.endYear?.toString() ?? "",
    active: p.active,
    iuceLed: p.iuceLed,
  };
}

/** Gestión de proyectos de investigación (los que explora la web pública). */
export function ProjectsSection({ rows }: Readonly<{ rows: ProjectRow[] }>) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.title, r.funder, r.ip, r.line]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  async function handleSave() {
    if (!form) return;
    if (form.title.trim().length < 3) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        funder: form.funder || null,
        ip: form.ip || null,
        line: form.line || null,
        scope: form.scope || null,
        amount: form.amount || null,
        period: form.period || null,
        startYear: form.startYear ? Number(form.startYear) : null,
        endYear: form.endYear ? Number(form.endYear) : null,
        active: form.active,
        iuceLed: form.iuceLed,
      };
      const res = await fetch(
        form.id ? `/api/admin/projects/${form.id}` : "/api/admin/projects",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
      toast.success("Proyecto guardado");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: ProjectRow) {
    if (!window.confirm(`¿Eliminar el proyecto «${row.title.slice(0, 80)}…»?`))
      return;
    const res = await fetch(`/api/admin/projects/${row.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Proyecto eliminado");
    router.refresh();
  }

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
            placeholder="Buscar por título, IP, financiadora…"
            aria-label="Buscar proyectos"
            className={inputClass + " pl-9"}
          />
        </div>
        <Button
          variant="primary"
          className="gap-1.5"
          onClick={() => setForm(EMPTY)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo proyecto
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-baseline justify-between p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Proyectos ({filtered.length})
          </h3>
          <p className="text-xs text-gray-500">
            Los inactivos no se muestran en la web pública
          </p>
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
              <th scope="col" className="w-[110px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="max-w-[420px] px-6 py-3 text-sm font-medium text-gray-900">
                  <span className={cn(!row.active && "opacity-50")}>
                    {row.title}
                  </span>
                  {!row.active ? (
                    <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      Oculto
                    </span>
                  ) : null}
                </td>
                <td className="hidden max-w-[220px] truncate px-4 py-3 text-[13px] text-gray-600 lg:table-cell">
                  {row.ip ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                  {row.startYear && row.endYear
                    ? `${row.startYear}–${row.endYear}`
                    : (row.endYear ?? row.startYear ?? "—")}
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-500">
                  {row.scope ?? "—"}
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Editar"
                      onClick={() => setForm(toForm(row))}
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
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="p-title" className={labelClass}>
                Título *
              </label>
              <textarea
                id="p-title"
                rows={2}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="p-funder" className={labelClass}>
                  Entidad financiadora
                </label>
                <input
                  id="p-funder"
                  value={form.funder}
                  onChange={(e) => setForm({ ...form, funder: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-ip" className={labelClass}>
                  Investigador/a principal
                </label>
                <input
                  id="p-ip"
                  value={form.ip}
                  onChange={(e) => setForm({ ...form, ip: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-line" className={labelClass}>
                  Línea / grupo(s)
                </label>
                <input
                  id="p-line"
                  value={form.line}
                  placeholder="p. ej. GRIAL / MOVERE"
                  onChange={(e) => setForm({ ...form, line: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-scope" className={labelClass}>
                  Ámbito
                </label>
                <select
                  id="p-scope"
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value })}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {["Europeo", "Internacional", "Nacional", "Autonómico", "Institucional", "Local"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-start" className={labelClass}>
                  Año de inicio
                </label>
                <input
                  id="p-start"
                  type="number"
                  value={form.startYear}
                  onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-end" className={labelClass}>
                  Año de fin
                </label>
                <input
                  id="p-end"
                  type="number"
                  value={form.endYear}
                  onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-amount" className={labelClass}>
                  Importe
                </label>
                <input
                  id="p-amount"
                  value={form.amount}
                  placeholder="p. ej. 60.500,00 €"
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-period" className={labelClass}>
                  Periodo (texto)
                </label>
                <input
                  id="p-period"
                  value={form.period}
                  placeholder="p. ej. 01/01/2024-31/12/2027"
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.iuceLed}
                onChange={(e) => setForm({ ...form, iuceLed: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-diderot-indigo"
              />
              <span>
                Proyecto del IUCE
                <span className="block text-xs text-gray-500">
                  Lo firma el Instituto o más de la mitad del equipo son
                  investigadores del IUCE. Solo estos se listan en la web
                  pública; los demás se guardan pero no se muestran.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-diderot-indigo"
              />
              Visible en la web pública
            </label>
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
