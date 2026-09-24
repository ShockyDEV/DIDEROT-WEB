import Image from "next/image";
import { CalendarDays, Expand } from "lucide-react";
import { cn } from "@/lib/cn";
import { isLocalPath } from "@/lib/validations";

interface EventPosterProps {
  /** Cartel o imagen del evento (ruta local o https), o null. */
  src: string | null;
  /** Texto alternativo (p. ej. «Cartel: Jornada I…»). */
  alt: string;
  /**
   * Si se indica, el cartel enlaza a la imagen a tamaño completo (pestaña
   * nueva) y este texto completa el nombre accesible del enlace.
   */
  zoomLabel?: string;
  className?: string;
  /** Atributo sizes de next/image. */
  sizes?: string;
  priority?: boolean;
}

/**
 * Cartel de evento. Los carteles son verticales (A4) y llevan texto, así que
 * nunca se recortan: se muestran enteros (object-contain) sobre un fondo
 * tintado con pentagrama, como un cartel colgado en un tablón. Sin imagen,
 * el hueco se rellena con el mismo fondo y un icono de calendario.
 */
export function EventPoster({
  src,
  alt,
  zoomLabel,
  className,
  sizes = "(max-width: 640px) 100vw, 360px",
  priority = false,
}: Readonly<EventPosterProps>) {
  const frame = cn(
    "staff-lines relative block overflow-hidden bg-surface-tinted",
    className,
  );

  if (!src) {
    return (
      <div aria-hidden="true" className={cn(frame, "flex items-center justify-center")}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-card text-ink shadow-sm">
          <CalendarDays className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
    );
  }

  const local = isLocalPath(src);
  const image = (
    // Capa interior con margen: el cartel «respira» dentro del marco.
    <span className="absolute inset-3 sm:inset-4">
      {local ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain drop-shadow-md"
        />
      ) : (
        // URL externa: next/image solo optimiza dominios declarados.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-contain drop-shadow-md"
        />
      )}
    </span>
  );

  if (!zoomLabel) {
    return <div className={frame}>{image}</div>;
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        frame,
        "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-diderot-violet",
      )}
    >
      {image}
      <span className="sr-only">{zoomLabel}</span>
      {/* Pista visual de «ampliar» al pasar el ratón o con el foco. */}
      <span
        aria-hidden="true"
        className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface-card text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Expand className="h-4 w-4" aria-hidden="true" />
      </span>
    </a>
  );
}
