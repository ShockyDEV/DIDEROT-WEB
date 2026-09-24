import Link from "next/link";
import { getLocale } from "@/lib/locale-server";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Miga de pan. El último elemento (sin `href`) se marca como la página actual.
 */
export function Breadcrumb({
  items,
}: Readonly<{ items: BreadcrumbItem[] }>) {
  return (
    <nav
      aria-label={getLocale() === "en" ? "Breadcrumb" : "Miga de pan"}
      className="text-xs text-gray-500"
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={item.label}>
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-gray-600">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-gray-500" : undefined}>
                {item.label}
              </span>
            )}
            {!last ? (
              <span aria-hidden="true" className="mx-1.5">
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
