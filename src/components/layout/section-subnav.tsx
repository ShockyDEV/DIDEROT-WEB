import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocale } from "@/lib/locale-server";

export interface SubnavItem {
  id: string;
  label: string;
  /**
   * Destino externo. Si se indica, el ítem sale de la página en vez de saltar
   * al ancla `id` (p. ej. la reserva de espacios, que vive en otra web).
   */
  external?: string;
}

interface SectionSubnavProps {
  items: SubnavItem[];
  /** Ancla activa por defecto (la primera si no se indica). */
  activeId?: string;
}

/**
 * Subnavegación de anclas dentro de una página larga (patrón de las cabeceras
 * de Instituto e Investigación). El ítem activo lleva subrayado rojo. Los
 * enlaces saltan a cada sección; las secciones destino usan `scroll-mt` para
 * dejar hueco a la cabecera fija.
 */
export function SectionSubnav({
  items,
  activeId,
}: Readonly<SectionSubnavProps>) {
  const en = getLocale() === "en";
  // Un ítem externo nunca es «la sección en la que estás».
  const active = activeId ?? items.find((i) => !i.external)?.id;
  return (
    <nav
      aria-label={en ? "Sections on this page" : "Secciones de esta página"}
      className="flex gap-6 overflow-x-auto text-sm font-medium"
    >
      {items.map((item) => {
        const isActive = !item.external && item.id === active;
        const clase = cn(
          "whitespace-nowrap border-b-2 py-2.5 transition-colors",
          isActive
            ? "border-diderot-amber text-ink"
            : "border-transparent text-gray-600 hover:text-gray-900",
        );
        if (item.external) {
          return (
            <a
              key={item.id}
              href={item.external}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(clase, "inline-flex items-center gap-1.5")}
            >
              {item.label}
              <ExternalLink className="h-3 w-3 flex-none" aria-hidden="true" />
            </a>
          );
        }
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={isActive ? "true" : undefined}
            className={clase}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
