"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: React.ReactNode;
  /** Retardo en ms (para escalonar tarjetas de una rejilla). */
  delay?: number;
  /** Dirección de entrada: desde abajo (por defecto), lados o zoom suave. */
  from?: "bottom" | "left" | "right" | "scale";
  className?: string;
}

const FROM_CLASS: Record<NonNullable<RevealProps["from"]>, string> = {
  bottom: "reveal",
  left: "reveal reveal-left",
  right: "reveal reveal-right",
  scale: "reveal reveal-scale",
};

/**
 * Aparición suave al entrar en el viewport (fade + leve desplazamiento),
 * una sola vez. Usar con moderación: secciones y rejillas de tarjetas, no
 * todos los elementos. Si el usuario prefiere menos movimiento
 * (prefers-reduced-motion), el contenido se muestra sin animar.
 */
export function Reveal({
  children,
  delay = 0,
  from = "bottom",
  className,
}: Readonly<RevealProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    // Lo que ya está en el viewport al montar se anima de inmediato (la
    // transición corre igualmente: el primer render pintó con opacidad 0).
    // Cubre además pestañas en segundo plano, donde el observer no calcula.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(FROM_CLASS[from], visible && "reveal-visible", className)}
    >
      {children}
    </div>
  );
}
