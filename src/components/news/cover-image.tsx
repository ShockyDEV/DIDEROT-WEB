import Image from "next/image";
import { cn } from "@/lib/cn";
import { isLocalPath } from "@/lib/validations";

interface CoverImageProps {
  /** Ruta de la portada (p. ej. /uploads/noticias/foto.jpg) o null. */
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: "none" | "xl";
  /** Atributo sizes de next/image para el responsive. */
  sizes?: string;
  /** Zoom suave al pasar el ratón (requiere `group` en la tarjeta padre). */
  zoom?: boolean;
}

/**
 * Portada de noticia. Si no hay imagen, se muestra una portada de marca:
 * degradado suave con el logo de DIDEROT en filigrana y un pentagrama de
 * fondo, para que la tarjeta se vea intencionada y no "rota".
 *
 * Las portadas del gestor son rutas locales (/uploads/…, /images/…) y pasan
 * por next/image; si alguien pega una URL externa, se pinta con un <img>
 * normal (next/image solo optimiza dominios declarados y lanzaría un error).
 */
export function CoverImage({
  src,
  alt,
  className,
  rounded = "none",
  sizes = "(max-width: 1024px) 100vw, 33vw",
  zoom = false,
}: Readonly<CoverImageProps>) {
  const zoomClass =
    zoom &&
    "transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.05]";

  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-diderot-pale via-surface-card to-diderot-pale",
          rounded === "xl" && "rounded-xl",
          className,
        )}
      >
        {/* El pentagrama va en su propia capa: .staff-lines también usa
            background-image y taparía el degradado. */}
        <span className="staff-lines absolute inset-0" />
        <Image
          src="/images/diderot-logo.png"
          alt=""
          width={1023}
          height={295}
          className="relative h-auto w-[50%] max-w-[240px] opacity-[0.22] saturate-[0.7] dark:hidden"
        />
        <Image
          src="/images/diderot-logo-white.png"
          alt=""
          width={1023}
          height={295}
          className="relative hidden h-auto w-[50%] max-w-[240px] opacity-[0.2] dark:block"
        />
      </div>
    );
  }

  const local = isLocalPath(src);
  const external = !local && /^https:\/\//i.test(src);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-100",
        rounded === "xl" && "rounded-xl",
        className,
      )}
    >
      {local ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn("object-cover", zoomClass)}
        />
      ) : external ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn("absolute inset-0 h-full w-full object-cover", zoomClass)}
        />
      ) : null}
    </div>
  );
}
