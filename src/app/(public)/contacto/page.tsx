import { metadataBilingue } from "@/lib/metadata";
import { AtSign, Compass, Mail, MapPin, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ContactForm } from "@/components/contact/contact-form";
import { MapConsent } from "@/components/contact/map-consent";
import { Reveal } from "@/components/ui/reveal";
import { getBlock, getBlockText } from "@/lib/content-blocks-service";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";
import { getSiteSettings } from "@/lib/site-settings";
import { CONTACT_SUBJECT_KEYS } from "@/lib/validations";

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

// Textos fijos de la página en ambos idiomas (los datos editables —dirección,
// coordinación, correo, redes, cómo llegar— llegan ya traducidos del
// servicio de bloques).
const T = {
  es: {
    inicio: "Inicio",
    contacto: "Contacto",
    titulo: "Contacta con DIDEROT",
    direccion: "Dirección",
    coordinacion: "Coordinación del grupo",
    correo: "Correo electrónico",
    redes: "Redes sociales",
    mapaTitle: "Mapa del Edificio Solís (IUCE), Paseo de Canalejas 169, Salamanca",
    comoLlegar: "Cómo llegar",
  },
  en: {
    inicio: "Home",
    contacto: "Contact",
    titulo: "Contact DIDEROT",
    direccion: "Address",
    coordinacion: "Group coordinator",
    correo: "Email",
    redes: "Social media",
    mapaTitle: "Map of the Solís Building (IUCE), Paseo de Canalejas 169, Salamanca",
    comoLlegar: "How to find us",
  },
} as const;

/** Sede del grupo para el mapa (búsqueda de Google Maps). */
const MAP_QUERY = "Edificio Solís, Paseo de Canalejas 169, 37008 Salamanca";

/** Dirección de correo con forma válida (lo que llega del panel es texto libre). */
const EMAIL_RE = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[a-z]{2,}$/i;

interface PageProps {
  searchParams: { asunto?: string };
}

interface Dato {
  icon: LucideIcon;
  title: string;
  /** HTML de un bloque del gestor… */
  html?: string;
  /** …o contenido ya maquetado. */
  node?: React.ReactNode;
}

export default async function ContactoPage({
  searchParams,
}: Readonly<PageProps>) {
  await assertVisible("contacto");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Todos los textos de datos salen del gestor (Contenido → Páginas → Contacto).
  const [
    intro,
    direccion,
    coordinacion,
    settings,
    redes,
    urlPrivacidad,
    comoLlegar,
  ] = await Promise.all([
    getBlock("contacto", "intro"),
    getBlock("contacto", "direccion"),
    getBlock("contacto", "coordinacion"),
    // El correo público tiene una sola fuente: panel → Configuración.
    getSiteSettings(),
    getBlock("contacto", "redes"),
    getBlockText("contacto", "url-privacidad"),
    getBlock("contacto", "como-llegar"),
  ]);

  // Asunto preseleccionado desde otras páginas (/contacto?asunto=doctorado).
  const defaultSubject = CONTACT_SUBJECT_KEYS[searchParams.asunto ?? ""];

  // Un bloque vaciado en el panel (solo etiquetas o espacios) oculta su dato.
  const lleno = (html: string) => html.replace(/<[^>]*>|&nbsp;|\s/g, "") !== "";
  const email = EMAIL_RE.test(settings.email) ? settings.email : null;

  const candidatos: Array<Dato | null> = [
    lleno(direccion) ? { icon: MapPin, title: t.direccion, html: direccion } : null,
    lleno(coordinacion)
      ? { icon: UserRound, title: t.coordinacion, html: coordinacion }
      : null,
    email
      ? {
          icon: Mail,
          title: t.correo,
          node: (
            <a
              href={`mailto:${email}`}
              className="break-all text-diderot-violet hover:underline"
            >
              {email}
            </a>
          ),
        }
      : null,
    lleno(redes) ? { icon: AtSign, title: t.redes, html: redes } : null,
  ];
  const datos = candidatos.filter((d): d is Dato => d !== null);

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

      {/* Datos y formulario */}
      <section>
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1fr_1.2fr]">
          <Reveal from="left" className="flex flex-col gap-6">
            {datos.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.title} className="flex items-start gap-3.5">
                  <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {d.title}
                    </p>
                    {d.html ? (
                      <div
                        className="page-block mt-0.5 text-sm leading-normal text-gray-600"
                        dangerouslySetInnerHTML={{ __html: d.html }}
                      />
                    ) : (
                      <div className="mt-0.5 text-sm leading-normal text-gray-600">
                        {d.node}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <MapConsent
              query={MAP_QUERY}
              title={t.mapaTitle}
              locale={locale}
              className="h-[280px]"
            />
          </Reveal>

          <Reveal from="right" delay={120}>
            <ContactForm
              privacyUrl={urlPrivacidad}
              locale={locale}
              defaultSubject={defaultSubject}
            />
          </Reveal>
        </div>
      </section>

      {/* Cómo llegar (transporte) */}
      {lleno(comoLlegar) ? (
        <section className="border-t border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                <Compass className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t.comoLlegar}
              </h2>
            </div>
            <div
              className="page-block max-w-[85ch] text-base leading-relaxed text-gray-600 [&_img]:mt-2 [&_img]:w-full [&_img]:max-w-[860px] [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200 [&_img]:bg-white [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: comoLlegar }}
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
