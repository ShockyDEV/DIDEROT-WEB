import { metadataBilingue } from "@/lib/metadata";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  MailQuestion,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { buttonClassName } from "@/components/ui/button";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { PdfEmbed } from "@/components/ui/pdf-embed";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Formación",
    description:
      "Plan de Formación Docente 2026 de la Universidad de Salamanca: formación permanente del PDI, SPOCs y Formación Docente Inicial (FDI) de las universidades públicas de Castilla y León.",
  },
  {
    title: "Training",
    description:
      "The University of Salamanca's 2026 Teaching Training Plan: continuing training for academic staff, SPOCs and Initial Teacher Training (FDI) at the public universities of Castilla y León.",
  },
);





// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques).
const T = {
  es: {
    inicio: "Inicio",
    formacion: "Formación",
    accesoPortal: "Acceso al Portal de Formación",
    verPlan: "Ver el Plan completo (PDF)",
    dirigidoTitulo: "¿A quién va dirigido?",
    inscribirseTitulo: "Cómo inscribirse",
    inscribirseTexto:
      "Las inscripciones se realizan en el Portal de Formación de la USAL, eligiendo el subplan que corresponda.",
    manualPortal: "Manual del Portal de Formación",
    irPortal: "Ir al Portal",
    actividadesTitulo: "Actividades formativas",
    actividadesTexto:
      "Tres vías complementarias de formación, organizadas desde el IUCE.",
    planTitulo: "El Plan, al completo",
    planTexto:
      "Consulta aquí el documento íntegro del Plan de Formación Docente del Profesorado, con todos los cursos, fechas y condiciones.",
    planPdfTitle:
      "Plan de Formación Docente del Profesorado — documento completo",
    planPdfDownload: "Descargar el Plan (PDF)",
    pdfFallback: "Tu navegador no puede mostrar el PDF incrustado.",
    pdfOpen: "Abrir el documento",
    fdiEyebrow: "Universidades públicas de Castilla y León",
    fdiTitulo: "Programa de Formación Docente Inicial",
    fdiSubnav: "Formación Docente Inicial",
    fdiDudas: "Dudas sobre la formación:",
    fiuniAlt:
      "Formación Inicial Universitaria — programa conjunto de las universidades públicas de Castilla y León",
    edicionesTitulo: "Ediciones 2026",
    edicionesTexto:
      "Calendario orientativo; cada edición se comunica por correo al profesorado ayudante doctor.",
    verCalendario: "Ver calendario completo",
    contactar: "Contactar",
  },
  en: {
    inicio: "Home",
    formacion: "Training",
    accesoPortal: "Access the Training Portal",
    verPlan: "View the full Plan (PDF)",
    dirigidoTitulo: "Who is it for?",
    inscribirseTitulo: "How to register",
    inscribirseTexto:
      "Registration takes place on the USAL Training Portal, selecting the relevant subplan.",
    manualPortal: "Training Portal manual",
    irPortal: "Go to the Portal",
    actividadesTitulo: "Training activities",
    actividadesTexto:
      "Three complementary training pathways, organised by the IUCE.",
    planTitulo: "The Plan, in full",
    planTexto:
      "Browse the complete Teaching Staff Training Plan document here, with all courses, dates and conditions.",
    planPdfTitle: "Teaching Staff Training Plan — full document",
    planPdfDownload: "Download the Plan (PDF)",
    pdfFallback: "Your browser cannot display the embedded PDF.",
    pdfOpen: "Open the document",
    fdiEyebrow: "Public universities of Castilla y León",
    fdiTitulo: "Initial Teacher Training Programme",
    fdiSubnav: "Initial Teacher Training",
    fdiDudas: "Questions about the training:",
    fiuniAlt:
      "Initial University Training — joint programme of the public universities of Castilla y León",
    edicionesTitulo: "2026 editions",
    edicionesTexto:
      "Indicative calendar; each edition is announced by email to assistant professors (ayudantes doctores).",
    verCalendario: "View full calendar",
    contactar: "Contact us",
  },
} as const;

