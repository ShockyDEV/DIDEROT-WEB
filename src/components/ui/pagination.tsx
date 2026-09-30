import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Números de página a mostrar: 1 … (p-1) p (p+1) … total, sin repetidos. */
export function pageNumbers(current: number, total: number): Array<number | "…"> {
  const wanted = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const list = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const n of list) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

/**
 * Paginación tipográfica (Noticias, Publicaciones): números de página como
 * pestañas de texto, la actual subrayada en ámbar; anterior y siguiente como
 * enlaces subrayados. Sin cajas. Funciona sin JS (enlaces normales).
 */
export function Pagination({
  current,
  total,
  hrefFor,
  labels,
}: Readonly<{
  current: number;
  total: number;
  hrefFor: (page: number) => string;
  labels: {
    nav: string;
    prev: string;
    next: string;
    page: (page: number) => string;
  };
}>) {
  if (total <= 1) return null;
  return (
    <nav
      aria-label={labels.nav}
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 pb-14 pt-6 text-sm"
    >
      {current > 1 ? (
        <Link href={hrefFor(current - 1)} className="link-sub inline-flex items-center gap-1 font-medium">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {labels.prev}
        </Link>
      ) : (
        <span aria-hidden="true" className="inline-flex items-center gap-1 text-gray-400">
          <ChevronLeft className="h-4 w-4" />
          {labels.prev}
        </span>
      )}

      <ol className="flex list-none items-center gap-x-4 p-0">
        {pageNumbers(current, total).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="text-gray-400">
              …
            </li>
          ) : (
            <li key={p}>
              {p === current ? (
                <span aria-current="page" className="tab min-w-[1.25rem] justify-center tabular-nums">
                  <span className="sr-only">{labels.page(p)}</span>
                  <span aria-hidden="true">{p}</span>
                </span>
              ) : (
                <Link
                  href={hrefFor(p)}
                  aria-label={labels.page(p)}
                  className="tab min-w-[1.25rem] justify-center tabular-nums"
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      {current < total ? (
        <Link href={hrefFor(current + 1)} className="link-sub inline-flex items-center gap-1 font-medium">
          {labels.next}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className="inline-flex items-center gap-1 text-gray-400">
          {labels.next}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
