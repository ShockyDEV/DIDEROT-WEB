"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Valor final, p. ej. "100+", "4" o "1969". */
  value: string;
  /** Duración en ms. */
  duration?: number;
  className?: string;
}

/**
 * Cifra que cuenta desde 0 hasta su valor al entrar en el viewport.
 * Anima solo el prefijo numérico y conserva el sufijo ("100+" → cuenta
 * hasta 100 y añade "+"). Sin número, o con prefers-reduced-motion,
 * muestra el valor tal cual.
 */
export function CountUp({
  value,
  duration = 1200,
  className,
}: Readonly<CountUpProps>) {
  const match = /^(\d[\d.]*)(.*)$/.exec(value.trim());
  const target = match ? parseInt(match[1].replace(/\./g, ""), 10) : null;
  const suffix = match ? match[2] : "";

  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === null) return;
    // Sin animación si el usuario la evita o si la pestaña está en segundo
    // plano (el navegador pausa requestAnimationFrame y quedaría en 0).
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.visibilityState === "hidden"
    ) {
      setDone(true);
      return;
    }

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico
        setCurrent(Math.round(target * eased));
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDone(true);
        }
      };
      frame = requestAnimationFrame(tick);
    };

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      run();
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  if (target === null) {
    return <span className={className}>{value}</span>;
  }
  const shown = done ? target : current;
  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString("es-ES")}
      {suffix}
    </span>
  );
}
