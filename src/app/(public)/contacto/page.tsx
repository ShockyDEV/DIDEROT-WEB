import Link from "next/link";
import { metadataBilingue } from "@/lib/metadata";
import { ArrowUpRight, Compass, Mail, MapPin, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { MapConsent } from "@/components/contact/map-consent";
import { buttonClassName } from "@/components/ui/button";
import { CopyEmail } from "@/components/ui/copy-email";
import { Reveal } from "@/components/ui/reveal";
import { SocialIcon, socialLinks } from "@/components/ui/social-links";
import { cn } from "@/lib/cn";
import { getBlock, getListBlock } from "@/lib/content-blocks-service";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";
import { getSiteSettings } from "@/lib/site-settings";
import { withLocale } from "@/lib/locale";

export const generateMetadata = metadataBilingue(
  {
    title: "Contacto",
    description:
      "Contacta con DIDEROT, Grupo de Investigación Reconocido de la Universidad de Salamanca: colaboración en investigación, doctorado, transferencia, eventos y medios. IUCE, Edificio Solís, Paseo de Canalejas 169, Salamanca.",
  },
  {
    title: "Contact",
    description:
      "Get in touch with DIDEROT, a Recognised Research Group of the University of Salamanca: research collaboration, PhD, knowledge transfer, events and media. IUCE, Solís Building, Paseo de Canalejas 169, Salamanca.",
  },
);

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (los datos editables (dirección,
// coordinación, correo, redes, cómo llegar) llegan ya traducidos del
// servicio de bloques).
const T = {
  es: {
    inicio: "Inicio",
    contacto: "Contacto",
    titulo: "Contacta con DIDEROT",
    correo: "Correo electrónico",
    coordinacion: "Coordinación del grupo",
    escribir: "Escribir un correo",
    redes: "Redes sociales",
    redesTexto: "Sigue la actividad del grupo:",
    noticias: "Ver las noticias",
    direccion: "Dirección",
    comoLlegar: "Cómo llegar",
    abrirMapa: "Abrir en Google Maps",
    nuevaVentana: "(se abre en una ventana nueva)",
    mapaTitle: "Mapa del Edificio Solís (IUCE), Paseo de Canalejas 169, Salamanca",
  },
  en: {
    inicio: "Home",
    contacto: "Contact",
    titulo: "Contact DIDEROT",
    correo: "Email",
    coordinacion: "Group coordinator",
    escribir: "Write an email",
    redes: "Social media",
    redesTexto: "Follow the group's activity:",
    noticias: "See the news",
    direccion: "Address",
    comoLlegar: "How to find us",
    abrirMapa: "Open in Google Maps",
    nuevaVentana: "(opens in a new window)",
    mapaTitle: "Map of the Solís Building (IUCE), Paseo de Canalejas 169, Salamanca",
  },
} as const;

/** Sede del grupo para el mapa (búsqueda de Google Maps). */
const MAP_QUERY = "Edificio Solís, Paseo de Canalejas 169, 37008 Salamanca";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

/** Dirección de correo con forma válida (lo que llega del panel es texto libre). */
const EMAIL_RE = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[a-z]{2,}$/i;

/** Tarjeta de dato de contacto (correo, redes, dirección). */
function ContactCard({
  icon: Icon,
  title,
  delay,
  children,
}: Readonly<{ icon: LucideIcon; title: string; delay: number; children: React.ReactNode }>) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-gray-900">{title}</h2>
        {children}
      </div>
    </Reveal>
  );
}

export default async function ContactoPage() {
  await assertVisible("contacto");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Textos y listas del gestor (Contenido → Páginas → Contacto); el correo
  // público tiene una sola fuente: panel → Configuración → Datos del sitio.
  const [intro, direccion, coordinacion, settings, redesItems, comoLlegar] =
    await Promise.all([
      getBlock("contacto", "intro"),
      getBlock("contacto", "direccion"),
      getBlock("contacto", "coordinacion"),
      getSiteSettings(),
      getListBlock("contacto", "list:redes"),
      getBlock("contacto", "como-llegar"),
    ]);

  // Un bloque vaciado en el panel (solo etiquetas o espacios) oculta su dato.
  const lleno = (html: string) => html.replace(/<[^>]*>|&nbsp;|\s/g, "") !== "";
  const email = EMAIL_RE.test(settings.email) ? settings.email : null;
  const redes = socialLinks(redesItems);
  const tarjetas = [email, redes.length > 0, lleno(direccion)].filter(Boolean).length;

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.contacto },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.contacto}
          </p>
          <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[70ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        </div>
      </section>

      {/* Correo, redes sociales y dirección */}
      {tarjetas > 0 ? (
        <section>
          <div
            className={cn(
              "mx-auto grid max-w-6xl gap-5 px-6 pb-14 pt-12",
              tarjetas === 3 && "md:grid-cols-3",
              tarjetas === 2 && "md:grid-cols-2",
            )}
          >
            {email ? (
              <ContactCard icon={Mail} title={t.correo} delay={0}>
                <CopyEmail
                  email={email}
                  locale={locale}
                  className="mt-2 text-base font-semibold"
                />
                {lleno(coordinacion) ? (
                  <div className="mt-3 text-sm leading-normal text-gray-600">
                    <p className="text-xs font-semibold uppercase tracking-wider text-diderot-amber">
                      {t.coordinacion}
                    </p>
                    <div
                      className="page-block mt-0.5"
                      dangerouslySetInnerHTML={{ __html: coordinacion }}
                    />
                  </div>
                ) : null}
                <div className="mt-auto pt-5">
                  <a
                    href={`mailto:${email}`}
                    className={cn(buttonClassName(), "gap-1.5")}
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {t.escribir}
                  </a>
                </div>
              </ContactCard>
            ) : null}

            {redes.length > 0 ? (
              <ContactCard icon={Share2} title={t.redes} delay={80}>
                <p className="mt-1 text-sm text-gray-600">{t.redesTexto}</p>
                <ul className="mt-3 flex list-none flex-col gap-2 p-0">
                  {redes.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 transition-colors hover:border-diderot-violet/40 hover:bg-diderot-pale"
                      >
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ink text-white">
                          <SocialIcon red={r.red} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-gray-900">
                            {r.handle}
                          </span>
                          <span className="block text-xs text-gray-500">{r.name}</span>
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4 flex-none text-gray-400 transition-colors group-hover:text-diderot-violet"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{t.nuevaVentana}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-5 text-sm font-medium">
                  <Link href={href("/noticias")} className="text-diderot-violet hover:underline">
                    {t.noticias} →
                  </Link>
                </div>
              </ContactCard>
            ) : null}

            {lleno(direccion) ? (
              <ContactCard icon={MapPin} title={t.direccion} delay={160}>
                <div
                  className="page-block mt-1 text-sm leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: direccion }}
                />
                <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-5 text-sm font-medium">
                  {lleno(comoLlegar) ? (
                    <a href="#como-llegar" className="text-diderot-violet hover:underline">
                      {t.comoLlegar} ↓
                    </a>
                  ) : null}
                  <a
                    href={MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-diderot-violet hover:underline"
                  >
                    {t.abrirMapa}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">{t.nuevaVentana}</span>
                  </a>
                </div>
              </ContactCard>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Cómo llegar (transporte) y mapa */}
      <section
        id="como-llegar"
        className="scroll-mt-20 border-t border-gray-200 bg-surface-card"
      >
        <div
          className={cn(
            "mx-auto grid max-w-6xl items-start gap-10 px-6 py-14",
            lleno(comoLlegar) && "lg:grid-cols-[1.1fr_1fr]",
          )}
        >
          {lleno(comoLlegar) ? (
            <Reveal from="left">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                  <Compass className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  {t.comoLlegar}
                </h2>
              </div>
              <div
                className="page-block text-base leading-relaxed text-gray-600 [&_img]:mt-2 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200 [&_img]:bg-white [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: comoLlegar }}
              />
            </Reveal>
          ) : null}
          <Reveal from="right" delay={120} className="lg:sticky lg:top-24">
            <MapConsent
              query={MAP_QUERY}
              title={t.mapaTitle}
              locale={locale}
              className="h-[380px]"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
