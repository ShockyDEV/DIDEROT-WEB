import { metadataBilingue } from "@/lib/metadata";
import { Clock, Compass, Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { MapEmbed } from "@/components/ui/map-embed";
import { ContactForm } from "@/components/contact/contact-form";
import { Reveal } from "@/components/ui/reveal";
import { getBlock, getBlockText } from "@/lib/content-blocks-service";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible } from "@/lib/page-visibility";

export const generateMetadata = metadataBilingue(
  {
    title: "Contacto",
    description:
      "Contacta con la Secretaría del IUCE: formación, investigación, doctorado y uso de espacios. Paseo de Canalejas 169, Salamanca.",
  },
  {
    title: "Contact",
    description:
      "Get in touch with the IUCE Secretariat: training, research, doctoral studies and use of facilities. Paseo de Canalejas 169, Salamanca.",
  },
);

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (los datos editables —dirección,
// teléfonos, horario, cómo llegar— llegan ya traducidos del servicio de bloques).
const T = {
  es: {
    inicio: "Inicio",
    contacto: "Contacto",
    titulo: "Contacta con el IUCE",
    direccion: "Dirección",
    telefono: "Teléfono",
    correo: "Correo electrónico",
    horario: "Horario de Secretaría",
    mapaTitle: "Mapa — Edificio Solís, Paseo de Canalejas 169, Salamanca",
    reservaPregunta: "¿Necesitas un aula o una sala? Usa el sistema de",
    reservaEnlace: "reserva de espacios ↗",
    comoLlegar: "Cómo llegar",
  },
  en: {
    inicio: "Home",
    contacto: "Contact",
    titulo: "Contact the IUCE",
    direccion: "Address",
    telefono: "Phone",
    correo: "Email",
    horario: "Secretariat opening hours",
    mapaTitle: "Map — Solís Building, Paseo de Canalejas 169, Salamanca",
    reservaPregunta: "Need a classroom or a meeting room? Use the",
    reservaEnlace: "room booking system ↗",
    comoLlegar: "How to find us",
  },
} as const;

export default async function ContactoPage() {
  await assertVisible("contacto");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Todos los textos de datos salen del gestor (Contenido → Páginas → Contacto).
  const [intro, direccion, telefonos, horario, urlPrivacidad, comoLlegar] =
    await Promise.all([
      getBlock("contacto", "intro"),
      getBlock("contacto", "direccion"),
      getBlock("contacto", "telefonos"),
      getBlock("contacto", "horario"),
      getBlockText("contacto", "url-privacidad"),
      getBlock("contacto", "como-llegar"),
    ]);

  const datos = [
    { icon: MapPin, title: t.direccion, html: direccion },
    { icon: Phone, title: t.telefono, html: telefonos },
    {
      icon: Mail,
      title: t.correo,
      html: `<p><a href="mailto:iuce@usal.es">iuce@usal.es</a></p>`,
    },
    { icon: Clock, title: t.horario, html: horario },
  ];

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
          <h1 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight text-ink">
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
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {d.title}
                    </p>
                    <div
                      className="page-block mt-0.5 text-sm leading-normal text-gray-600"
                      dangerouslySetInnerHTML={{ __html: d.html }}
                    />
                  </div>
                </div>
              );
            })}

            <MapEmbed className="h-[280px]" title={t.mapaTitle} />

            <div className="rounded-md border border-gray-200 border-l-[3px] border-l-diderot-amber bg-surface-card px-[18px] py-3.5">
              <p className="text-sm leading-relaxed text-gray-600">
                {t.reservaPregunta}{" "}
                <a
                  href="https://reservas.iuce.usal.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-diderot-violet hover:underline"
                >
                  {t.reservaEnlace}
                </a>
              </p>
            </div>
          </Reveal>

          <Reveal from="right" delay={120}>
            <ContactForm privacyUrl={urlPrivacidad} locale={locale} />
          </Reveal>
        </div>
      </section>

      {/* Cómo llegar (transporte y plano de las instalaciones) */}
      {comoLlegar ? (
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