export default async function FormacionPage() {
  await assertVisible("formacion");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Contenido editable desde el gestor (Contenido → Páginas → Formación)
  const [
    heroEyebrow,
    heroTitulo,
    urlPortal,
    urlManual,
    urlPlan,
    urlCalendario,
    intro,
    aviso,
    inscripcionNota,
    fdiIntro,
    cta,
    datos,
    destinatarios,
    subplanes,
    actividades,
    modulos,
    unidades,
    ediciones,
  ] = await Promise.all([
    getBlockText("formacion", "hero-eyebrow"),
    getBlockText("formacion", "hero-titulo"),
    getBlockText("formacion", "url-portal"),
    getBlockText("formacion", "url-manual"),
    getBlockText("formacion", "url-plan"),
    getBlockText("formacion", "url-calendario"),
    getBlock("formacion", "intro"),
    getBlockText("formacion", "aviso-preinscripcion"),
    getBlock("formacion", "inscripcion-nota"),
    getBlock("formacion", "fdi-intro"),
    getBlock("formacion", "cta"),
    getListBlock("formacion", "list:datos"),
    getListBlock("formacion", "list:destinatarios"),
    getListBlock("formacion", "list:subplanes"),
    getListBlock("formacion", "list:actividades"),
    getListBlock("formacion", "list:fdi-modulos"),
    getListBlock("formacion", "list:fdi-unidades"),
    getListBlock("formacion", "list:fdi-ediciones"),
  ]);

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-11 pt-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-3.5">
              <Breadcrumb items={[{ label: t.inicio, href: href("/") }, { label: t.formacion }]} />
            </div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
              {heroEyebrow}
            </p>
            <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
              {heroTitulo}
            </h1>
            <div
              className="page-block mb-5 max-w-[60ch] text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
            {aviso ? (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-diderot-amber/25 bg-diderot-amber/[.06] px-4 py-2 text-sm font-medium text-diderot-amber">
                <CalendarDays className="h-4 w-4 flex-none" aria-hidden="true" />
                {aviso}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName({ size: "lg" }) + " gap-1.5"}
                >
                  {t.accesoPortal}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {urlPlan ? (
                <a
                  href="#plan"
                  className="inline-flex items-center gap-2 px-2 py-3 text-base font-medium text-diderot-violet hover:underline"
                >
                  {t.verPlan}
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {datos.map((d, i) => (
              <Reveal
                key={i}
                from="right"
                delay={i * 110}
                className={cn(
                  i === datos.length - 1 &&
                    datos.length % 2 === 1 &&
                    "col-span-2",
                )}
              >
              <div className="h-full rounded-xl border border-gray-200 bg-surface-page p-5">
                <p className="text-3xl font-bold text-ink">
                  <CountUp value={String(d.cifra)} />
                </p>
                <p className="mt-1 text-xs leading-snug text-gray-500">
                  {String(d.texto)}
                </p>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
        {/* Fuera de la rejilla de dos columnas: la subnavegación va a todo
            el ancho, bajo la cabecera. */}
        <div className="mx-auto max-w-6xl px-6 pb-7">
          <SectionSubnav
            items={[
              { id: "dirigido", label: t.dirigidoTitulo },
              { id: "inscribirse", label: t.inscribirseTitulo },
              { id: "actividades", label: t.actividadesTitulo },
              { id: "plan", label: t.planTitulo },
              { id: "inicial", label: t.fdiSubnav },
            ]}
          />
        </div>
      </section>

      {/* ¿A quién va dirigido? */}
      <section id="dirigido" className="scroll-mt-20 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="mb-[18px] text-xl font-bold text-gray-900">
            {t.dirigidoTitulo}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {destinatarios.map((d, i) => {
              const Icon = iconFor(d.icon);
              return (
                <Reveal key={i} delay={i * 90} className="h-full">
                <div className="flex h-full items-start gap-3.5 rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm">
                  <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                    <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-gray-900">
                      {String(d.titulo)}
                    </p>
                    <p className="text-xs leading-snug text-gray-500">
                      {String(d.texto)}
                    </p>
                  </div>
                </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cómo inscribirse (Portal de Formación, subplanes y manual) */}
      <section
        id="inscribirse"
        className="scroll-mt-20 border-b border-gray-200 bg-surface-card"
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h2 className="mb-1.5 text-xl font-bold text-gray-900">
            {t.inscribirseTitulo}
          </h2>
          <p className="mb-5 max-w-[80ch] text-sm text-gray-500">
            {t.inscribirseTexto}
          </p>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subplanes.map((s, i) => (
              <Reveal key={i} delay={i * 90} className="h-full">
                <article className="h-full rounded-xl border border-gray-200 bg-surface-page p-5 shadow-sm">
                  <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                    {String(s.titulo)}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {String(s.texto)}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="page-block max-w-[70ch] text-sm leading-relaxed text-gray-500"
              dangerouslySetInnerHTML={{ __html: inscripcionNota }}
            />
            <div className="flex flex-none flex-wrap items-center gap-3">
              {urlManual ? (
                <a
                  href={urlManual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {t.manualPortal}
                </a>
              ) : null}
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName() + " gap-1.5"}
                >
                  {t.irPortal}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Actividades formativas */}
      <section id="actividades" className="scroll-mt-20 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
            {t.actividadesTitulo}
          </h2>
          <p className="mb-7 max-w-[80ch] text-sm text-gray-500">
            {t.actividadesTexto}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {actividades.map((a, i) => {
              const Icon = iconFor(a.icon);
              return (
                <Reveal key={i} delay={i * 90} className="h-full">
                <article
                  className={cn(
                    "card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 border-t-[3px] bg-surface-page p-6 shadow-sm hover:shadow-md",
                    a.acentoRojo ? "border-t-diderot-amber" : "border-t-diderot-violet",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md bg-diderot-pale",
                      a.acentoRojo ? "text-diderot-amber" : "text-ink",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {String(a.titulo)}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {String(a.texto)}
                  </p>
                  {a.cta && a.enlace ? (
                    <a
                      href={
                        String(a.enlace).startsWith("/")
                          ? href(String(a.enlace))
                          : String(a.enlace)
                      }
                      className="mt-auto text-sm font-medium text-diderot-violet hover:underline"
                    >
                      {String(a.cta)}
                    </a>
                  ) : null}
                </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* El Plan completo (PDF embebido) */}
      {urlPlan ? (
        <section id="plan" className="scroll-mt-20 border-b border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.planTitulo}
            </h2>
            <p className="mb-6 max-w-[80ch] text-sm text-gray-500">
              {t.planTexto}
            </p>
            <PdfEmbed
              src={urlPlan}
              title={t.planPdfTitle}
              downloadLabel={t.planPdfDownload}
              fallbackText={t.pdfFallback}
              openLabel={t.pdfOpen}
            />
          </div>
        </section>
      ) : null}

      {/* Formación Docente Inicial */}
      <section id="inicial" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
              {t.fdiEyebrow}
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
              {t.fdiTitulo}
            </h2>
            <div
              className="page-block mb-6 text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: fdiIntro }}
            />

            {/* Los 5 módulos del programa */}
            <div className="mb-7 flex flex-col">
              {modulos.map((m, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div
                    className={
                      "grid grid-cols-[44px_1fr] items-start gap-3 border-t border-gray-100 py-3" +
                      (i === modulos.length - 1 ? " border-b" : "")
                    }
                  >
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-diderot-pale text-xs font-bold text-ink">
                      {String(m.codigo)}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-snug text-gray-900">
                        {String(m.titulo)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {String(m.coordina)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mb-6 flex flex-col gap-2.5">
              {unidades.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-gray-200 bg-surface-card px-4 py-3"
                >
                  <span
                    className={cn(
                      "w-[42px] flex-none text-xs font-bold",
                      u.propia ? "text-diderot-amber" : "text-gray-500",
                    )}
                  >
                    {String(u.sigla)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {String(u.nombre)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {t.fdiDudas}{" "}
              <a
                href="mailto:coord.docencia@usal.es"
                className="text-diderot-violet hover:underline"
              >
                coord.docencia@usal.es
              </a>
            </p>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm">
            {/* Logo del programa conjunto (FIUNI) sobre placa blanca fija,
                como los logos de grupos: debe verse igual en tema oscuro. */}
            <div className="mb-5 flex items-center justify-center rounded-md bg-white px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/fiuni.png"
                alt={t.fiuniAlt}
                className="max-h-16 w-auto"
              />
            </div>
            <h3 className="mb-1 text-base font-semibold text-gray-900">
              {t.edicionesTitulo}
            </h3>
            <p className="mb-[18px] text-xs text-gray-500">
              {t.edicionesTexto}
            </p>
            <div className="flex flex-col">
              {ediciones.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 border-t border-gray-100 py-[11px]"
                >
                  <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-diderot-pale text-xs font-bold text-ink">
                    {String(e.codigo)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {String(e.titulo)}
                    </p>
                    <p className="text-xs text-gray-500">{String(e.cuando)}</p>
                  </div>
                </div>
              ))}
            </div>
            {urlCalendario ? (
              <div className="mt-[18px] border-t border-gray-100 pt-4">
                <a
                  href={urlCalendario}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonClassName({ variant: "outline", size: "sm" }),
                    "w-full",
                  )}
                >
                  {t.verCalendario}
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {/* CTA contacto */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-[18px]">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-md bg-diderot-indigo text-white">
              <MailQuestion className="h-[22px] w-[22px]" aria-hidden="true" />
            </span>
            <div
              className="page-block text-sm text-gray-600 [&_strong]:text-base [&_strong]:font-semibold [&_strong]:text-gray-900"
              dangerouslySetInnerHTML={{ __html: cta }}
            />
          </div>
          <a
            href="mailto:iuce@usal.es"
            className={cn(buttonClassName(), "flex-none")}
          >
            {t.contactar}
          </a>
        </div>
      </section>
    </>
  );
}
