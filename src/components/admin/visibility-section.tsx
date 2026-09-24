"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { errorMessage, sendJson } from "@/components/admin/admin-fetch";
import { cn } from "@/lib/cn";

export interface VisibilityRow {
  slug: string;
  label: string;
  path: string;
  hint: string;
  hidden: boolean;
}

/**
 * Visualización: interruptor del ojo por página. Al ocultar, la página
 * desaparece del menú y su URL responde 404 a los visitantes (la
 * administración sí puede seguir viéndola para trabajar en ella).
 */
export function VisibilitySection({
  rows,
  sections = [],
}: Readonly<{ rows: VisibilityRow[]; sections?: VisibilityRow[] }>) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(
      [...rows, ...sections].map((r) => [r.slug, r.hidden]),
    ),
  );

  async function toggle(row: VisibilityRow) {
    const hidden = !state[row.slug];
    setSaving(row.slug);
    setState((s) => ({ ...s, [row.slug]: hidden })); // optimista
    try {
      await sendJson("/api/admin/page-visibility", "PUT", { slug: row.slug, hidden });
      toast.success(hidden ? `«${row.label}» está oculta` : `«${row.label}» ya se ve`);
      router.refresh();
    } catch (err) {
      setState((s) => ({ ...s, [row.slug]: !hidden })); // revertir
      toast.error(errorMessage(err, "No se pudo guardar"));
    } finally {
      setSaving(null);
    }
  }

  const ocultas = rows.filter((r) => state[r.slug]).length;

  const renderRow = (row: VisibilityRow) => {
    const hidden = state[row.slug];
    return (
      <li
        key={row.slug}
        className="flex items-center gap-4 border-t border-gray-100 px-6 py-3.5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                hidden ? "text-gray-500" : "text-gray-900",
              )}
            >
              {row.label}
            </span>
            {hidden ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                Oculta
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-gray-500">
            {row.hint}
          </p>
        </div>

        <a
          href={row.path}
          target="_blank"
          rel="noopener noreferrer"
          title={`Ver ${row.path}`}
          className="hidden items-center gap-1 text-[13px] text-gray-500 transition-colors hover:text-diderot-violet sm:flex"
        >
          {row.path}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>

        <button
          type="button"
          onClick={() => toggle(row)}
          disabled={saving === row.slug}
          aria-pressed={!hidden}
          aria-label={hidden ? `Mostrar ${row.label}` : `Ocultar ${row.label}`}
          title={
            hidden
              ? `Mostrar «${row.label}» en la web`
              : `Ocultar «${row.label}» de la web`
          }
          className={cn(
            "flex h-9 w-9 flex-none items-center justify-center rounded-md border transition-colors disabled:opacity-50",
            hidden
              ? "border-gray-200 bg-gray-50 text-gray-500 hover:text-gray-600"
              : "border-[#BBF7D0] bg-[#DCFCE7] text-[#15803D] hover:bg-[#BBF7D0]",
          )}
        >
          {hidden ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">
          Visualización de las páginas
        </h3>
        <p className="mt-1.5 max-w-[75ch] text-sm text-gray-500">
          Usa el ojo para ocultar una página mientras la preparas. Al ocultarla
          desaparece del menú y su dirección deja de estar disponible para los
          visitantes.{" "}
          <strong className="font-medium text-gray-700">
            Tú puedes seguir viéndola
          </strong>{" "}
          con tu sesión del panel, para trabajar en ella antes de publicarla.
        </p>
        <p className="mt-3 text-xs text-gray-500">
          La portada y las páginas legales (aviso legal, privacidad, cookies y
          accesibilidad) no se pueden ocultar.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-baseline justify-between p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Páginas ({rows.length})
          </h3>
          <p className="text-[13px] text-gray-500">
            {ocultas === 0
              ? "Todas visibles"
              : `${ocultas} oculta${ocultas === 1 ? "" : "s"}`}
          </p>
        </div>
        <ul className="m-0 list-none p-0">{rows.map(renderRow)}</ul>
      </div>

      {sections.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6">
            <h3 className="text-base font-semibold text-gray-900">
              Secciones dentro de páginas ({sections.length})
            </h3>
            <p className="mt-1 max-w-[75ch] text-[13px] text-gray-500">
              Bloques concretos que se pueden apagar sin ocultar la página
              entera. Una sección oculta simplemente no se muestra (la página
              sigue publicada); alguna nace oculta hasta que decidas activarla.
            </p>
          </div>
          <ul className="m-0 list-none p-0">{sections.map(renderRow)}</ul>
        </div>
      ) : null}
    </div>
  );
}
