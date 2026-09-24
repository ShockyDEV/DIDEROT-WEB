import Image from "next/image";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { cn } from "@/lib/cn";

/**
 * Iniciales de nombre y primer apellido. Con la convención española de dos
 * apellidos, el primero es la penúltima palabra: «Luis Ignacio Barrero Pérez»
 * → «LB» (no «LI»), «Sara González Gutiérrez» → «SG», «Ana Pérez» → «AP».
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const apellido = parts.length >= 3 ? parts[parts.length - 2] : parts[1];
  return ((parts[0][0] ?? "") + (apellido?.[0] ?? "")).toUpperCase();
}

/**
 * Retrato circular de un miembro del equipo. Con foto del propio sitio usa
 * next/image; con una URL externa, un <img> normal (next/image exigiría dar
 * de alta cada dominio en next.config). Sin foto, sus iniciales.
 *
 * Es decorativo (alt vacío): el nombre de la persona va siempre al lado.
 * `className` fija el tamaño visible (h-20 w-20…) y, para las iniciales, el
 * cuerpo de letra (text-xl…); `size` es el tamaño intrínseco en píxeles.
 */
export function MemberPhoto({
  name,
  photo,
  size,
  className,
}: Readonly<{
  name: string;
  photo: string | null;
  size: number;
  className?: string;
}>) {
  const frame = cn("flex-none rounded-full object-cover", className);
  if (photo?.startsWith("/")) {
    return (
      <Image src={photo} alt="" width={size} height={size} className={frame} />
    );
  }
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={frame}
      />
    );
  }
  return <InitialsAvatar initials={initialsOf(name)} className={className} />;
}
