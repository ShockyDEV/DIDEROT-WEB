import { publicationTypeLabel } from "@/lib/content/publication-types";
import type { Locale } from "@/lib/locale";
import type { PublicPublication } from "@/lib/publications-service";
import { OpenAccessBadge } from "@/components/publicaciones/publication-reference";
import {
  formatAuthors,
  primaryHref,
} from "@/components/publicaciones/publication-meta";

/**
 * Publicación destacada (portada): filete superior, tipo en cursiva y año,
 * título, autores y revista. Toda la pieza enlaza al DOI (o a la dirección de
 * la publicación) en pestaña nueva. Sin caja ni cápsulas.
 */
export function PublicationCard({
  pub,
  locale,
}: Readonly<{ pub: PublicPublication; locale: Locale }>) {
  const href = primaryHref(pub);
  const pieza = (
    <article className="flex h-full flex-col border-t border-gray-300 pt-4 transition-colors group-hover:border-diderot-gold">
      <p className="mb-2 text-sm">
        <span className="font-serif text-[15px] italic text-diderot-amber">
          {publicationTypeLabel(pub.type, locale)}
        </span>
        <span className="text-gray-500">, </span>
        <span className="tabular-nums text-gray-500">{pub.year}</span>
      </p>
      <h3 className="mb-2 text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-ink">
        {pub.title}
        {href ? (
          <span className="ml-1 text-gray-400" aria-hidden="true">
            ↗
          </span>
        ) : null}
      </h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
        {formatAuthors(pub.authors)}
      </p>
      {pub.venue ? (
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          <em>{pub.venue}</em>
        </p>
      ) : null}
      {pub.openAccess ? (
        <div className="mt-auto pt-4">
          <OpenAccessBadge locale={locale} />
        </div>
      ) : null}
    </article>
  );
  if (!href) return pieza;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-4 focus-visible:ring-offset-surface-page"
    >
      {pieza}
    </a>
  );
}
