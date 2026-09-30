import Link from "next/link";
import { CoverImage } from "@/components/news/cover-image";
import { Gota } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";

/**
 * Pieza de noticia para listados (portada, Noticias, relacionadas): imagen,
 * categoría con la gota y fecha, título y entradilla. Sin caja ni cápsulas:
 * la jerarquía la marcan la tipografía y el aire.
 */
export function NewsMeta({
  category,
  date,
  dateTime,
  className,
}: Readonly<{ category: string; date: string; dateTime?: string; className?: string }>) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]", className)}>
      <span className="status">
        <Gota className="text-diderot-gold" />
        {category}
      </span>
      <time dateTime={dateTime} className="tabular-nums text-gray-500">
        {date}
      </time>
    </p>
  );
}

export function NewsTeaser({
  href,
  title,
  excerpt,
  category,
  date,
  dateTime,
  coverImage,
  photoLabel,
  as: Heading = "h3",
  className,
}: Readonly<{
  href: string;
  title: string;
  excerpt?: string | null;
  category: string;
  date: string;
  dateTime?: string;
  coverImage?: string | null;
  photoLabel: string;
  as?: "h2" | "h3";
  className?: string;
}>) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-4 focus-visible:ring-offset-surface-page",
        className,
      )}
    >
      <CoverImage
        src={coverImage}
        alt={photoLabel}
        zoom
        className="aspect-[1200/630] w-full rounded"
      />
      <NewsMeta category={category} date={date} dateTime={dateTime} className="mt-1" />
      <Heading className="text-lg font-semibold leading-snug text-gray-900">
        <span className="link-trace">{title}</span>
      </Heading>
      {excerpt ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{excerpt}</p>
      ) : null}
    </Link>
  );
}
