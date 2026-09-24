"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ExternalLink, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  pathLocale,
  pick,
  stripLocale,
  withLocale,
  type Locale,
} from "@/lib/locale";
import { NavDropdown } from "./nav-dropdown";
import { ThemeToggle } from "./theme-toggle";

interface SubNavItem {
  label: string;
  labelEn: string;
  /** Ancla dentro de la propia página (el id de su <section>). */
  hash: string;
  /** URL completa si el apartado vive fuera (p. ej. reserva de espacios). */
  externalHref?: string;
}

interface NavItem {
  label: string;
  labelEn: string;
  href: string;
  external?: boolean;
  /**
   * Apartados de la página, para el desplegable. Deben coincidir con los ids
   * y rótulos de la SectionSubnav de esa página: llevan al mismo sitio.
   */
  sub?: SubNavItem[];
}

const NAV: NavItem[] = [
  { label: "Inicio", labelEn: "Home", href: "/" },
  {
    label: "El grupo",
    labelEn: "The group",
    href: "/grupo",
    sub: [
      { label: "Presentación", labelEn: "About us", hash: "presentacion" },
      { label: "Objetivos", labelEn: "Aims", hash: "objetivos" },
      { label: "Equipo", labelEn: "Team", hash: "equipo" },
      { label: "Afiliación", labelEn: "Affiliation", hash: "afiliacion" },
    ],
  },
  {
    label: "Investigación",
    labelEn: "Research",
    href: "/investigacion",
    sub: [
      { label: "Líneas de investigación", labelEn: "Research lines", hash: "lineas" },
      { label: "Proyectos", labelEn: "Projects", hash: "proyectos" },
    ],
  },
  { label: "Publicaciones", labelEn: "Publications", href: "/publicaciones" },
  { label: "Transferencia", labelEn: "Knowledge transfer", href: "/transferencia" },
  { label: "Formación", labelEn: "Training", href: "/formacion" },
  { label: "Eventos", labelEn: "Events", href: "/eventos" },
  { label: "Noticias", labelEn: "News", href: "/noticias" },
  { label: "Contacto", labelEn: "Contact", href: "/contacto" },
];

// En escritorio, Inicio vive en el logo; el menú móvil sí lo muestra.
const DESKTOP_HIDDEN = new Set(["/"]);

function isActive(basePath: string, href: string) {
  if (href === "/") return basePath === "/";
  return basePath === href || basePath.startsWith(`${href}/`);
}

/** Conmutador ES|EN: misma página en el otro idioma, conservando la query.
 *
 * OJO: son <a> nativos a propósito, NO <Link>. El i18n reescribe /en/* a la
 * misma ruta española con la cabecera x-locale, así que ambos idiomas
 * comparten árbol en el router cache de Next: con <Link>, al pulsar EN el
 * cliente reutilizaba el árbol recién pintado en español y solo cambiaba la
 * URL. La navegación de documento completo fuerza el render del servidor en
 * el idioma nuevo y vacía el router cache, dejando toda la sesión coherente. */
function LanguageToggleView({
  basePath,
  locale,
  qs,
}: Readonly<{ basePath: string; locale: Locale; qs: string }>) {
  const hrefFor = (l: Locale) =>
    withLocale(basePath, l) + (qs ? `?${qs}` : "");
  const linkClass = (active: boolean) =>
    cn(
      "inline-flex h-6 min-w-[24px] items-center justify-center rounded px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet",
      active
        ? "text-gray-800"
        : "font-normal text-gray-500 hover:text-gray-700",
    );
  return (
    <nav
      aria-label={pick(locale, "Idioma", "Language")}
      className="text-xs font-semibold"
    >
      <a
        href={hrefFor("es")}
        aria-current={locale === "es" ? "true" : undefined}
        hrefLang="es"
        className={linkClass(locale === "es")}
      >
        ES
      </a>
      {/* Separador decorativo: el lector de pantalla no debe leerlo. */}
      <span aria-hidden="true" className="font-normal text-gray-300">
        ·
      </span>
      <a
        href={hrefFor("en")}
        aria-current={locale === "en" ? "true" : undefined}
        hrefLang="en"
        title={pick(locale, "English version", "Versión en español")}
        className={linkClass(locale === "en")}
      >
        EN
      </a>
    </nav>
  );
}

/** Lee la query actual (filtros de noticias, paginación…) para no perderla
 *  al cambiar de idioma. Separado de la vista porque useSearchParams exige
 *  un límite de Suspense cuando el header se prerenderiza (página 404). */
function LanguageToggle({
  basePath,
  locale,
}: Readonly<{ basePath: string; locale: Locale }>) {
  const searchParams = useSearchParams();
  return (
    <LanguageToggleView
      basePath={basePath}
      locale={locale}
      qs={searchParams.toString()}
    />
  );
}

