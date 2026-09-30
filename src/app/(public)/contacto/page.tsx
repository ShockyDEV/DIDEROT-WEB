import { metadataBilingue } from "@/lib/metadata";
import { ArrowUpRight, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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

// Textos fijos de la página en ambos idiomas (los datos editables, como la
// dirección, la coordinación, las redes y «Cómo llegar», llegan ya
// traducidos del servicio de bloques).
const T = {
  es: {
    inicio: "Inicio",
    contacto: "Contacto",
    titulo: "Contacta con DIDEROT",
    sede: "IUCE, Universidad de Salamanca",
    correo: "Correo electrónico",
    coordinacion: "Coordinación del grupo",
    escribir: "Escribir un correo",
    redes: "Redes sociales",
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
    sede: "IUCE, University of Salamanca",
    correo: "Email",
    coordinacion: "Group coordinator",
    escribir: "Write an email",
    redes: "Social media",
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

/** Un dato de contacto: etiqueta en cursiva y contenido, con filete encima. */
function Dato({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="border-t border-gray-200 py-5">
      <dt className="data-label mb-1.5">{label}</dt>
      <dd>{children}</dd>
    </div>
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

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.contacto }]}
        eyebrow={t.sede}
        title={t.titulo}
        intro={intro}
      />

      {/* Datos de contacto y mapa */}
      <section>
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-14 lg:grid-cols-[1.1fr_1fr]">
          <Reveal from="left">
            <dl className="border-b border-gray-200">
              {email ? (
                <Dato label={t.correo}>
                  <CopyEmail email={email} locale={locale} className="text-xl font-semibold sm:text-2xl" />
                  <div className="mt-4">
                    <a href={`mailto:${email}`} className={cn(buttonClassName(), "gap-2")}>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {t.escribir}
                    </a>
                  </div>
                </Dato>
              ) : null}

              {lleno(coordinacion) ? (
                <Dato label={t.coordinacion}>
                  <div
                    className="page-block text-[17px] font-medium text-gray-900"
                    dangerouslySetInnerHTML={{ __html: coordinacion }}
                  />
                </Dato>
              ) : null}

              {redes.length > 0 ? (
                <Dato label={t.redes}>
                  <ul className="flex list-none flex-col gap-2 p-0">
                    {redes.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2.5 text-[17px]"
                        >
                          <SocialIcon red={r.red} className="h-4 w-4 flex-none text-ink" />
                          <span className="link-sub font-medium">{r.handle}</span>
                          <span className="text-sm text-gray-500">{r.name}</span>
                          <span className="sr-only">{t.nuevaVentana}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </Dato>
              ) : null}

              {lleno(direccion) ? (
                <Dato label={t.direccion}>
                  <div
                    className="page-block text-[17px] leading-relaxed text-gray-700"
                    dangerouslySetInnerHTML={{ __html: direccion }}
                  />
                  <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                    {lleno(comoLlegar) ? (
                      <a href="#como-llegar" className="link-sub">
                        {t.comoLlegar}
                      </a>
                    ) : null}
                    <a
                      href={MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-sub inline-flex items-center gap-1"
                    >
                      {t.abrirMapa}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{t.nuevaVentana}</span>
                    </a>
                  </p>
                </Dato>
              ) : null}
            </dl>
          </Reveal>
          <Reveal from="right" delay={120} className="lg:sticky lg:top-24">
            <MapConsent query={MAP_QUERY} title={t.mapaTitle} locale={locale} className="h-[440px]" />
          </Reveal>
        </div>
      </section>

      {/* Cómo llegar (transporte) */}
      {lleno(comoLlegar) ? (
        <section id="como-llegar" className="scroll-mt-20 border-t border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal>
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                {t.comoLlegar}
              </h2>
              <div
                className="page-block max-w-[72ch] text-[17px] leading-relaxed text-gray-600 [&_img]:mt-2 [&_img]:w-full [&_img]:rounded [&_img]:border [&_img]:border-gray-200 [&_img]:bg-white [&_li]:mb-2"
                dangerouslySetInnerHTML={{ __html: comoLlegar }}
              />
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
