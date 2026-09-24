import { metadataBilingue } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
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
import { SoundWave } from "@/components/ui/sound-wave";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";
import { safeHref } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Formación",
    description:
      "Formación en DIDEROT: dirección de tesis doctorales, TFG y TFM en educación musical, artes y tecnología, Seminario Internacional de didácticas digitales, formación del profesorado y estancias de investigación.",
  },
  {
    title: "Training",
    description:
      "Training at DIDEROT: supervision of doctoral, bachelor's and master's theses in music education, the arts and technology, the International Seminar on digital didactics, teacher training and research stays.",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques).
const T = {
  es: {
    inicio: "Inicio",
    formacion: "Formación",
    programaDoctorado: "Programa de Doctorado",
    verSeminario: "Seminario Internacional",
    nuevaVentana: "(se abre en una ventana nueva)",
    doctoradoTitulo: "Doctorado",
    doctoradoSubnav: "Doctorado",
    programas: "Programas de doctorado",
    webPrograma: "Web del programa",
    ambitosTitulo: "Ámbitos para tesis y trabajos",
    tesisTitulo: "Tesis doctorales dirigidas",
    tesisSubnav: "Tesis dirigidas",
    tesisTexto:
      "Tesis defendidas con la dirección o codirección de miembros del grupo.",
    direccion: "Dirección",
    verTesis: "Ver la tesis",
    seminarioSubnav: "Seminario Internacional",
    direccionAcademica: "Dirección académica",
    organizan: "Organizan",
    jornadas: "Jornadas",
    jornada: "Jornada",
    verEventos: "Carteles y crónicas en Eventos",
    profesoradoTitulo: "Formación del profesorado, TFG y TFM",
    profesoradoSubnav: "Profesorado, TFG y TFM",
    profesoradoTexto:
      "Formación para docentes y dirección de trabajos fin de grado y de máster.",
    movilidadTitulo: "Estancias de investigación y movilidad",
    movilidadSubnav: "Estancias y movilidad",
    contactar: "Contactar",
    logoIuce: "Instituto Universitario de Ciencias de la Educación (IUCE)",
    logoCfp: "Centro de Formación Permanente de la Universidad de Salamanca",
  },
  en: {
    inicio: "Home",
    formacion: "Training",
    programaDoctorado: "Doctoral programme",
    verSeminario: "International Seminar",
    nuevaVentana: "(opens in a new window)",
    doctoradoTitulo: "Doctoral studies",
    doctoradoSubnav: "PhD",
    programas: "Doctoral programmes",
    webPrograma: "Programme website",
    ambitosTitulo: "Areas for theses and dissertations",
    tesisTitulo: "Supervised doctoral theses",
    tesisSubnav: "Supervised theses",
    tesisTexto:
      "Theses defended under the supervision or co-supervision of group members.",
    direccion: "Supervisors",
    verTesis: "View the thesis",
    seminarioSubnav: "International Seminar",
    direccionAcademica: "Academic director",
    organizan: "Organised by",
    jornadas: "Sessions",
    jornada: "Session",
    verEventos: "Posters and reports in Events",
    profesoradoTitulo: "Teacher training and bachelor's and master's theses",
    profesoradoSubnav: "Teachers, TFG and TFM",
    profesoradoTexto:
      "Training for teachers and supervision of bachelor's and master's theses.",
    movilidadTitulo: "Research stays and mobility",
    movilidadSubnav: "Stays and mobility",
    contactar: "Contact us",
    logoIuce: "University Institute of Education Sciences (IUCE)",
    logoCfp: "Lifelong Learning Centre of the University of Salamanca",
  },
} as const;

