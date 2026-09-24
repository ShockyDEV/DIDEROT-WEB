import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, Globe } from "lucide-react";
import { SocialIcon, socialLinks } from "@/components/ui/social-links";
import { getListBlock } from "@/lib/content-blocks-service";
import { pick, withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";

export async function InstitutionalFooter() {
  const year = new Date().getFullYear();
  const locale = getLocale();
  // Correo y teléfono editables en el panel (Configuración → Datos del sitio).
  const [{ email, phone }, redesItems] = await Promise.all([
    getSiteSettings(),
    // Redes sociales: panel → Páginas → Contacto → Redes sociales.
    getListBlock("contacto", "list:redes"),
  ]);
  const redes = socialLinks(redesItems);
  return (
    <footer className="mt-16 bg-gray-950 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-10 sm:grid-cols-3">
        <div className="flex justify-center sm:justify-start">
          <Image
            src="/images/diderot-logo-white.png"
            alt={`${SITE.shortName} - ${SITE.name}`}
            width={1023}
            height={295}
            className="h-12 w-auto"
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center text-sm">
          {phone ? (
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4 text-diderot-gold" aria-hidden="true" />
              {phone}
            </a>
          ) : null}
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4 text-diderot-gold" aria-hidden="true" />
            {email}
          </a>
          <p className="inline-flex items-center gap-2 text-white/75">
            <MapPin className="h-4 w-4 flex-none text-diderot-gold" aria-hidden="true" />
            {pick(
              locale,
              "IUCE · Edificio Solís · Salamanca",
              "IUCE · Solís Building · Salamanca",
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 sm:justify-end">
          <a
            href={SITE.links.iuce}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            aria-label={pick(
              locale,
              "Instituto Universitario de Ciencias de la Educación (IUCE)",
              "University Institute of Education Sciences (IUCE)",
            )}
          >
            <Image
              src="/images/afiliaciones/iuce-logo-white.webp"
              alt=""
              width={640}
              height={196}
              className="h-9 w-auto"
            />
          </a>
          <a
            href={SITE.links.usal}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            aria-label={pick(locale, "Universidad de Salamanca", "University of Salamanca")}
          >
            <Image
              src="/images/usal-logo-white.webp"
              alt=""
              width={640}
              height={177}
              className="h-11 w-auto"
            />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-3 text-[11px] text-white/55 sm:flex-row">
          <p className="text-center sm:text-left">
            © {year} {SITE.shortName} –{" "}
            {pick(locale, "Universidad de Salamanca", "University of Salamanca")}
            {" · "}
            <Link
              href={withLocale("/aviso-legal", locale)}
              className="transition-colors hover:text-white"
            >
              {pick(locale, "Aviso legal", "Legal notice")}
            </Link>
            {" · "}
            <Link
              href={withLocale("/privacidad", locale)}
              className="transition-colors hover:text-white"
            >
              {pick(locale, "Privacidad", "Privacy")}
            </Link>
            {" · "}
            <Link
              href={withLocale("/politica-de-cookies", locale)}
              className="transition-colors hover:text-white"
            >
              Cookies
            </Link>
            {" · "}
            <Link
              href={withLocale("/accesibilidad", locale)}
              className="transition-colors hover:text-white"
            >
              {pick(locale, "Accesibilidad", "Accessibility")}
            </Link>
          </p>
          {/* Los iconos miden 14-16 px, pero el área de pulsación de cada
              enlace llega a 24x24 (mínimo de WCAG 2.2 para objetivos). */}
          <div className="flex items-center gap-2">
            <a
              href={SITE.links.usal}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={pick(locale, "Web de la Universidad de Salamanca", "University of Salamanca website")}
              className="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:text-white"
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
            </a>
            {redes.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={pick(locale, `${r.name} de DIDEROT (${r.handle})`, `DIDEROT on ${r.name} (${r.handle})`)}
                className="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:text-white"
              >
                <SocialIcon red={r.red} className={r.red === "x" ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
