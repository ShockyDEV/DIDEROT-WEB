"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { Field, textareaClass } from "@/components/admin/form-fields";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { abbreviateAuthors, type OrcidMemberOption } from "@/components/admin/publication-utils";
import { doiUrl, publicationTypeLabel } from "@/lib/content/publication-types";
import { parseOrcidId } from "@/lib/orcid-import";
import type { PublicationTypeValue } from "@/lib/admin-options";
import { cn } from "@/lib/cn";

type Status = "new" | "exists" | "possible-duplicate" | "batch-duplicate" | "incomplete";

interface PreviewItem {
  key: string;
  orcid: string;
  putCode: number;
  title: string;
  authors: string;
  year: number | null;
  type: PublicationTypeValue;
  orcidType: string | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  status: Status;
  reason: string | null;
  match: { id: string; title: string } | null;
  importable: boolean;
  selected: boolean;
}

interface PreviewResponse {
  sources: Array<{
    orcid: string;
    memberId: string | null;
    name: string | null;
    total: number;
    truncated: boolean;
    error: string | null;
  }>;
  problems: Array<{ orcid: string | null; name: string | null; error: string }>;
  items: PreviewItem[];
  summary: {
    total: number;
    new: number;
    exists: number;
    possibleDuplicates: number;
    batchDuplicates: number;
    incomplete: number;
  };
}

interface ImportResponse {
  imported: number;
  conflicts: number;
  skipped: Array<{ key: string; title: string | null; reason: string }>;
  errors: Array<{ orcid: string; error: string }>;
}

const STATUS_LABELS: Record<Status, { label: string; cls: string }> = {
  new: { label: "Nueva", cls: "bg-[#DCFCE7] text-[#15803D]" },
  exists: { label: "Ya existe", cls: "bg-gray-100 text-gray-600" },
  "possible-duplicate": { label: "Posible duplicado", cls: "bg-[#FEF9C3] text-[#A16207]" },
  "batch-duplicate": { label: "Repetida", cls: "bg-gray-100 text-gray-600" },
  incomplete: { label: "Sin año", cls: "bg-[#FEF2F2] text-[#B42318]" },
};

type ViewFilter = "all" | "new" | "possible" | "rest";

/** Separa lo escrito en el campo de ORCID iD (comas, espacios, saltos de línea). */
function splitOrcidInput(text: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of text.split(/[\s,;]+/).filter(Boolean)) {
    const id = parseOrcidId(token);
    if (id) {
      if (!valid.includes(id)) valid.push(id);
    } else {
      invalid.push(token);
    }
  }
  return { valid, invalid };
}

/**
 * Importar desde ORCID (Publicaciones): 1) elegir miembros con ORCID o
 * escribir iD; 2) vista previa con casillas, marcando las que ya existen o
 * se repiten; 3) importar las marcadas. El servidor vuelve a comprobarlo
 * todo al importar.
 */
