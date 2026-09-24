"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Ancho: md (formularios cortos), lg (fichas), xl (vista previa ORCID). */
  size?: "md" | "lg" | "xl";
}

const WIDTHS = {
  md: "max-w-[560px]",
  lg: "max-w-[760px]",
  xl: "max-w-[1100px]",
} as const;

/**
 * Diálogo modal del panel de administración (crear/editar registros y ver
 * mensajes). Cierra con Escape o clic en el fondo y bloquea el scroll de la
 * página mientras está abierto.
 */
export function Modal({ title, onClose, children, size = "md" }: Readonly<ModalProps>) {
  // El listener lee siempre el onClose más reciente sin re-suscribirse en
  // cada render (los padres suelen pasar una función en línea).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "max-h-[88vh] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-md",
          WIDTHS[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
