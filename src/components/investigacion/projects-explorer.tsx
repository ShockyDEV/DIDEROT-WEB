"use client";

import { useId, useMemo, useState } from "react";
import { ArrowUpRight, Search, Star, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/locale";
import type { PublicProject } from "@/lib/projects-service";

const PAGE_SIZE = 12;

// Colores por ámbito (los del IUCE), con variante translúcida en oscuro para
// no deslumbrar sobre la tarjeta. Contraste AA en ambos temas.
const SCOPE_STYLES: Record<string, string> = {
  Europeo: "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-blue-900/40 dark:text-blue-300",
  Internacional: "bg-[#CCFBF1] text-[#0F766E] dark:bg-teal-900/40 dark:text-teal-300",
  Nacional: "bg-[#FEE2E2] text-[#B91C1C] dark:bg-red-900/40 dark:text-red-300",
  Autonómico: "bg-[#FEF3C7] text-[#A16207] dark:bg-amber-900/40 dark:text-amber-300",
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

// Textos fijos de la interfaz en ambos idiomas (los datos de cada proyecto
// llegan ya localizados desde projects-service).
const T = {
  es: {
    placeholder: "Buscar por título, acrónimo, IP o financiador…",
    buscarAria: "Buscar proyectos",
    proyecto: "proyecto",
    proyectos: "proyectos",
    enCursoContador: "en curso",
    estadoAria: "Filtrar por estado",
    ambitoAria: "Filtrar por ámbito",
    chipTodos: "Todos",
    chipEnCurso: "En curso",
    chipFinalizados: "Finalizados",
    todosAmbitos: "Todos los ámbitos",
    ordenar: "Ordenar",
    ordenRecientes: "Más recientes",
    ordenAntiguos: "Más antiguos",
    ordenTitulo: "Título (A–Z)",
    limpiarFiltros: "Limpiar filtros",
    vacio:
      "Ningún proyecto coincide con la búsqueda. Prueba con otros términos o limpia los filtros.",
    financiacion: "Financiación",
    ip: "IP",
    ipTitle: "Investigador/a principal",
    referencia: "Referencia",
    enCursoBadge: "En curso",
    destacado: "Destacado",
    web: "Web del proyecto",
    logoDe: (n: string) => `Logotipo de ${n}`,
    mostrarMas: "Mostrar más",
    restantes: "restantes",
  },
  en: {
    placeholder: "Search by title, acronym, PI or funder…",
    buscarAria: "Search projects",
    proyecto: "project",
    proyectos: "projects",
    enCursoContador: "ongoing",
    estadoAria: "Filter by status",
    ambitoAria: "Filter by scope",
    chipTodos: "All",
    chipEnCurso: "Ongoing",
    chipFinalizados: "Completed",
    todosAmbitos: "All scopes",
    ordenar: "Sort by",
    ordenRecientes: "Most recent",
    ordenAntiguos: "Oldest",
    ordenTitulo: "Title (A–Z)",
    limpiarFiltros: "Clear filters",
    vacio:
      "No projects match your search. Try other terms or clear the filters.",
    financiacion: "Funding",
    ip: "PI",
    ipTitle: "Principal investigator",
    referencia: "Reference",
    enCursoBadge: "Ongoing",
    destacado: "Featured",
    web: "Project website",
    logoDe: (n: string) => `${n} logo`,
    mostrarMas: "Show more",
    restantes: "remaining",
  },
} as const;

type Estado = "todos" | "curso" | "finalizados";
type Orden = "recientes" | "antiguos" | "titulo";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Título sin el acrónimo inicial cuando ya se muestra aparte
 * («EA-DIGIFOLK: An European…» → «An European…»).
 */
function tituloSinAcronimo(p: PublicProject): string {
  if (!p.acronym) return p.title;
  const escaped = p.acronym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rest = p.title.replace(new RegExp(`^${escaped}\\s*[:–—-]\\s*`, "i"), "");
  return rest.trim() ? rest : p.title;
}

/** «2023–2026», un solo año o, sin años, el periodo en texto. */
function periodo(p: PublicProject): string | null {
  if (p.startYear && p.endYear) {
    return p.startYear === p.endYear
      ? String(p.startYear)
      : `${p.startYear}–${p.endYear}`;
  }
  if (p.endYear || p.startYear) return String(p.endYear ?? p.startYear);
  return p.period;
}

const chipClass = (active: boolean) =>
  cn(
    "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
    active
      ? "border-diderot-indigo bg-diderot-indigo text-white"
      : "border-gray-300 bg-surface-card text-gray-600 hover:border-brand-400 hover:text-gray-900",
  );

/**
 * Explorador de proyectos: búsqueda instantánea (título, acrónimo,
 * referencia, IP, financiador, resumen), filtros por estado (en curso /
 * finalizados) y ámbito, orden y «mostrar más». Los datos vienen del panel
 * (Proyectos); solo se listan los marcados como visibles.
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
  const [orden, setOrden] = useState<Orden>("recientes");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const ordenId = useId();
  const t = T[locale];
  // Ámbitos: en inglés solo cambia el texto mostrado, nunca el valor filtrado.
  const scopeLabel = (s: string) => (locale === "en" ? (SCOPE_EN[s] ?? s) : s);
  const enCurso = (p: PublicProject) =>
    p.endYear !== null && p.endYear >= currentYear;

  const scopes = useMemo(
    () =>
      [...new Set(projects.map((p) => p.scope).filter(Boolean))] as string[],
    [projects],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = projects.filter((p) => {
      if (estado === "curso" && !enCurso(p)) return false;
      if (estado === "finalizados" && !(p.endYear !== null && p.endYear < currentYear))
        return false;
      if (scope !== "todos" && p.scope !== scope) return false;
      if (q) {
        const hay = normalize(
          [p.title, p.acronym, p.reference, p.ip, p.funder, p.summary]
            .filter(Boolean)
            .join(" "),
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // El servicio ya entrega «más recientes primero» (año de fin desc).
    if (orden === "antiguos") {
      return [...list].sort(
        (a, b) =>
          (a.startYear ?? a.endYear ?? 9999) - (b.startYear ?? b.endYear ?? 9999) ||
          a.title.localeCompare(b.title, locale),
      );
    }
    if (orden === "titulo") {
      return [...list].sort((a, b) =>
        (a.acronym ?? a.title).localeCompare(b.acronym ?? b.title, locale, {
          sensitivity: "base",
        }),
      );
    }
    return list;
    // enCurso depende solo de currentYear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, query, estado, scope, orden, currentYear, locale]);

  const shown = filtered.slice(0, visible);
  const activos = projects.filter(enCurso).length;
  const hayFiltros =
    query.trim() !== "" || estado !== "todos" || scope !== "todos";

  function resetPage() {
    setVisible(PAGE_SIZE);
  }

  return (
    <div>
      {/* Búsqueda + orden + resumen */}
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <label htmlFor={ordenId} className="text-sm text-gray-500">
              {t.ordenar}
            </label>
            <select
              id={ordenId}
              value={orden}
              onChange={(e) => {
                setOrden(e.target.value as Orden);
                resetPage();
              }}
              className="h-9 rounded-full border border-gray-300 bg-surface-card px-3 text-sm text-gray-700 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
            >
              <option value="recientes">{t.ordenRecientes}</option>
              <option value="antiguos">{t.ordenAntiguos}</option>
              <option value="titulo">{t.ordenTitulo}</option>
            </select>
          </div>
          <p className="text-sm text-gray-500" aria-live="polite">
            <strong className="text-gray-900">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? t.proyecto : t.proyectos}
            {!hayFiltros && activos > 0 ? (
              <span>
                {" "}
                · {activos} {t.enCursoContador}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t.estadoAria} className="flex flex-wrap gap-2">
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
              className={chipClass(estado === value)}
            >
              {label}
            </button>
          ))}
        </div>
        {scopes.length > 1 ? (
          <>
            <span className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" aria-hidden="true" />
            <div role="group" aria-label={t.ambitoAria} className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={scope === "todos"}
                onClick={() => {
                  setScope("todos");
                  resetPage();
                }}
                className={chipClass(scope === "todos")}
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
                  className={chipClass(scope === s)}
                >
                  {scopeLabel(s)}
                </button>
              ))}
            </div>
          </>
        ) : null}
        {hayFiltros ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setEstado("todos");
              setScope("todos");
              resetPage();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded px-2 text-[13px] font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
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
        <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2">
          {shown.map((p) => {
            const vigente = enCurso(p);
            const fechas = periodo(p);
            return (
              <li key={p.id}>
                <article
                  className={cn(
                    "card-lift flex h-full flex-col rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm hover:border-brand-400 hover:shadow-md",
                    p.featured && "border-t-[3px] border-t-diderot-amber",
                  )}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
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
                    {vigente ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#DCFCE7] px-2.5 py-[3px] text-[11px] font-semibold text-[#15803D] dark:bg-emerald-900/40 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {t.enCursoBadge}
                      </span>
                    ) : null}
                    {p.featured ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-diderot-amber">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        {t.destacado}
                      </span>
                    ) : null}
                  </div>

                  {p.image ? (
                    // Placa blanca fija: los logotipos deben verse igual en
                    // tema claro y oscuro (como los de grupos en el IUCE).
                    <div className="mb-3 flex h-14 w-fit max-w-full items-center rounded-md bg-white px-3 ring-1 ring-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={t.logoDe(p.acronym ?? p.title)}
                        loading="lazy"
                        className="max-h-10 max-w-[180px] object-contain"
                      />
                    </div>
                  ) : null}

                  <h3>
                    {p.acronym ? (
                      <span className="block text-lg font-bold tracking-tight text-ink">
                        {p.acronym}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "block font-semibold leading-snug text-gray-900",
                        p.acronym ? "mt-0.5 text-[15px]" : "text-base",
                      )}
                    >
                      {tituloSinAcronimo(p)}
                    </span>
                  </h3>

                  {p.summary ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-gray-600">
                      {p.summary}
                    </p>
                  ) : null}

                  {p.funder || p.ip || p.reference ? (
                    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px] leading-snug">
                      {p.funder ? (
                        <>
                          <dt className="text-gray-500">{t.financiacion}</dt>
                          <dd className="text-gray-700">{p.funder}</dd>
                        </>
                      ) : null}
                      {p.ip ? (
                        <>
                          <dt className="text-gray-500">
                            <abbr title={t.ipTitle} className="no-underline">
                              {t.ip}
                            </abbr>
                          </dt>
                          <dd className="text-gray-700">{p.ip}</dd>
                        </>
                      ) : null}
                      {p.reference ? (
                        <>
                          <dt className="text-gray-500">{t.referencia}</dt>
                          <dd className="break-all text-gray-700">{p.reference}</dd>
                        </>
                      ) : null}
                    </dl>
                  ) : null}

                  {fechas || p.url ? (
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                      {fechas ? (
                        <span className="whitespace-nowrap rounded-full bg-diderot-pale px-3 py-1 text-xs font-medium text-ink">
                          {fechas}
                        </span>
                      ) : (
                        <span />
                      )}
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-6 items-center gap-1 rounded text-sm font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
                        >
                          {t.web}
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > shown.length ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="h-11 rounded-full border border-gray-300 bg-surface-card px-6 text-sm font-medium text-gray-700 transition-colors hover:border-brand-400 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
          >
            {t.mostrarMas} ({filtered.length - shown.length} {t.restantes})
          </button>
        </div>
      ) : null}
    </div>
  );
}
