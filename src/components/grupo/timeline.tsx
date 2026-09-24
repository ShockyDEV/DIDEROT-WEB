import { ExternalLink } from "lucide-react";
import { iconFor } from "@/lib/icon-map";
import type { ListItem } from "@/lib/content/list-blocks";

interface TimelineProps {
  items: ListItem[];
  /** Rótulo accesible de la lista (la sección ya tiene su encabezado). */
  label: string;
}

/**
 * Línea del tiempo del Instituto: un hilo vertical con un hito por año, su
 * icono en un nodo sobre la línea y, si el hito lo tiene, un enlace al
 * documento que lo respalda. Los datos salen de la lista editable
 * `instituto:list:hitos` (icono, etiqueta, texto, enlace, enlaceTexto).
 */
export function Timeline({ items, label }: Readonly<TimelineProps>) {
  return (
    <ol aria-label={label} className="relative flex flex-col gap-7">
      {/* El hilo: arranca y muere en el centro de los nodos extremos (los
          nodos miden 36px), así no asoma por arriba ni por abajo. */}
      <span
        aria-hidden="true"
        className="absolute bottom-[18px] left-[18px] top-[18px] w-px bg-gray-200"
      />
      {items.map((h, i) => {
        const Icon = iconFor(h.icon);
        const enlace = String(h.enlace ?? "").trim();
        const enlaceTexto = String(h.enlaceTexto ?? "").trim();
        return (
          <li key={i} className="relative flex items-start gap-4">
            <span className="z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-gray-200 bg-surface-card shadow-sm">
              <Icon className="h-[18px] w-[18px] text-ink" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-bold leading-none text-ink">
                {String(h.etiqueta)}
              </p>
              <p className="mt-1.5 text-sm leading-snug text-gray-600">
                {String(h.texto)}
              </p>
              {enlace ? (
                <a
                  href={enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-tinted"
                >
                  {enlaceTexto || enlace}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
