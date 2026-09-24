import { Download } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";

/**
 * Visor de PDF embebido con enlace de descarga. Usa <object>, que en
 * escritorio muestra el visor nativo del navegador; si el navegador no
 * puede mostrarlo (móviles, lectores), se ve el contenido alternativo
 * con el botón de descarga. El botón se repite fuera para que siempre
 * haya una vía visible de obtener el documento.
 */
export function PdfEmbed({
  src,
  title,
  downloadLabel = "Descargar el PDF",
  fallbackText = "Tu navegador no puede mostrar el PDF incrustado.",
  openLabel = "Abrir el documento",
}: Readonly<{
  src: string;
  title: string;
  downloadLabel?: string;
  /** Texto del contenido alternativo cuando no se puede incrustar el PDF. */
  fallbackText?: string;
  /** Etiqueta del enlace de apertura en el contenido alternativo. */
  openLabel?: string;
}>) {
  return (
    <figure className="flex flex-col gap-3.5">
      <object
        data={src}
        type="application/pdf"
        title={title}
        aria-label={title}
        className="h-[75vh] min-h-[420px] w-full rounded-xl border border-gray-200 bg-surface-card shadow-sm"
      >
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-gray-500">{fallbackText}</p>
          <a href={src} target="_blank" rel="noopener noreferrer" className={buttonClassName()}>
            {openLabel}
          </a>
        </div>
      </object>
      <figcaption className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{title}</span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName({ variant: "outline", size: "sm" }) + " gap-1.5"}
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {downloadLabel}
        </a>
      </figcaption>
    </figure>
  );
}
