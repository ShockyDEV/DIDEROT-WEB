import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { SoundWave } from "@/components/ui/sound-wave";
import { SiteHeader } from "@/components/layout/site-header";
import { InstitutionalFooter } from "@/components/layout/institutional-footer";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

// Textos fijos en ambos idiomas. Ojo: esta página puede renderizarse fuera
// de una petición (build estático); getLocale() ya devuelve "es" en ese caso.
// Por lo mismo, aquí no se consulta la base de datos.
const T = {
  es: {
    error: "Error 404",
    titulo: "Esta página no existe",
    lema: "Parece que esta nota se ha salido del pentagrama.",
    ayuda:
      "Puede que el enlace sea de la web anterior del grupo o que la página haya cambiado de sitio. Prueba desde la portada o desde alguna de estas secciones:",
    secciones: "Secciones de la web",
    irPortada: "Ir a la portada",
    verNoticias: "Ver las noticias",
    enlaces: [
      { href: "/grupo", label: "El grupo" },
      { href: "/investigacion", label: "Investigación" },
      { href: "/publicaciones", label: "Publicaciones" },
      { href: "/eventos", label: "Eventos" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  en: {
    error: "Error 404",
    titulo: "Page not found",
    lema: "It looks like this note has slipped off the stave.",
    ayuda:
      "The link may come from the group's previous website, or the page may have moved. Try starting from the home page or from one of these sections:",
    secciones: "Website sections",
    irPortada: "Go to the home page",
    verNoticias: "See the news",
    enlaces: [
      { href: "/grupo", label: "The group" },
      { href: "/investigacion", label: "Research" },
      { href: "/publicaciones", label: "Publications" },
      { href: "/eventos", label: "Events" },
      { href: "/contacto", label: "Contact" },
    ],
  },
} as const;

/** Página 404 con la identidad de DIDEROT y salidas útiles. */
export default function NotFound() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex min-h-[60vh] items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center">
          {/* Firma sonora sobre un pentagrama (decorativo). */}
          <div
            aria-hidden="true"
            className="staff-lines mx-auto mb-7 flex h-[70px] max-w-[420px] items-center justify-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-diderot-indigo text-diderot-gold shadow-sm">
              <SoundWave bars={5} />
            </span>
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.error}
          </p>
          <h1 className="mb-3 text-balance text-4xl font-bold tracking-tight text-ink">
            {t.titulo}
          </h1>
          <p className="mx-auto mb-2 max-w-[55ch] text-lg leading-relaxed text-gray-700">
            {t.lema}
          </p>
          <p className="mx-auto mb-8 max-w-[60ch] text-base leading-relaxed text-gray-600">
            {t.ayuda}
          </p>
          <nav aria-label={t.secciones} className="mb-9">
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {t.enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={href(e.href)}
                    className="flex h-[34px] items-center rounded-full border border-gray-300 bg-surface-card px-4 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
