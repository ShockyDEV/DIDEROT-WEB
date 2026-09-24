import { cn } from "@/lib/cn";

interface SoundWaveProps {
  /** Número de barras (3–7). */
  bars?: number;
  className?: string;
}

/**
 * Firma visual de DIDEROT: pequeñas barras de ecualizador que laten
 * suavemente (CSS puro, ver .sound-wave en globals.css). Decorativa: queda
 * fuera del árbol de accesibilidad y se detiene con prefers-reduced-motion.
 * Toma el color del texto (currentColor): p. ej. `text-diderot-gold`.
 */
export function SoundWave({ bars = 5, className }: Readonly<SoundWaveProps>) {
  const n = Math.min(7, Math.max(3, bars));
  return (
    <span aria-hidden="true" className={cn("sound-wave", className)}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}