export function OrcidImportDialog({
  members,
  onClose,
  onImported,
}: Readonly<{
  members: OrcidMemberOption[];
  onClose: () => void;
  onImported: () => void;
}>) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ViewFilter>("all");

  const parsedExtra = useMemo(() => splitOrcidInput(extra), [extra]);
  const canSearch =
    (selectedMembers.size > 0 || parsedExtra.valid.length > 0) &&
    parsedExtra.invalid.length === 0 &&
    !loading;

  const sourceName = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of preview?.sources ?? []) map.set(s.orcid, s.name ?? s.orcid);
    return map;
  }, [preview]);

  const visibleItems = useMemo(() => {
    const items = preview?.items ?? [];
    if (filter === "new") return items.filter((i) => i.status === "new");
    if (filter === "possible") return items.filter((i) => i.status === "possible-duplicate");
    if (filter === "rest") {
      return items.filter((i) => i.status !== "new" && i.status !== "possible-duplicate");
    }
    return items;
  }, [preview, filter]);

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runPreview() {
    setLoading(true);
    try {
      const data = await sendJson<PreviewResponse>(
        "/api/admin/publications/orcid/preview",
        "POST",
        { memberIds: [...selectedMembers], orcids: parsedExtra.valid },
      );
      setPreview(data);
      setChecked(new Set(data.items.filter((i) => i.selected).map((i) => i.key)));
      setFilter("all");
      if (data.items.length === 0) {
        toast("ORCID no devolvió ninguna publicación pública", { icon: "ℹ️" });
      }
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo consultar ORCID"));
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(item: PreviewItem) {
    if (!item.importable) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.add(item.key);
      return next;
    });
  }

  function selectAllNew() {
    setChecked(new Set((preview?.items ?? []).filter((i) => i.status === "new").map((i) => i.key)));
  }

  async function runImport() {
    if (!preview || checked.size === 0) return;
    const items = preview.items
      .filter((i) => checked.has(i.key))
      .map((i) => ({ orcid: i.orcid, putCode: i.putCode }));
    setImporting(true);
    try {
      const result = await sendJson<ImportResponse>(
        "/api/admin/publications/orcid/import",
        "POST",
        { items },
      );
      const skipped = result.skipped.length + result.conflicts;
      if (result.imported > 0) {
        toast.success(
          `${result.imported} publicación${result.imported === 1 ? "" : "es"} importada${
            result.imported === 1 ? "" : "s"
          }${skipped > 0 ? ` · ${skipped} omitida${skipped === 1 ? "" : "s"} (ya existían)` : ""}`,
          { duration: 6000 },
        );
      } else {
        toast("No se importó nada: las marcadas ya estaban en el panel", { icon: "ℹ️" });
      }
      for (const e of result.errors) toast.error(`${e.orcid}: ${e.error}`);
      onImported();
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo importar"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal title="Importar publicaciones desde ORCID" onClose={onClose} size="xl">
      {!preview ? (
        /* ── Paso 1: de quién ── */
        <div className="flex flex-col gap-5">
          <p className="text-sm text-gray-600">
            Se consultan las obras <strong>públicas</strong> de cada perfil de ORCID
            (sin credenciales). Antes de importar verás una vista previa: las que ya
            están en el panel (mismo DOI, ya importadas o mismo título y año) aparecen
            marcadas y no se duplican.
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-gray-700">
                Miembros del equipo con ORCID ({members.length})
              </span>
              {members.length > 0 ? (
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    className="font-medium text-diderot-violet hover:underline"
                    onClick={() => setSelectedMembers(new Set(members.map((m) => m.id)))}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className="font-medium text-gray-500 hover:underline"
                    onClick={() => setSelectedMembers(new Set())}
                  >
                    Ninguno
                  </button>
                </div>
              ) : null}
            </div>
            {members.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
                Ninguna ficha del equipo tiene ORCID. Añádelo en Equipo o escribe el
                ORCID iD abajo.
              </p>
            ) : (
              <div className="grid max-h-[300px] grid-cols-1 gap-1 overflow-y-auto rounded-md border border-gray-200 p-2 sm:grid-cols-2">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="h-4 w-4 flex-none accent-diderot-indigo"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-gray-900", !m.active && "text-gray-500")}>
                        {m.name}
                        {!m.active ? " (inactivo)" : ""}
                      </span>
                      <span className="block font-mono text-[11px] text-gray-500">{m.orcid}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Field
            id="orcid-extra"
            label="Otros ORCID iD (opcional)"
            hint={
              parsedExtra.invalid.length > 0 ? (
                <span className="text-red-600">
                  No válido{parsedExtra.invalid.length > 1 ? "s" : ""}:{" "}
                  {parsedExtra.invalid.slice(0, 5).join(", ")} (formato 0000-0000-0000-0000,
                  se comprueba el dígito de control)
                </span>
              ) : (
                "Separados por comas o espacios. Vale el iD o la URL https://orcid.org/…"
              )
            }
          >
            <textarea
              id="orcid-extra"
              rows={2}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="0000-0003-1828-5182"
              className={cn(textareaClass, "font-mono text-[13px]")}
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" className="gap-1.5" onClick={runPreview} disabled={!canSearch}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "Consultando ORCID…" : "Buscar publicaciones"}
            </Button>
          </div>
        </div>
      ) : (
        /* ── Paso 2: vista previa ── */
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {preview.sources.map((s) => (
              <span
                key={s.orcid}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                  s.error
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-700",
                )}
                title={s.orcid}
              >
                {s.error ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                <strong className="font-medium">{s.name ?? s.orcid}</strong>
                {s.error ? `: ${s.error}` : `· ${s.total} obra${s.total === 1 ? "" : "s"}`}
                {s.truncated ? " (solo las más recientes)" : ""}
              </span>
            ))}
            {preview.problems.map((p, i) => (
              <span
                key={`p-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {p.name ?? p.orcid ?? "—"}: {p.error}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar vista previa">
              {(
                [
                  ["all", `Todas (${preview.summary.total})`],
                  ["new", `Nuevas (${preview.summary.new})`],
                  ["possible", `Posibles duplicados (${preview.summary.possibleDuplicates})`],
                  [
                    "rest",
                    `Ya existen / repetidas / sin año (${
                      preview.summary.exists +
                      preview.summary.batchDuplicates +
                      preview.summary.incomplete
                    })`,
                  ],
                ] as Array<[ViewFilter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === value
                      ? "bg-diderot-indigo text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="font-medium text-diderot-violet hover:underline"
                onClick={selectAllNew}
              >
                Marcar todas las nuevas
              </button>
              <button
                type="button"
                className="font-medium text-gray-500 hover:underline"
                onClick={() => setChecked(new Set())}
              >
                Desmarcar todas
              </button>
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto rounded-md border border-gray-200">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-[1] bg-gray-50">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2">
                    <span className="sr-only">Importar</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Publicación
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Año
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Tipo
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const status = STATUS_LABELS[item.status];
                  const isChecked = checked.has(item.key);
                  return (
                    <tr
                      key={item.key}
                      className={cn(
                        "border-t border-gray-100 align-top",
                        !item.importable && "bg-gray-50/60",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!item.importable}
                          onChange={() => toggleItem(item)}
                          aria-label={`Importar «${item.title}»`}
                          className="h-4 w-4 accent-diderot-indigo disabled:opacity-40"
                        />
                      </td>
                      <td className="max-w-[560px] px-3 py-2.5">
                        <p
                          className={cn(
                            "text-[13px] font-medium leading-snug",
                            item.importable ? "text-gray-900" : "text-gray-500",
                          )}
                        >
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {abbreviateAuthors(item.authors) || (
                            <span className="text-[#B45309]">Sin autores en ORCID</span>
                          )}
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
                          {item.venue ? <span className="italic">{item.venue}</span> : null}
                          {item.doi ? (
                            <a
                              href={doiUrl(item.doi)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 font-mono text-diderot-violet hover:underline"
                            >
                              {item.doi}
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          ) : (
                            <span>sin DOI</span>
                          )}
                          {preview.sources.length > 1 ? (
                            <span>· ORCID de {sourceName.get(item.orcid) ?? item.orcid}</span>
                          ) : null}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-gray-600">
                        {item.year ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-gray-600">
                        {publicationTypeLabel(item.type, "es")}
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            status.cls,
                          )}
                        >
                          {status.label}
                        </span>
                        {item.reason ? (
                          <p className="mt-1 text-[11px] leading-snug text-gray-500">{item.reason}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                      No hay publicaciones en esta vista.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              className="gap-1.5"
              onClick={() => setPreview(null)}
              disabled={importing}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Cambiar selección
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-gray-500">
                {checked.size} marcada{checked.size === 1 ? "" : "s"}
              </span>
              <Button
                variant="primary"
                onClick={runImport}
                disabled={checked.size === 0 || importing}
                className="gap-1.5"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {importing
                  ? "Importando…"
                  : `Importar ${checked.size} publicaci${checked.size === 1 ? "ón" : "ones"}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
