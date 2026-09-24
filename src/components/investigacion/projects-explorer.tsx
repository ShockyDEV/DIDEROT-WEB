"use client";

import { useMemo, useState } from "react";
import { Search, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/locale";
import type { PublicProject } from "@/lib/projects-service";

const PAGE_SIZE = 12;

const SCOPE_STYLES: Record<string, string> = {
  Europeo: "bg-[#DBEAFE] text-[#1D4ED8]",
  Internacional: "bg-[#CCFBF1] text-[#0F766E]",
  Nacional: "bg-[#FEE2E2] text-[#B91C1C]",
  Autonómico: "bg-[#FEF3C7] text-[#A16207]",
  Institucional: "bg-diderot-pale text-ink",
  Local: "bg-gray-100 text-gray-700",
};

/**
 * Etiquetas de ámbito en inglés SOLO para mostrar: los valores de datos
 * (p.scope) y el filtrado siguen usando el texto español de la BD.
 */
const SCOPE_EN: Record<string, string> = {
  Europeo: "European",
  Internacional: "International",
  Nacional: "National",
  Autonómico: "Regional",
  Institucional: "Institutional",
  Local: "Local",
};

// Textos fijos de la interfaz en ambos idiomas (los datos de proyecto —
// título, financiadora, IP, línea, ámbito — vienen de la BD en español).
const T = {
  es: {
    placeholder: "Buscar por título, IP, financiadora o grupo…",
    buscarAria: "Buscar proyectos",
    proyecto: "proyecto",
    proyectos: "proyectos",
    enCursoContador: "en curso",
    chipTodos: "Todos",
    chipEnCurso: "En curso",
    chipFinalizados: "Finalizados",
    todosAmbitos: "Todos los ámbitos",
    limpiarFiltros: "Limpiar filtros",
    vacio:
      "Ningún proyecto coincide con la búsqueda. Prueba con otros términos o limpia los filtros.",
    ipLabel: "IP:",
    enCursoBadge: "En curso",
    mostrarMas: "Mostrar más",
    restantes: "restantes",
  },
  en: {
    placeholder: "Search by title, PI, funder or group…",
    buscarAria: "Search projects",
    proyecto: "project",
    proyectos: "projects",
    enCursoContador: "ongoing",
    chipTodos: "All",
    chipEnCurso: "Ongoing",
    chipFinalizados: "Completed",
    todosAmbitos: "All scopes",
    limpiarFiltros: "Clear filters",
    vacio:
      "No projects match your search. Try other terms or clear the filters.",
    ipLabel: "PI:",
    enCursoBadge: "Ongoing",
    mostrarMas: "Show more",
    restantes: "remaining",
  },
} as const;

type Estado = "todos" | "curso" | "finalizados";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Explorador de proyectos: búsqueda instantánea (título, IP, financiadora,
 * grupo) + filtros por estado y ámbito. Los datos vienen del gestor
 * (Instituto → Proyectos), importados de la memoria de acreditación.
 */
export function ProjectsExplorer({
  projects,
  currentYear,
  locale = "es",
}: Readonly<{
  projects: PublicProject[];
  currentYear: number;
  locale?: Locale;
}>) {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<Estado>("todos");
  const [scope, setScope] = useState<string>("todos");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const t = T[locale];
  // Ámbitos: en inglés solo cambia el texto mostrado, nunca el valor filtrado.
  const scopeLabel = (s: string) =>
    locale === "en" ? (SCOPE_EN[s] ?? s) : s;

  const scopes = useMemo(
    () =>
      [...new Set(projects.map((p) => p.scope).filter(Boolean))] as string[],
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return projects.filter((p) => {
      if (estado === "curso" && !(p.endYear && p.endYear >= currentYear))
        return false;
      if (estado === "finalizados" && !(p.endYear && p.endYear < currentYear))
        return false;
      if (scope !== "todos" && p.scope !== scope) return false;
      if (q) {
        const hay = normalize(
          [p.title, p.ip, p.funder, p.line].filter(Boolean).join(" "),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, query, estado, scope, currentYear]);

  const shown = filtered.slice(0, visible);
  const activos = projects.filter(
    (p) => p.endYear && p.endYear >= currentYear,
  ).length;
  const hayFiltros = query.trim() !== "" || estado !== "todos" || scope !== "todos";

  function resetPage() {
    setVisible(PAGE_SIZE);
  }

  return (
    <div>
      {/* Búsqueda + resumen */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[380px]">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder={t.placeholder}
            aria-label={t.buscarAria}
            className="h-11 w-full rounded-full border border-gray-300 bg-surface-card pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
          />
        </div>
        <p className="text-sm text-gray-500">
          <strong className="text-gray-900">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? t.proyecto : t.proyectos}
          {!hayFiltros ? (
            <span className="text-gray-500">
              {" "}
              · {activos} {t.enCursoContador}
            </span>
          ) : null}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(
          [
            ["todos", t.chipTodos],
            ["curso", t.chipEnCurso],
            ["finalizados", t.chipFinalizados],
          ] as Array<[Estado, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={estado === value}
            onClick={() => {
              setEstado(value);
              resetPage();
            }}
            className={cn(
              "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
              estado === value
                ? "border-diderot-indigo bg-diderot-indigo text-white"
                : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-gray-900",
            )}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />
        <button
          type="button"
          aria-pressed={scope === "todos"}
          onClick={() => {
            setScope("todos");
            resetPage();
          }}
          className={cn(
            "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
            scope === "todos"
              ? "border-diderot-indigo bg-diderot-indigo text-white"
              : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-gray-900",
          )}
        >
          {t.todosAmbitos}
        </button>
        {scopes.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={scope === s}
            onClick={() => {
              setScope(scope === s ? "todos" : s);
              resetPage();
            }}
            className={cn(
              "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
              scope === s
                ? "border-diderot-indigo bg-diderot-indigo text-white"
                : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-gray-900",
            )}
          >
            {scopeLabel(s)}
          </button>
        ))}
        {hayFiltros ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setEstado("todos");
              setScope("todos");
              resetPage();
            }}
            className="inline-flex h-9 items-center gap-1.5 px-2 text-[13px] font-medium text-diderot-violet hover:underline"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {t.limpiarFiltros}
          </button>
        ) : null}
      </div>

      {/* Resultados */}
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500">
          {t.vacio}
        </p>
      ) : (
        <div className="flex flex-col">
          {shown.map((p, i) => {
            const enCurso = Boolean(p.endYear && p.endYear >= currentYear);
            return (
              <article
                key={p.id}
                className={cn(
                  "grid grid-cols-1 items-start gap-3 border-t border-gray-100 py-[18px] transition-colors hover:bg-surface-card sm:grid-cols-[1fr_auto] sm:gap-6",
                  i === shown.length - 1 && "border-b",
                )}
              >
                <div className="min-w-0">
                  <h3 className="mb-1 text-base font-semibold leading-snug text-gray-900">
                    {p.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-gray-500">
                    {[p.funder, p.ip ? `${t.ipLabel} ${p.ip}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {p.line ? (
                    <p className="mt-1 text-xs text-gray-500">{p.line}</p>
                  ) : null}
                </div>
                <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <span className="whitespace-nowrap rounded-full bg-diderot-pale px-3 py-1 text-xs font-medium text-ink">
                    {p.startYear && p.endYear
                      ? `${p.startYear}–${p.endYear}`
                      : (p.endYear ?? p.startYear ?? "—")}
                  </span>
                  <span className="flex items-center gap-2">
                    {enCurso ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#DCFCE7] px-2.5 py-[3px] text-[11px] font-semibold text-[#15803D]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" aria-hidden="true" />
                        {t.enCursoBadge}
                      </span>
                    ) : null}
                    {p.scope ? (
                      <span
                        className={cn(
                          "whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-semibold",
                          SCOPE_STYLES[p.scope] ?? "bg-gray-100 text-gray-700",
                        )}
                      >
                        {scopeLabel(p.scope)}
                      </span>
                    ) : null}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filtered.length > shown.length ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + 18)}
            className="h-11 rounded-full border border-gray-300 bg-surface-card px-6 text-sm font-medium text-gray-700 transition-colors hover:border-brand-400 hover:text-ink"
          >
            {t.mostrarMas} ({filtered.length - shown.length} {t.restantes})
          </button>
        </div>
      ) : null}
    </div>
  );
}
