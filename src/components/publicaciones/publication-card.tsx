import { publicationTypeLabel } from "@/lib/content/publication-types";
import type { Locale } from "@/lib/locale";
import type { PublicPublication } from "@/lib/publications-service";
import { OpenAccessBadge } from "@/components/publicaciones/publication-reference";
import {
  formatAuthors,
  primaryHref,
} from "@/components/publicaciones/publication-meta";

/**
 * Tarjeta de publicación destacada (portada), heredera de la «muestra de
 * artículos» de la página de Investigación del IUCE: antetítulo con tipo y
 * año, título, autores y revista. Toda la tarjeta enlaza al DOI (o a la
 * dirección de la publicación) en pestaña nueva.
 */
export function PublicationCard({
  pub,
  locale,
}: Readonly<{ pub: PublicPublication; locale: Locale }>) {
  const href = primaryHref(pub);
  const tarjeta = (
    <article className="card-lift flex h-full flex-col rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm hover:border-brand-400 hover:shadow-md">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-diderot-amber">
        {publicationTypeLabel(pub.type, locale)} · {pub.year}
      </p>
      <h3 className="mb-2 text-[15px] font-semibold leading-snug text-gray-900">
        {pub.title}
        {href ? (
          <span className="ml-1 text-gray-300" aria-hidden="true">
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
  if (!href) return tarjeta;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
    >
      {tarjeta}
    </a>
  );
}
