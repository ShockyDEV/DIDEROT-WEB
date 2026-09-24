"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DropdownLink {
  label: string;
  href: string;
  /** Sale del sitio (p. ej. la reserva de espacios): <a> y aviso visual. */
  external?: boolean;
}

interface NavDropdownProps {
  label: string;
  /** La página entera; el rótulo sigue siendo un enlace normal. */
  href: string;
  active: boolean;
  items: DropdownLink[];
  /** Rótulo accesible del botón que abre («Apartados de Instituto»). */
  toggleLabel: string;
}

/**
 * Ítem del menú con desplegable de apartados (anclas de su propia página).
 *
 * El rótulo NO deja de ser un enlace: sigue llevando a la página entera. Lo
 * que abre el desplegable es un botón aparte (la flechita), para no robarle
 * el clic. Se abre al pasar el ratón por el conjunto, y con teclado mediante
 * el botón (Enter/Espacio); Escape lo cierra y devuelve el foco.
 */
export function NavDropdown({
  label,
  href,
  active,
  items,
  toggleLabel,
}: Readonly<NavDropdownProps>) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Escape cierra y devuelve el foco al botón; un clic fuera solo cierra.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      boton.current?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={box}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      // Si el foco sale del conjunto con el tabulador, se cierra solo.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <span
        className={cn(
          "flex h-[68px] items-center gap-0.5 border-b-2 border-transparent transition-colors",
          active ? "border-diderot-amber text-ink" : "hover:text-gray-900",
        )}
      >
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
        >
          {label}
        </Link>
        <button
          ref={boton}
          type="button"
          aria-label={toggleLabel}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
          className="flex h-5 w-5 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
        >
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </span>
      {open ? (
        <ul className="absolute left-0 top-[64px] z-50 min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-surface-card py-1.5 shadow-md">
          {items.map((s) => {
            const clase =
              "block px-4 py-2 text-sm font-normal text-gray-600 transition-colors hover:bg-diderot-pale hover:text-ink focus-visible:bg-diderot-pale focus-visible:text-ink focus-visible:outline-none";
            return (
              <li key={s.href}>
                {s.external ? (
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={cn(clase, "flex items-center gap-1.5")}
                  >
                    {s.label}
                    <ExternalLink
                      className="h-3 w-3 flex-none"
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <Link
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className={clase}
                  >
                    {s.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
