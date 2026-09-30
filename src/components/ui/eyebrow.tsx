import { cn } from "@/lib/cn";

/**
 * Antetítulo de sección: serif en cursiva, en minúscula normal, con la «gota»
 * del logo delante (estilos .eyebrow y .gota de globals.css). Sustituye a las
 * mayúsculas espaciadas.
 */
export function Eyebrow({
  children,
  className,
  as: Tag = "p",
  id,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span" | "h2" | "h3";
  id?: string;
}>) {
  return (
    <Tag id={id} className={cn("eyebrow", className)}>
      <span className="gota" aria-hidden="true" />
      <span>{children}</span>
    </Tag>
  );
}

/** Gota del logo como marcador suelto (estados, viñetas). Decorativa. */
export function Gota({ className }: Readonly<{ className?: string }>) {
  return <span className={cn("gota", className)} aria-hidden="true" />;
}
