import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { InstitutionalFooter } from "@/components/layout/institutional-footer";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

// Textos fijos en ambos idiomas. Ojo: esta página puede renderizarse fuera
// de una petición (build estático); getLocale() ya devuelve "es" en ese caso.
const T = {
  es: {
    error: "Error 404",
    titulo: "Esta página no existe",
    ayuda:
      "Puede que el enlace haya cambiado con la nueva web del IUCE. Prueba desde la portada o busca en las noticias.",
    irPortada: "Ir a la portada",
    verNoticias: "Ver las noticias",
  },
  en: {
    error: "Error 404",
    titulo: "Page not found",
    ayuda:
      "The link may have changed with the new IUCE website. Try starting from the home page or searching the news.",
    irPortada: "Go to the home page",
    verNoticias: "See the news",
  },
} as const;

/** Página 404 con la identidad del IUCE y salidas útiles. */
export default function NotFound() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] items-center">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-diderot-pale text-ink">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.error}
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-ink">
            {t.titulo}
          </h1>
          <p className="mx-auto mb-8 max-w-[55ch] text-base leading-relaxed text-gray-600">
            {t.ayuda}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={href("/")} className={buttonClassName({ size: "lg" })}>
              {t.irPortada}
            </Link>
            <Link
              href={href("/noticias")}
              className={buttonClassName({ variant: "outline", size: "lg" })}
            >
              {t.verNoticias}
            </Link>
          </div>
        </div>
      </main>
      <InstitutionalFooter />
    </>
  );
}
