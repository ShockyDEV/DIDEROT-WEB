import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/breadcrumb";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";

/**
 * Cabecera común de las páginas interiores: migas, antetítulo en cursiva con
 * la gota, titular y entradilla editable. Lo que cuelga debajo (subnavegación,
 * filtros, buscador) llega como `children`, pegado al filete inferior.
 */
export function PageHeader({
  breadcrumb,
  eyebrow,
  title,
  intro,
  children,
  className,
}: Readonly<{
  breadcrumb: BreadcrumbItem[];
  eyebrow?: string;
  title: string;
  /** HTML del bloque editable (ya saneado por el servicio de bloques). */
  intro?: string;
  children?: React.ReactNode;
  className?: string;
}>) {
  return (
    <section className="border-b border-gray-200 bg-surface-card">
      <div className={cn("mx-auto max-w-6xl px-6 pt-12", children ? "pb-0" : "pb-12", className)}>
        <div className="mb-6">
          <Breadcrumb items={breadcrumb} />
        </div>
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h1 className="mb-4 max-w-[22ch] text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-[46px]">
          {title}
        </h1>
        {intro ? (
          <div
            className="page-block max-w-[66ch] text-[17px] leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        ) : null}
        {children}
      </div>
    </section>
  );
}
