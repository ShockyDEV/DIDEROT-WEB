import Image from "next/image";
import { cn } from "@/lib/cn";

interface CoverImageProps {
  /** Ruta de la portada (p. ej. /uploads/legacy/foto.jpg) o null. */
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
 * Portada de noticia. Si no hay imagen (47 noticias históricas tampoco la
 * tenían en la web antigua), se muestra una portada de marca: degradado
 * suave con el logo del IUCE en filigrana, para que la tarjeta se vea
 * intencionada y no "rota".
 */
export function CoverImage({
  src,
  alt,
  className,
  rounded = "none",
  sizes = "(max-width: 1024px) 100vw, 33vw",
  zoom = false,
}: Readonly<CoverImageProps>) {
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
        <Image
          src="/images/iuce-logo.png"
          alt=""
          width={800}
          height={362}
          className="h-auto w-[42%] max-w-[210px] opacity-[0.18] saturate-[0.6] dark:hidden"
        />
        <Image
          src="/images/iuce-logo-white.webp"
          alt=""
          width={640}
          height={196}
          className="hidden h-auto w-[46%] max-w-[220px] opacity-[0.22] dark:block"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-100",
        rounded === "xl" && "rounded-xl",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cn(
          "object-cover",
          zoom &&
            "transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.05]",
        )}
      />
    </div>
  );
}
