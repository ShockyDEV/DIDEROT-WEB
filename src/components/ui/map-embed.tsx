import { cn } from "@/lib/cn";

const DEFAULT_QUERY =
  "Facultad de Educación, Paseo de Canalejas 169, 37008 Salamanca";

interface MapEmbedProps {
  /** Búsqueda de Google Maps (dirección o nombre del lugar). */
  query?: string;
  title?: string;
  className?: string;
}

/**
 * Mapa de Google embebido (sin clave de API: usa el modo output=embed).
 * Señala la sede del IUCE en el Edificio Solís / Facultad de Educación.
 */
export function MapEmbed({
  query = DEFAULT_QUERY,
  title = "Mapa — Edificio Solís, Paseo de Canalejas 169, Salamanca",
  className,
}: Readonly<MapEmbedProps>) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=17&output=embed`;
  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      className={cn(
        "w-full rounded-xl border border-gray-200 bg-gray-100",
        className,
      )}
    />
  );
}