export function SiteHeader({
  hiddenPaths = [],
}: Readonly<{ hiddenPaths?: string[] }>) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const locale = pathLocale(pathname);
  const basePath = stripLocale(pathname);
  // Páginas ocultas desde el panel (Visualización): fuera del menú.
  const nav = NAV.filter((item) => !hiddenPaths.includes(item.href));
  const localizedHref = (href: string) => withLocale(href, locale);

  // Cierra el menú móvil al navegar a otra página.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape cierra el menú móvil y devuelve el foco a la hamburguesa, para no
  // dejar a quien navega con teclado dentro de una lista de enlaces.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      document.getElementById("boton-menu")?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <>
      {/* Barra superior en el ámbar del logotipo (decorativa) */}
      <div className="h-[3px] bg-diderot-gold" />

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-surface-card">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-6 px-6">
          {/* Logo */}
          <Link
            href={withLocale("/", locale)}
            aria-label={pick(locale, "DIDEROT (página de inicio)", "DIDEROT (home page)")}
            className="flex flex-none items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
          >
            <Image
              src="/images/diderot-logo.png"
              // Decorativo: el enlace que lo envuelve ya tiene aria-label.
              alt=""
              width={1023}
              height={295}
              priority
              className="h-[38px] w-auto dark:hidden"
            />
            <Image
              src="/images/diderot-logo-white.png"
              alt=""
              width={1023}
              height={295}
              priority
              className="hidden h-[38px] w-auto dark:block"
            />
          </Link>

          {/* Navegación de escritorio */}
          <nav
            aria-label={pick(locale, "Navegación principal", "Main navigation")}
            className="hidden items-center gap-2.5 text-sm font-medium text-gray-600 lg:flex xl:gap-3.5 2xl:gap-5"
          >
            {nav.filter((item) => !DESKTOP_HIDDEN.has(item.href)).map((item) => {
              const label = pick(locale, item.label, item.labelEn);
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-gray-900"
                  >
                    {label}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                );
              }
              const active = isActive(basePath, item.href);
              if (item.sub) {
                return (
                  <NavDropdown
                    key={item.href}
                    label={label}
                    href={localizedHref(item.href)}
                    active={active}
                    toggleLabel={pick(
                      locale,
                      `Apartados de ${label}`,
                      `${label} sections`,
                    )}
                    items={item.sub
                      // Fuera los apartados de secciones ocultas (p. ej.
                      // /investigacion#proyectos desde Visualización).
                      .filter(
                        (s) =>
                          s.externalHref ||
                          !hiddenPaths.includes(`${item.href}#${s.hash}`),
                      )
                      .map((s) => ({
                        label: pick(locale, s.label, s.labelEn),
                        href:
                          s.externalHref ??
                          `${localizedHref(item.href)}#${s.hash}`,
                        external: Boolean(s.externalHref),
                      }))}
                  />
                );
              }
              return (
                <Link
                  key={item.href}
                  href={localizedHref(item.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-[68px] items-center border-b-2 border-transparent transition-colors",
                    active
                      ? "border-diderot-amber text-ink"
                      : "hover:text-gray-900",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Acciones */}
          <div className="flex flex-none items-center gap-2.5">
            <ThemeToggle />
            {/* Selector de idioma: misma página en el otro idioma. El
                useSearchParams del conmutador exige Suspense al prerender
                (la 404 estática monta este header); el fallback pinta el
                mismo conmutador sin query. */}
            <Suspense
              fallback={<LanguageToggleView basePath={basePath} locale={locale} qs="" />}
            >
              <LanguageToggle basePath={basePath} locale={locale} />
            </Suspense>
            {/* Hamburguesa (móvil y tablet) */}
            <button
              type="button"
              id="boton-menu"
              aria-label={
                menuOpen
                  ? pick(locale, "Cerrar menú", "Close menu")
                  : pick(locale, "Abrir menú", "Open menu")
              }
              aria-expanded={menuOpen}
              aria-controls="menu-movil"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page lg:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Panel de navegación móvil */}
        {menuOpen ? (
          <nav
            id="menu-movil"
            aria-label={pick(
              locale,
              "Navegación principal (móvil)",
              "Main navigation (mobile)",
            )}
            className="border-t border-gray-200 bg-surface-card lg:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col px-6 py-2">
              {nav.map((item) => {
                const label = pick(locale, item.label, item.labelEn);
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border-l-2 border-transparent py-3 pl-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {label}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  );
                }
                const active = isActive(basePath, item.href);
                return (
                  <div key={item.href}>
                    <Link
                      href={localizedHref(item.href)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block border-l-2 py-3 pl-3 text-sm font-medium transition-colors",
                        active
                          ? "border-diderot-amber text-ink"
                          : "border-transparent text-gray-600 hover:text-gray-900",
                      )}
                    >
                      {label}
                    </Link>
                    {/* Los apartados, indentados bajo su sección: en móvil no
                        hay hover, así que se muestran siempre. */}
                    {item.sub ? (
                      <div className="mb-1 flex flex-col border-l-2 border-transparent pl-3">
                        {item.sub
                          .filter(
                            (s) =>
                              s.externalHref ||
                              !hiddenPaths.includes(`${item.href}#${s.hash}`),
                          )
                          .map((s) => {
                          const clase =
                            "py-1.5 pl-3 text-[13px] text-gray-500 transition-colors hover:text-gray-900";
                          if (s.externalHref) {
                            return (
                              <a
                                key={s.hash}
                                href={s.externalHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(clase, "inline-flex items-center gap-1.5")}
                              >
                                {pick(locale, s.label, s.labelEn)}
                                <ExternalLink
                                  className="h-3 w-3 flex-none"
                                  aria-hidden="true"
                                />
                              </a>
                            );
                          }
                          return (
                            <Link
                              key={s.hash}
                              href={`${localizedHref(item.href)}#${s.hash}`}
                              className={clase}
                            >
                              {pick(locale, s.label, s.labelEn)}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
