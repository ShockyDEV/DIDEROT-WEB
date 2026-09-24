"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Unlock,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import {
  CheckboxField,
  Field,
  IconButton,
  inputClass,
  textareaClass,
} from "@/components/admin/form-fields";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { OrcidImportDialog } from "@/components/admin/orcid-import-dialog";
import {
  abbreviateAuthors,
  type OrcidMemberOption,
} from "@/components/admin/publication-utils";
import {
  PUBLICATION_SOURCES,
  PUBLICATION_TYPE_VALUES,
  publicationSourceLabel,
  type PublicationTypeValue,
} from "@/lib/admin-options";
import {
  PUBLICATION_TYPES,
  doiUrl,
  normalizeDoi,
  publicationTypeLabel,
} from "@/lib/content/publication-types";
import { cn } from "@/lib/cn";

export interface PublicationRow {
  id: string;
  title: string;
  authors: string;
  year: number;
  type: PublicationTypeValue;
  venue: string | null;
  details: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  openAccess: boolean;
  featured: boolean;
  published: boolean;
  source: string;
}

export type { OrcidMemberOption };

interface Filters {
  q: string;
  type: string;
  year: string;
  visible: string;
  source: string;
}

interface Props {
  rows: PublicationRow[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  filters: Filters;
  years: Array<{ year: number; count: number }>;
  stats: {
    total: number;
    hidden: number;
    featured: number;
    bySource: Array<{ source: string; count: number }>;
  };
  orcidMembers: OrcidMemberOption[];
  /** Acción pedida desde el Dashboard (?accion=nueva|orcid). */
  initialAction: "new" | "orcid" | null;
}

const SOURCE_STYLES: Record<string, string> = {
  manual: "bg-gray-100 text-gray-700",
  orcid: "bg-[#F1F8E4] text-[#4B6E12]",
  portal: "bg-diderot-pale text-diderot-indigo",
};

interface FormState {
  id?: string;
  title: string;
  authors: string;
  year: string;
  type: PublicationTypeValue;
  venue: string;
  details: string;
  doi: string;
  url: string;
  abstract: string;
  openAccess: boolean;
  featured: boolean;
  published: boolean;
  source?: string;
}

function emptyForm(): FormState {
  return {
    title: "",
    authors: "",
    year: String(new Date().getFullYear()),
    type: "ARTICLE",
    venue: "",
    details: "",
    doi: "",
    url: "",
    abstract: "",
    openAccess: false,
    featured: false,
    published: true,
  };
}

function toForm(row: PublicationRow): FormState {
  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    year: String(row.year),
    type: row.type,
    venue: row.venue ?? "",
    details: row.details ?? "",
    doi: row.doi ?? "",
    url: row.url ?? "",
    abstract: row.abstract ?? "",
    openAccess: row.openAccess,
    featured: row.featured,
    published: row.published,
    source: row.source,
  };
}

/**
 * Panel de Publicaciones: tabla paginada en el servidor (50 por página) con
 * búsqueda y filtros en la URL, alta/edición en modal, conmutadores de
 * visible/destacada en línea e importación desde ORCID.
 */
