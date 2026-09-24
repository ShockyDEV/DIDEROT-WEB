import { ArrowUpRight, ChevronDown, LockOpen, Star } from "lucide-react";
import { publicationTypeLabel } from "@/lib/content/publication-types";
import { cn } from "@/lib/cn";
import { pick, type Locale } from "@/lib/locale";
import type { PublicPublication } from "@/lib/publications-service";
import {
  formatAuthors,
  publicationLinks,
  urlLabel,
  withPeriod,
} from "@/components/publicaciones/publication-meta";

const linkClass =
  "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-surface-card px-3 py-1 text-xs font-medium text-diderot-violet transition-colors hover:border-diderot-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page";

/**
 * Chip «Acceso abierto» (verde, como el «En curso» de los proyectos). En
 * oscuro baja a un verde translúcido para no deslumbrar sobre la tarjeta.
 */
export function OpenAccessBadge({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#15803D] dark:bg-emerald-900/40 dark:text-emerald-300">
      <LockOpen className="h-3 w-3 flex-none" aria-hidden="true" />
      {pick(locale, "Acceso abierto", "Open access")}
    </span>
  );
}

/**
 * Una publicación como referencia bibliográfica: «Autores (año). Título.
 * En *Revista o libro*, detalles.», con su tipo, el distintivo de acceso
 * abierto, los enlaces (DOI y/o dirección) y el resumen desplegable. Las
 * destacadas llevan una barra dorada en el margen y una estrella.
 */
export function PublicationReference({
  pub,
  locale,
}: Readonly<{ pub: PublicPublication; locale: Locale }>) {
  const { doiHref, url } = publicationLinks(pub);
  const authors = formatAuthors(pub.authors);
  // Los capítulos se publican «en» un libro (el venue es el libro).
  const enLibro = pub.type === "CHAPTER" && pub.venue;

  return (
    <article className="relative py-5">
      {pub.featured ? (
        <span
          aria-hidden="true"
          className="absolute -left-4 bottom-5 top-5 w-[3px] rounded-full bg-diderot-gold"
        />
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 text-xs font-medium text-ink">
          {publicationTypeLabel(pub.type, locale)}
        </span>
        {pub.openAccess ? <OpenAccessBadge locale={locale} /> : null}
        {pub.featured ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-diderot-amber">
            <Star className="h-3.5 w-3.5 flex-none fill-current" aria-hidden="true" />
            {pick(locale, "Destacada", "Featured")}
          </span>
        ) : null}
      </div>

      <p className="text-[15px] leading-relaxed text-gray-600">
        {authors ? <span className="text-gray-700">{authors} </span> : null}(
        {pub.year}).{" "}
        <cite className="font-semibold not-italic text-gray-900">
          {withPeriod(pub.title)}
        </cite>
        {pub.venue ? (
          <>
            {" "}
            {enLibro ? pick(locale, "En ", "In ") : null}
            <em>{pub.details ? pub.venue : withPeriod(pub.venue)}</em>
            {pub.details ? `, ${withPeriod(pub.details)}` : null}
          </>
        ) : pub.details ? (
          ` ${withPeriod(pub.details)}`
        ) : null}
      </p>

      {doiHref || url ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {doiHref ? (
            <a
              href={doiHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(linkClass, "break-all")}
            >
              <span className="font-semibold">DOI</span>
              <span className="text-gray-600">{pub.doi}</span>
              <ArrowUpRight className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            </a>
          ) : null}
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {urlLabel(url, locale)}
              <ArrowUpRight className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}

      {pub.abstract ? (
        <details className="group/abs mt-3">
          <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded text-[13px] font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page [&::-webkit-details-marker]:hidden">
            <ChevronDown
              className="h-3.5 w-3.5 flex-none transition-transform group-open/abs:rotate-180"
              aria-hidden="true"
            />
            {pick(locale, "Resumen", "Abstract")}
          </summary>
          <p className="mt-2 max-w-[80ch] text-sm leading-relaxed text-gray-600">
            {pub.abstract}
          </p>
        </details>
      ) : null}
    </article>
  );
}