export default async function FormacionPage() {
  await assertVisible("formacion");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Enlaces de las listas: rutas internas con prefijo de idioma; externas,
  // tal cual; lo que no sea un enlace seguro, sin enlace.
  const linkFor = (value: unknown): string | null => {
    const url = safeHref(value);
    if (!url) return null;
    return url.startsWith("/") ? href(url) : url;
  };
  const esExterno = (url: string) => /^https?:\/\//i.test(url);

  // Contenido editable desde el gestor (Contenido → Páginas → Formación)
  const [
    heroEyebrow,
    heroTitulo,
    intro,
    urlDoctorado,
    doctoradoIntro,
    seminarioEdicion,
    seminarioTitulo,
    seminarioSubtitulo,
    seminarioIntro,
    seminarioDireccion,
    movilidadIntro,
    cta,
    datos,
    programas,
    ambitos,
    tesis,
    jornadas,
    actividades,
    movilidad,
  ] = await Promise.all([
    getBlockText("formacion", "hero-eyebrow"),
    getBlockText("formacion", "hero-titulo"),
    getBlock("formacion", "intro"),
    getBlockText("formacion", "url-doctorado"),
    getBlock("formacion", "doctorado-intro"),
    getBlockText("formacion", "seminario-edicion"),
    getBlockText("formacion", "seminario-titulo"),
    getBlockText("formacion", "seminario-subtitulo"),
    getBlock("formacion", "seminario-intro"),
    getBlockText("formacion", "seminario-direccion"),
    getBlock("formacion", "movilidad-intro"),
    getBlock("formacion", "cta"),
    getListBlock("formacion", "list:datos"),
    getListBlock("formacion", "list:programas"),
    getListBlock("formacion", "list:ambitos"),
    getListBlock("formacion", "list:tesis"),
    getListBlock("formacion", "list:jornadas"),
    getListBlock("formacion", "list:actividades"),
    getListBlock("formacion", "list:movilidad"),
  ]);
  const doctoradoHref = safeHref(urlDoctorado);

  const subnav = [
    { id: "doctorado", label: t.doctoradoSubnav },
    ...(tesis.length > 0 ? [{ id: "tesis", label: t.tesisSubnav }] : []),
    { id: "seminario", label: t.seminarioSubnav },
    ...(actividades.length > 0
      ? [{ id: "profesorado", label: t.profesoradoSubnav }]
      : []),
    { id: "movilidad", label: t.movilidadSubnav },
  ];

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-11 pt-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-3.5">
              <Breadcrumb
                items={[
                  { label: t.inicio, href: href("/") },
                  { label: t.formacion },
                ]}
              />
            </div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
              {heroEyebrow}
            </p>
            <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
              {heroTitulo}
            </h1>
            <div
              className="page-block mb-6 max-w-[60ch] text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
            <div className="flex flex-wrap items-center gap-3">
              {doctoradoHref ? (
                <a
                  href={doctoradoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClassName({ size: "lg" }), "gap-1.5")}
                >
                  {t.programaDoctorado}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">{t.nuevaVentana}</span>
                </a>
              ) : null}
              <a
                href="#seminario"
                className="inline-flex items-center gap-2 px-2 py-3 text-base font-medium text-diderot-violet hover:underline"
              >
                {t.verSeminario}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {datos.length > 0 ? (
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
                      <CountUp value={String(d.cifra ?? "")} />
                    </p>
                    <p className="mt-1 text-xs leading-snug text-gray-500">
                      {String(d.texto ?? "")}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
        {/* Fuera de la rejilla de dos columnas: la subnavegación va a todo
            el ancho, bajo la cabecera. */}
        <div className="mx-auto max-w-6xl px-6 pb-7">
          <SectionSubnav items={subnav} />
        </div>
      </section>

      {/* Doctorado */}
      <section id="doctorado" className="scroll-mt-20 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">
            {t.doctoradoTitulo}
          </h2>
          <div
            className="page-block mb-8 max-w-[80ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: doctoradoIntro }}
          />

          {programas.length > 0 ? (
            <>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t.programas}
              </h3>
              <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {programas.map((p, i) => {
                  const enlace = linkFor(p.enlace);
                  const acento = p.acento === true || p.acento === "true";
                  return (
                    <Reveal key={i} delay={i * 90} className="h-full">
                      <article
                        className={cn(
                          "card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 border-t-[3px] bg-surface-card p-6 shadow-sm hover:shadow-md",
                          acento ? "border-t-diderot-amber" : "border-t-diderot-violet",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md bg-diderot-pale",
                            acento ? "text-diderot-amber" : "text-ink",
                          )}
                        >
                          <GraduationCap className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h4 className="text-lg font-semibold leading-snug text-gray-900">
                          {String(p.titulo ?? "")}
                        </h4>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {String(p.texto ?? "")}
                        </p>
                        {enlace ? (
                          <a
                            href={enlace}
                            target={esExterno(enlace) ? "_blank" : undefined}
                            rel={esExterno(enlace) ? "noopener noreferrer" : undefined}
                            className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
                          >
                            {t.webPrograma}
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            {esExterno(enlace) ? (
                              <span className="sr-only">{t.nuevaVentana}</span>
                            ) : null}
                          </a>
                        ) : null}
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </>
          ) : null}

          {ambitos.length > 0 ? (
            <>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t.ambitosTitulo}
              </h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ambitos.map((a, i) => {
                  const Icon = iconFor(a.icon);
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-md border border-gray-200 bg-surface-card px-4 py-3"
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {String(a.texto ?? "")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      {/* Tesis doctorales dirigidas */}
      {tesis.length > 0 ? (
        <section
          id="tesis"
          className="scroll-mt-20 border-b border-gray-200 bg-surface-card"
        >
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.tesisTitulo}
            </h2>
            <p className="mb-7 max-w-[80ch] text-sm text-gray-500">
              {t.tesisTexto}
            </p>
            <ol className="flex flex-col">
              {tesis.map((x, i) => {
                const enlace = linkFor(x.enlace);
                const anio = String(x.anio ?? "").trim();
                const direccion = String(x.direccion ?? "").trim();
                return (
                  <li key={i}>
                    <Reveal delay={Math.min(i, 5) * 70}>
                      <article
                        className={cn(
                          "grid grid-cols-[64px_1fr] items-start gap-4 border-t border-gray-100 py-5 sm:grid-cols-[76px_1fr] sm:gap-5",
                          i === tesis.length - 1 && "border-b",
                        )}
                      >
                        <span className="flex h-12 items-center justify-center rounded-md bg-diderot-indigo text-sm font-bold text-white sm:h-14 sm:text-base">
                          {anio}
                        </span>
                        <div>
                          <h3 className="text-base font-semibold leading-snug text-gray-900">
                            {String(x.titulo ?? "")}
                          </h3>
                          <p className="mt-1.5 text-sm text-gray-700">
                            {String(x.autoria ?? "")}
                          </p>
                          {direccion ? (
                            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                              <span className="font-semibold text-gray-600">
                                {t.direccion}:
                              </span>{" "}
                              {direccion}
                            </p>
                          ) : null}
                          {enlace ? (
                            <a
                              href={enlace}
                              target={esExterno(enlace) ? "_blank" : undefined}
                              rel={esExterno(enlace) ? "noopener noreferrer" : undefined}
                              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
                            >
                              {t.verTesis}
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                              {esExterno(enlace) ? (
                                <span className="sr-only">{t.nuevaVentana}</span>
                              ) : null}
                            </a>
                          ) : null}
                        </div>
                      </article>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Seminario Internacional */}
      <section id="seminario" className="scroll-mt-20 border-b border-gray-200">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-2.5 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
              <SoundWave bars={4} className="text-diderot-gold" />
              {seminarioEdicion}
            </p>
            <h2 className="mb-2 text-balance text-2xl font-bold tracking-tight text-gray-900">
              {seminarioTitulo}
            </h2>
            {seminarioSubtitulo ? (
              <p className="mb-4 text-lg leading-snug text-gray-600">
                {seminarioSubtitulo}
              </p>
            ) : null}
            <div
              className="page-block mb-6 text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: seminarioIntro }}
            />
            <dl className="mb-6 flex flex-col gap-4 text-sm">
              {seminarioDireccion ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t.direccionAcademica}
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {seminarioDireccion}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t.organizan}
                </dt>
                {/* Logos sobre placa blanca fija: se ven igual en tema oscuro. */}
                <dd className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="flex h-14 items-center rounded-md border border-gray-200 bg-white px-3">
                    <Image
                      src="/images/diderot-logo.png"
                      alt="DIDEROT"
                      width={1023}
                      height={295}
                      className="h-8 w-auto"
                    />
                  </span>
                  <span className="flex h-14 items-center rounded-md border border-gray-200 bg-white px-3">
                    <Image
                      src="/images/afiliaciones/iuce-logo.png"
                      alt={t.logoIuce}
                      width={800}
                      height={362}
                      className="h-9 w-auto"
                    />
                  </span>
                  <span className="flex h-14 items-center rounded-md border border-gray-200 bg-white px-2">
                    <Image
                      src="/images/afiliaciones/cfp-usal.png"
                      alt={t.logoCfp}
                      width={500}
                      height={217}
                      className="h-11 w-auto"
                    />
                  </span>
                </dd>
              </div>
            </dl>
            <Link
              href={href("/eventos")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
            >
              {t.verEventos}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {jornadas.length > 0 ? (
            <aside className="staff-lines rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm">
              <h3 className="mb-[18px] text-base font-semibold text-gray-900">
                {t.jornadas}
              </h3>
              <ol className="flex flex-col">
                {jornadas.map((j, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3.5 border-t border-gray-100 py-3.5"
                  >
                    <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-diderot-indigo text-xs font-bold text-white">
                      <span className="sr-only">{t.jornada} </span>
                      {String(j.codigo ?? "")}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-snug text-gray-900">
                        {String(j.titulo ?? "")}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {String(j.fecha ?? "")}
                      </p>
                      {j.lugar ? (
                        <p className="text-xs text-gray-500">
                          {String(j.lugar)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-[18px] border-t border-gray-100 pt-4">
                <Link
                  href={href("/eventos")}
                  className={cn(
                    buttonClassName({ variant: "outline", size: "sm" }),
                    "w-full",
                  )}
                >
                  {t.verEventos}
                </Link>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      {/* Formación del profesorado, TFG y TFM */}
      {actividades.length > 0 ? (
        <section
          id="profesorado"
          className="scroll-mt-20 border-b border-gray-200 bg-surface-card"
        >
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.profesoradoTitulo}
            </h2>
            <p className="mb-7 max-w-[80ch] text-sm text-gray-500">
              {t.profesoradoTexto}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {actividades.map((a, i) => {
                const Icon = iconFor(a.icon);
                const acento = a.acento === true || a.acento === "true";
                const enlace = linkFor(a.enlace);
                return (
                  <Reveal key={i} delay={i * 90} className="h-full">
                    <article
                      className={cn(
                        "card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 border-t-[3px] bg-surface-page p-6 shadow-sm hover:shadow-md",
                        acento ? "border-t-diderot-amber" : "border-t-diderot-violet",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-md bg-diderot-pale",
                          acento ? "text-diderot-amber" : "text-ink",
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {String(a.titulo ?? "")}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {String(a.texto ?? "")}
                      </p>
                      {a.cta && enlace ? (
                        <a
                          href={enlace}
                          target={esExterno(enlace) ? "_blank" : undefined}
                          rel={esExterno(enlace) ? "noopener noreferrer" : undefined}
                          className="mt-auto w-fit text-sm font-medium text-diderot-violet hover:underline"
                        >
                          {String(a.cta)}
                          {esExterno(enlace) ? (
                            <span className="sr-only"> {t.nuevaVentana}</span>
                          ) : null}
                        </a>
                      ) : null}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Estancias de investigación y movilidad */}
      <section id="movilidad" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">
            {t.movilidadTitulo}
          </h2>
          <div
            className="page-block mb-7 max-w-[80ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: movilidadIntro }}
          />
          {movilidad.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {movilidad.map((m, i) => {
                const Icon = iconFor(m.icon);
                return (
                  <Reveal key={i} delay={i * 90} className="h-full">
                    <div className="flex h-full items-start gap-3.5 rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm">
                      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                        <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="mb-1 text-sm font-semibold text-gray-900">
                          {String(m.titulo ?? "")}
                        </h3>
                        <p className="text-xs leading-snug text-gray-600">
                          {String(m.texto ?? "")}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : null}
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
          <Link
            href={href("/contacto")}
            className={cn(buttonClassName(), "flex-none")}
          >
            {t.contactar}
          </Link>
        </div>
      </section>
    </>
  );
}