export function PublicationsSection({
  rows,
  total,
  page,
  pageCount,
  pageSize,
  filters,
  years,
  stats,
  orcidMembers,
  initialAction,
}: Readonly<Props>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [orcidOpen, setOrcidOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);
  // Cambios optimistas de los conmutadores hasta que llega el refresco.
  const [overrides, setOverrides] = useState<
    Record<string, Partial<Pick<PublicationRow, "published" | "featured">>>
  >({});
  const [busy, setBusy] = useState<string | null>(null);

  /* ── Navegación por filtros (en la URL, para poder compartir/volver) ── */

  function navigate(next: Partial<Filters> & { page?: number }) {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    for (const key of ["q", "type", "year", "visible", "source"] as const) {
      const value = merged[key]?.trim();
      if (value) params.set(key, value);
    }
    const nextPage = next.page ?? 1; // cualquier cambio de filtro vuelve a la 1
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    startTransition(() => {
      router.replace(`/backstage/publications${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  // Búsqueda con espera (no una petición por tecla).
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(() => {
    if (query.trim() === filtersRef.current.q.trim()) return;
    const timer = setTimeout(() => navigate({ q: query }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Acción pedida desde el Dashboard: se abre una vez y se limpia la URL.
  const actionDone = useRef(false);
  useEffect(() => {
    if (actionDone.current || !initialAction) return;
    actionDone.current = true;
    if (initialAction === "new") setForm(emptyForm());
    if (initialAction === "orcid") setOrcidOpen(true);
    navigate({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);

  useEffect(() => setOverrides({}), [rows]);

  const view = useMemo(
    () => rows.map((r) => ({ ...r, ...overrides[r.id] })),
    [rows, overrides],
  );

  const hasFilters = Boolean(
    filters.q || filters.type || filters.year || filters.visible || filters.source,
  );

  /* ── Acciones ── */

  async function toggle(row: PublicationRow, field: "published" | "featured") {
    const value = !row[field];
    setBusy(`${row.id}:${field}`);
    setOverrides((o) => ({ ...o, [row.id]: { ...o[row.id], [field]: value } }));
    try {
      await sendJson(`/api/admin/publications/${row.id}`, "PATCH", { [field]: value });
      toast.success(
        field === "published"
          ? value
            ? "Visible en la web"
            : "Oculta en la web"
          : value
            ? "Marcada como destacada"
            : "Ya no está destacada",
      );
      router.refresh();
    } catch (err) {
      setOverrides((o) => ({ ...o, [row.id]: { ...o[row.id], [field]: !value } }));
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(row: PublicationRow) {
    const title = row.title.length > 90 ? `${row.title.slice(0, 90)}…` : row.title;
    if (!window.confirm(`¿Eliminar la publicación «${title}»?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await sendJson(`/api/admin/publications/${row.id}`, "DELETE");
      toast.success("Publicación eliminada");
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar"));
    }
  }

  async function handleSave() {
    if (!form) return;
    if (form.title.trim().length < 3) {
      toast.error("El título es obligatorio");
      return;
    }
    if (form.authors.trim().length < 2) {
      toast.error("Indica los autores");
      return;
    }
    const year = Number(form.year);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
      toast.error(`El año debe estar entre 1900 y ${maxYear}`);
      return;
    }
    if (form.doi.trim() && !normalizeDoi(form.doi)) {
      toast.error("El DOI no es válido (p. ej. 10.3390/educsci14111171)");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        authors: form.authors,
        year,
        type: form.type,
        venue: form.venue,
        details: form.details,
        doi: form.doi,
        url: form.url,
        abstract: form.abstract,
        openAccess: form.openAccess,
        featured: form.featured,
        published: form.published,
      };
      if (form.id) {
        await sendJson(`/api/admin/publications/${form.id}`, "PATCH", payload);
      } else {
        await sendJson("/api/admin/publications", "POST", payload);
      }
      toast.success(form.id ? "Publicación guardada" : "Publicación creada");
      setForm(null);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(false);
    }
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const normalizedDoi = form ? normalizeDoi(form.doi) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Barra superior: resumen + acciones */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-gray-500">
          <strong className="font-semibold text-gray-900">
            {stats.total.toLocaleString("es-ES")}
          </strong>{" "}
          publicaciones · {stats.hidden.toLocaleString("es-ES")} ocultas ·{" "}
          {stats.featured.toLocaleString("es-ES")} destacadas
          {stats.bySource.length > 0 ? (
            <span className="text-gray-500">
              {" · "}
              {stats.bySource
                .map((s) => `${publicationSourceLabel(s.source)}: ${s.count.toLocaleString("es-ES")}`)
                .join(" · ")}
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" className="gap-1.5" onClick={() => setOrcidOpen(true)}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Importar desde ORCID
          </Button>
          <Button variant="primary" className="gap-1.5" onClick={() => setForm(emptyForm())}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva publicación
          </Button>
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, autores, revista o DOI…"
            aria-label="Buscar publicaciones"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <select
          aria-label="Filtrar por tipo"
          value={filters.type}
          onChange={(e) => navigate({ type: e.target.value })}
          className={cn(inputClass, "w-auto min-w-[150px]")}
        >
          <option value="">Todos los tipos</option>
          {PUBLICATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.plural}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por año"
          value={filters.year}
          onChange={(e) => navigate({ year: e.target.value })}
          className={cn(inputClass, "w-auto min-w-[120px]")}
        >
          <option value="">Todos los años</option>
          {years.map((y) => (
            <option key={y.year} value={String(y.year)}>
              {y.year} ({y.count})
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por visibilidad"
          value={filters.visible}
          onChange={(e) => navigate({ visible: e.target.value })}
          className={cn(inputClass, "w-auto min-w-[150px]")}
        >
          <option value="">Visibles y ocultas</option>
          <option value="visible">Solo visibles</option>
          <option value="hidden">Solo ocultas</option>
          <option value="featured">Destacadas</option>
        </select>
        <select
          aria-label="Filtrar por procedencia"
          value={filters.source}
          onChange={(e) => navigate({ source: e.target.value })}
          className={cn(inputClass, "w-auto min-w-[150px]")}
        >
          <option value="">Todas las fuentes</option>
          {PUBLICATION_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              navigate({ q: "", type: "", year: "", visible: "", source: "" });
            }}
            className="text-[13px] font-medium text-diderot-violet hover:underline"
          >
            Quitar filtros
          </button>
        ) : null}
      </div>

      {/* Tabla */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity",
          isPending && "opacity-60",
        )}
        aria-busy={isPending}
      >
        <div className="flex items-baseline justify-between gap-4 p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Publicaciones ({total.toLocaleString("es-ES")})
            {isPending ? (
              <Loader2
                className="ml-2 inline h-4 w-4 animate-spin text-gray-400"
                aria-label="Cargando"
              />
            ) : null}
          </h3>
          <p className="text-xs text-gray-500">
            Las ocultas no se muestran en la web pública
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-t border-gray-100">
                <th scope="col" className="px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                  Título
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-[13px] font-medium text-gray-500 xl:table-cell">
                  Autores
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Año
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-3 text-left text-[13px] font-medium text-gray-500">
                  Fuente
                </th>
                <th scope="col" className="px-2 py-3 text-center text-[13px] font-medium text-gray-500">
                  Visible
                </th>
                <th scope="col" className="px-2 py-3 text-center text-[13px] font-medium text-gray-500">
                  Destacada
                </th>
                <th scope="col" className="w-[96px] px-6 py-3 text-left text-[13px] font-medium text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {view.map((row) => (
                <tr key={row.id} className="border-t border-gray-100 align-top">
                  <td className="max-w-[440px] px-6 py-3">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug text-gray-900",
                        !row.published && "text-gray-500",
                      )}
                    >
                      {row.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 xl:hidden">
                      {abbreviateAuthors(row.authors, 2)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                      {row.venue ? <span className="italic">{row.venue}</span> : null}
                      {row.doi ? (
                        <a
                          href={doiUrl(row.doi)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-diderot-violet hover:underline"
                        >
                          DOI
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : row.url ? (
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-diderot-violet hover:underline"
                        >
                          Enlace
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : null}
                      {row.openAccess ? (
                        <span className="inline-flex items-center gap-0.5 text-[#15803D]">
                          <Unlock className="h-3 w-3" aria-hidden="true" />
                          Acceso abierto
                        </span>
                      ) : null}
                    </p>
                  </td>
                  <td className="hidden max-w-[240px] px-4 py-3 text-[13px] text-gray-600 xl:table-cell">
                    {abbreviateAuthors(row.authors) || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-600">
                    {row.year}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-600">
                    {publicationTypeLabel(row.type, "es")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
                        SOURCE_STYLES[row.source] ?? "bg-gray-100 text-gray-700",
                      )}
                    >
                      {publicationSourceLabel(row.source)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggle(row, "published")}
                      disabled={busy === `${row.id}:published`}
                      aria-pressed={row.published}
                      aria-label={row.published ? "Ocultar en la web" : "Mostrar en la web"}
                      title={row.published ? "Visible (clic para ocultar)" : "Oculta (clic para mostrar)"}
                      className={cn(
                        "mx-auto flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
                        row.published
                          ? "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]"
                          : "border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-700",
                      )}
                    >
                      {row.published ? (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggle(row, "featured")}
                      disabled={busy === `${row.id}:featured`}
                      aria-pressed={row.featured}
                      aria-label={row.featured ? "Quitar de destacadas" : "Marcar como destacada"}
                      title={row.featured ? "Destacada (clic para quitar)" : "Marcar como destacada"}
                      className={cn(
                        "mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50",
                        row.featured
                          ? "text-diderot-amber hover:bg-diderot-amber/10"
                          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                      )}
                    >
                      <Star
                        className={cn("h-4 w-4", row.featured && "fill-current")}
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                  <td className="px-6 py-2.5">
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
              {view.length === 0 ? (
                <tr className="border-t border-gray-100">
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    {hasFilters
                      ? "Ninguna publicación coincide con la búsqueda o los filtros."
                      : "Aún no hay publicaciones. Añade la primera o impórtalas desde ORCID."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-3.5">
            <p className="text-[13px] text-gray-500">
              Mostrando {from.toLocaleString("es-ES")}–{to.toLocaleString("es-ES")} de{" "}
              {total.toLocaleString("es-ES")}
            </p>
            {pageCount > 1 ? (
              <nav aria-label="Paginación" className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 1 || isPending}
                  onClick={() => navigate({ page: page - 1 })}
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Anterior
                </Button>
                <span className="text-[13px] text-gray-600">
                  Página {page} de {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  disabled={page >= pageCount || isPending}
                  onClick={() => navigate({ page: page + 1 })}
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Alta / edición */}
      {form ? (
        <Modal
          title={form.id ? "Editar publicación" : "Nueva publicación"}
          onClose={() => setForm(null)}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            {form.source && form.source !== "manual" ? (
              <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                Procedencia: <strong>{publicationSourceLabel(form.source)}</strong>. Los
                cambios que hagas aquí se conservan (no se sobrescriben al volver a
                importar).
              </p>
            ) : null}
            <Field id="pub-title" label="Título *">
              <textarea
                id="pub-title"
                rows={2}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={textareaClass}
              />
            </Field>
            <Field
              id="pub-authors"
              label="Autores *"
              hint="Formato «Apellidos, N.» separados por punto y coma: Merchán-Sánchez-Jara, J.; González-Gutiérrez, S."
            >
              <textarea
                id="pub-authors"
                rows={2}
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
                className={textareaClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="pub-year" label="Año *">
                <input
                  id="pub-year"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field id="pub-type" label="Tipo *" className="sm:col-span-2">
                <select
                  id="pub-type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as PublicationTypeValue })
                  }
                  className={inputClass}
                >
                  {PUBLICATION_TYPE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {publicationTypeLabel(value, "es")}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              id="pub-venue"
              label="Revista, editorial o congreso"
              hint="En capítulos, el título del libro; en congresos, el nombre del congreso o de las actas."
            >
              <input
                id="pub-venue"
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field id="pub-details" label="Detalles" hint="Volumen(número), páginas, edición… p. ej. 14(11), 1171.">
              <input
                id="pub-details"
                type="text"
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="pub-doi"
                label="DOI"
                hint={
                  form.doi.trim() ? (
                    normalizedDoi ? (
                      <>
                        Se guardará como{" "}
                        <a
                          href={doiUrl(normalizedDoi)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-diderot-violet hover:underline"
                        >
                          {normalizedDoi}
                        </a>
                      </>
                    ) : (
                      <span className="text-red-600">DOI no válido</span>
                    )
                  ) : (
                    "p. ej. 10.3390/educsci14111171 o https://doi.org/…"
                  )
                }
              >
                <input
                  id="pub-doi"
                  type="text"
                  value={form.doi}
                  onChange={(e) => setForm({ ...form, doi: e.target.value })}
                  className={cn(inputClass, "font-mono text-[13px]")}
                />
              </Field>
              <Field id="pub-url" label="Enlace" hint="Web de la publicación o PDF subido a Archivos.">
                <input
                  id="pub-url"
                  type="text"
                  placeholder="https://…"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="pub-abstract" label="Resumen">
              <textarea
                id="pub-abstract"
                rows={4}
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                className={textareaClass}
              />
            </Field>
            <div className="flex flex-col gap-2.5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <CheckboxField
                checked={form.published}
                onChange={(published) => setForm({ ...form, published })}
                label="Visible en la web pública"
              />
              <CheckboxField
                checked={form.featured}
                onChange={(featured) => setForm({ ...form, featured })}
                label="Destacada"
                hint="Las destacadas se muestran en la portada."
              />
              <CheckboxField
                checked={form.openAccess}
                onChange={(openAccess) => setForm({ ...form, openAccess })}
                label="Acceso abierto"
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

      {orcidOpen ? (
        <OrcidImportDialog
          members={orcidMembers}
          onClose={() => setOrcidOpen(false)}
          onImported={() => {
            setOrcidOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
