import { metadataBilingue } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { buttonClassName } from "@/components/ui/button";
import { Eyebrow, Gota } from "@/components/ui/eyebrow";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { SoundWave } from "@/components/ui/sound-wave";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible, isSectionVisible } from "@/lib/page-visibility";
import { safeHref } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Formación",
    description:
      "Formación en DIDEROT: programas de doctorado, tesis doctorales dirigidas y el Seminario Internacional de didácticas digitales de la expresión musical y las artes performativas.",
  },
  {
    title: "Training",
    description:
      "Training at DIDEROT: doctoral programmes, supervised doctoral theses and the International Seminar on digital didactics of musical expression and the performing arts.",
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
    verEventos: "Carteles, programas y crónicas en Eventos",
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
    verEventos: "Posters, programmes and reports in Events",
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
    mostrarProfesorado,
    mostrarMovilidad,
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
    // Profesorado/TFG/TFM y Movilidad: ocultas por defecto (texto provisional
    // genérico); se muestran desde el panel → Visualización.
    isSectionVisible("formacion-profesorado"),
    isSectionVisible("formacion-movilidad"),
  ]);
  const doctoradoHref = safeHref(urlDoctorado);
  const hayProfesorado = mostrarProfesorado && actividades.length > 0;

  const subnav = [
    { id: "doctorado", label: t.doctoradoSubnav },
    ...(tesis.length > 0 ? [{ id: "tesis", label: t.tesisSubnav }] : []),
    { id: "seminario", label: t.seminarioSubnav },
    ...(hayProfesorado ? [{ id: "profesorado", label: t.profesoradoSubnav }] : []),
    ...(mostrarMovilidad ? [{ id: "movilidad", label: t.movilidadSubnav }] : []),
  ];

  return (
    <>
      {/* Cabecera: texto a la izquierda, cifras a la derecha */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto grid max-w-6xl items-end gap-12 px-6 pb-10 pt-12 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <div className="mb-6">
              <Breadcrumb items={[{ label: t.inicio, href: href("/") }, { label: t.formacion }]} />
            </div>
            {heroEyebrow ? <Eyebrow className="mb-3">{heroEyebrow}</Eyebrow> : null}
            <h1 className="mb-4 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-[46px]">
              {heroTitulo}
            </h1>
            <div
              className="page-block mb-7 max-w-[60ch] text-[17px] leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
              <a href="#seminario" className="link-sub inline-flex items-center gap-1.5 text-[15px] font-medium">
                {t.verSeminario}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {datos.length > 0 ? (
            <ul className="grid list-none grid-cols-2 gap-x-8 gap-y-7 p-0">
              {datos.map((d, i) => (
                <li
                  key={i}
                  className={cn(i === datos.length - 1 && datos.length % 2 === 1 && "col-span-2")}
                >
                  <Reveal from="right" delay={i * 110} className="h-full">
                    <div className="h-full border-l-2 border-diderot-gold pl-4">
                      <p className="font-serif text-[42px] leading-none tabular-nums text-ink">
                        <CountUp value={String(d.cifra ?? "")} />
                      </p>
                      <p className="mt-2 text-[13px] leading-snug text-gray-600">{String(d.texto ?? "")}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {/* Fuera de la rejilla de dos columnas: la subnavegación va a todo
            el ancho, bajo la cabecera. */}
        <div className="mx-auto max-w-6xl px-6">
          <SectionSubnav items={subnav} />
        </div>
      </section>

      {/* Doctorado */}
      <section id="doctorado" className="scroll-mt-20 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
            {t.doctoradoTitulo}
          </h2>
          <div
            className="page-block mb-10 max-w-[70ch] text-[17px] leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: doctoradoIntro }}
          />

          {programas.length > 0 ? (
            <>
              <h3 className="mb-5 text-lg font-semibold text-gray-900">{t.programas}</h3>
              <ul className="mb-12 grid list-none grid-cols-1 gap-x-10 gap-y-8 p-0 md:grid-cols-2">
                {programas.map((p, i) => {
                  const enlace = linkFor(p.enlace);
                  const acento = p.acento === true || p.acento === "true";
                  return (
                    <li key={i}>
                      <Reveal delay={i * 90} className="h-full">
                        <article
                          className={cn(
                            "flex h-full flex-col gap-2.5 pt-5",
                            acento ? "border-t-2 border-diderot-gold" : "border-t border-gray-300",
                          )}
                        >
                          <h4 className="text-lg font-semibold leading-snug text-gray-900">
                            {String(p.titulo ?? "")}
                          </h4>
                          <p className="text-[15px] leading-relaxed text-gray-600">{String(p.texto ?? "")}</p>
                          {enlace ? (
                            <a
                              href={enlace}
                              target={esExterno(enlace) ? "_blank" : undefined}
                              rel={esExterno(enlace) ? "noopener noreferrer" : undefined}
                              className="link-sub mt-auto inline-flex w-fit items-center gap-1 pt-1 text-sm font-medium"
                            >
                              {t.webPrograma}
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                              {esExterno(enlace) ? <span className="sr-only">{t.nuevaVentana}</span> : null}
                            </a>
                          ) : null}
                        </article>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {ambitos.length > 0 ? (
            <>
              <h3 className="mb-5 text-lg font-semibold text-gray-900">{t.ambitosTitulo}</h3>
              <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {ambitos.map((a, i) => (
                  <li key={i} className="flex items-baseline gap-2.5 text-[15px] text-gray-700">
                    <Gota className="text-diderot-gold" />
                    {String(a.texto ?? "")}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      {/* Tesis doctorales dirigidas: cronología con el año en serif */}
      {tesis.length > 0 ? (
        <section id="tesis" className="scroll-mt-20 border-b border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.tesisTitulo}
            </h2>
            <p className="mb-8 max-w-[70ch] text-[15px] text-gray-600">{t.tesisTexto}</p>
            <ol className="list-none border-b border-gray-200 p-0">
              {tesis.map((x, i) => {
                const enlace = linkFor(x.enlace);
                const anio = String(x.anio ?? "").trim();
                const direccion = String(x.direccion ?? "").trim();
                return (
                  <li key={i}>
                    <Reveal delay={Math.min(i, 5) * 70}>
                      <article className="grid grid-cols-[72px_1fr] items-baseline gap-4 border-t border-gray-200 py-6 sm:grid-cols-[110px_1fr] sm:gap-6">
                        <p className="font-serif text-[34px] leading-none tabular-nums text-ink sm:text-[40px]">
                          {anio}
                        </p>
                        <div>
                          <h3 className="text-[17px] font-semibold leading-snug text-gray-900">
                            {String(x.titulo ?? "")}
                          </h3>
                          <p className="mt-1.5 text-[15px] text-gray-700">{String(x.autoria ?? "")}</p>
                          {direccion ? (
                            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">
                              <span className="data-label">{t.direccion}</span> {direccion}
                            </p>
                          ) : null}
                          {enlace ? (
                            <a
                              href={enlace}
                              target={esExterno(enlace) ? "_blank" : undefined}
                              rel={esExterno(enlace) ? "noopener noreferrer" : undefined}
                              className="link-sub mt-2 inline-flex items-center gap-1 text-sm font-medium"
                            >
                              {t.verTesis}
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                              {esExterno(enlace) ? <span className="sr-only">{t.nuevaVentana}</span> : null}
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
            {seminarioEdicion ? (
              <p className="mb-3 inline-flex items-center gap-3 font-serif text-lg italic text-diderot-amber">
                <SoundWave bars={4} className="text-diderot-gold" />
                {seminarioEdicion}
              </p>
            ) : null}
            <h2 className="mb-2 text-balance text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {seminarioTitulo}
            </h2>
            {seminarioSubtitulo ? (
              <p className="mb-4 font-serif text-xl italic leading-snug text-gray-600">{seminarioSubtitulo}</p>
            ) : null}
            <div
              className="page-block mb-7 text-[17px] leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: seminarioIntro }}
            />
            <dl className="mb-7 flex flex-col gap-5 text-sm">
              {seminarioDireccion ? (
                <div>
                  <dt className="data-label">{t.direccionAcademica}</dt>
                  <dd className="mt-1 text-[15px] font-medium text-gray-900">{seminarioDireccion}</dd>
                </div>
              ) : null}
              <div>
                <dt className="data-label">{t.organizan}</dt>
                {/* Logos sobre placa blanca fija: se ven igual en tema oscuro. */}
                <dd className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="flex h-14 items-center rounded border border-gray-200 bg-white px-3">
                    <Image src="/images/diderot-logo.png" alt="DIDEROT" width={1023} height={295} className="h-8 w-auto" />
                  </span>
                  <span className="flex h-14 items-center rounded border border-gray-200 bg-white px-3">
                    <Image src="/images/afiliaciones/iuce-logo.png" alt={t.logoIuce} width={800} height={362} className="h-9 w-auto" />
                  </span>
                  <span className="flex h-14 items-center rounded border border-gray-200 bg-white px-2">
                    <Image src="/images/afiliaciones/cfp-usal.png" alt={t.logoCfp} width={500} height={217} className="h-11 w-auto" />
                  </span>
                </dd>
              </div>
            </dl>
            <Link href={href("/eventos")} className="link-sub text-sm font-medium">
              {t.verEventos}
            </Link>
          </div>

          {jornadas.length > 0 ? (
            <aside className="staff-lines rounded border border-gray-200 bg-surface-card px-6 pb-4 pt-6">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t.jornadas}</h3>
              <ol className="list-none p-0">
                {jornadas.map((j, i) => (
                  <li key={i} className="border-t border-gray-200 py-4 first:border-t-0">
                    <p className="font-serif text-[17px] italic text-diderot-amber">
                      {t.jornada} {String(j.codigo ?? "")}
                    </p>
                    <p className="mt-0.5 text-[15px] font-medium leading-snug text-gray-900">
                      {String(j.titulo ?? "")}
                    </p>
                    <p className="mt-1 text-[13px] tabular-nums text-gray-600">{String(j.fecha ?? "")}</p>
                    {j.lugar ? <p className="text-[13px] text-gray-500">{String(j.lugar)}</p> : null}
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </div>
      </section>

      {/* Formación del profesorado, TFG y TFM (sección desactivada por defecto) */}
      {hayProfesorado ? (
        <section id="profesorado" className="scroll-mt-20 border-b border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.profesoradoTitulo}
            </h2>
            <p className="mb-8 max-w-[70ch] text-[15px] text-gray-600">{t.profesoradoTexto}</p>
            <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {actividades.map((a, i) => {
                const enlace = linkFor(a.enlace);
                return (
                  <li key={i}>
                    <Reveal delay={i * 90} className="h-full">
                      <article className="flex h-full flex-col gap-2 border-t border-gray-300 pt-4">
                        <h3 className="text-lg font-semibold text-gray-900">{String(a.titulo ?? "")}</h3>
                        <p className="text-sm leading-relaxed text-gray-600">{String(a.texto ?? "")}</p>
                        {a.cta && enlace ? (
                          <a
                            href={enlace}
                            target={esExterno(enlace) ? "_blank" : undefined}
                            rel={esExterno(enlace) ? "noopener noreferrer" : undefined}
                            className="link-sub mt-auto w-fit pt-1 text-sm font-medium"
                          >
                            {String(a.cta)}
                            {esExterno(enlace) ? <span className="sr-only"> {t.nuevaVentana}</span> : null}
                          </a>
                        ) : null}
                      </article>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Estancias de investigación y movilidad (sección desactivada por defecto) */}
      {mostrarMovilidad ? (
        <section id="movilidad" className="scroll-mt-20 border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.movilidadTitulo}
            </h2>
            <div
              className="page-block mb-8 max-w-[70ch] text-[17px] leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: movilidadIntro }}
            />
            {movilidad.length > 0 ? (
              <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-6 p-0 sm:grid-cols-3">
                {movilidad.map((m, i) => (
                  <li key={i} className="border-t border-gray-300 pt-4">
                    <h3 className="mb-1 text-[15px] font-semibold text-gray-900">{String(m.titulo ?? "")}</h3>
                    <p className="text-sm leading-snug text-gray-600">{String(m.texto ?? "")}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Llamada final */}
      <section className="bg-surface-tinted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
          <div
            className="page-block text-[15px] text-gray-600 [&_strong]:block [&_strong]:text-xl [&_strong]:font-semibold [&_strong]:text-gray-900"
            dangerouslySetInnerHTML={{ __html: cta }}
          />
          <Link href={href("/contacto")} className={cn(buttonClassName(), "flex-none")}>
            {t.contactar}
          </Link>
        </div>
      </section>
    </>
  );
}
