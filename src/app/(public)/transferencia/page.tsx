import { metadataBilingue } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClassName } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Reveal } from "@/components/ui/reveal";
import { SoundWave } from "@/components/ui/sound-wave";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible, isSectionVisible } from "@/lib/page-visibility";
import { SITE } from "@/lib/site";
import { safeHref } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Transferencia de conocimiento",
    description:
      "Transferencia de conocimiento de DIDEROT: DIDEROT TransferLab (GTC del IUCE), plataformas y proyectos con impacto en la educación y el patrimonio musical.",
  },
  {
    title: "Knowledge transfer",
    description:
      "DIDEROT's knowledge transfer: DIDEROT TransferLab (an IUCE Knowledge Transfer Group), platforms and projects with impact on education and musical heritage.",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde el servicio de bloques).
const T = {
  es: {
    inicio: "Inicio",
    transferencia: "Transferencia",
    eyebrow: "Investigación al servicio de la sociedad",
    titulo: "Transferencia de conocimiento",
    lineasTitulo: "Qué ofrecemos",
    gtcEyebrow: "Grupo de Transferencia del Conocimiento del IUCE",
    gtcPanel: "Grupo de Transferencia del Conocimiento del IUCE",
    direccion: "Dirección",
    iuce: "Instituto Universitario de Ciencias de la Educación (IUCE)",
    nuevaVentana: "(se abre en una ventana nueva)",
    proyectosTitulo: "Plataformas y proyectos con impacto",
    proyectosTexto:
      "Proyectos en los que la investigación del grupo se convierte en herramientas, recursos y redes al servicio de la educación y el patrimonio musical.",
    ip: "IP",
    webProyecto: "Web del proyecto",
    verProyectos: "Todos los proyectos del grupo",
    divulgacionTitulo: "Divulgación",
    divulgacionTexto:
      "La investigación, contada fuera de las revistas científicas.",
    otcNombre: "Oficina de Transferencia de Conocimiento de la USAL",
    contactar: "Contactar con DIDEROT",
  },
  en: {
    inicio: "Home",
    transferencia: "Knowledge transfer",
    eyebrow: "Research at the service of society",
    titulo: "Knowledge transfer",
    lineasTitulo: "What we offer",
    gtcEyebrow: "IUCE Knowledge Transfer Group",
    gtcPanel: "IUCE Knowledge Transfer Group",
    direccion: "Head",
    iuce: "University Institute of Education Sciences (IUCE)",
    nuevaVentana: "(opens in a new window)",
    proyectosTitulo: "Platforms and projects with impact",
    proyectosTexto:
      "Projects in which the group's research becomes tools, resources and networks serving education and musical heritage.",
    ip: "PI",
    webProyecto: "Project website",
    verProyectos: "All the group's projects",
    divulgacionTitulo: "Outreach",
    divulgacionTexto: "Research, told beyond the scientific journals.",
    otcNombre: "Knowledge Transfer Office (OTC) of the USAL",
    contactar: "Contact DIDEROT",
  },
} as const;

/** Pentagrama blanco para el panel índigo (.staff-lines es para fondos claros). */
const STAFF_ON_INDIGO = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0, transparent 13px, rgba(255,255,255,0.09) 13px, rgba(255,255,255,0.09) 14px)",
};

const sinTildes = (x: string) =>
  x.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export default async function TransferenciaPage() {
  await assertVisible("transferencia");

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

  // Textos y listas editables (Contenido → Páginas → Transferencia).
  const [
    intro,
    mision,
    transferlab,
    director,
    urlOtc,
    otcDescripcion,
    cta,
    lineas,
    proyectos,
    divulgacion,
    mostrarLineas,
    mostrarDivulgacion,
  ] = await Promise.all([
    getBlock("transferencia", "intro"),
    getBlock("transferencia", "mision"),
    getBlock("transferencia", "transferlab"),
    getBlockText("transferencia", "transferlab-direccion"),
    getBlockText("transferencia", "url-otc"),
    getBlock("transferencia", "otc-descripcion"),
    getBlock("transferencia", "cta"),
    getListBlock("transferencia", "list:lineas"),
    getListBlock("transferencia", "list:proyectos"),
    getListBlock("transferencia", "list:divulgacion"),
    // Líneas y Divulgación: ocultas por defecto (texto provisional genérico);
    // se muestran desde el panel → Visualización cuando haya contenido propio.
    isSectionVisible("transferencia-lineas"),
    isSectionVisible("transferencia-divulgacion"),
  ]);
  const otcHref = safeHref(urlOtc);

  // Retrato de la dirección del TransferLab: se empareja el nombre con su
  // ficha del equipo para usar su foto. Sin BD (o sin coincidencia única),
  // se muestran sus iniciales.
  let ficha: { name: string; photo: string | null } | null = null;
  if (director) {
    try {
      const miembros = await prisma.member.findMany({
        where: { active: true },
        select: { name: true, photo: true },
      });
      const a = sinTildes(director).split(/[\s-]+/).filter(Boolean);
      const hits = miembros.filter((m) => {
        const b = sinTildes(m.name).split(/[\s-]+/).filter(Boolean);
        // Un nombre contiene al otro (la ficha puede omitir el segundo nombre).
        return a.every((x) => b.includes(x)) || b.every((x) => a.includes(x));
      });
      // Ante ambigüedad, mejor las iniciales que la foto de otra persona.
      ficha = hits.length === 1 ? hits[0] : null;
    } catch {
      // BD no disponible.
    }
  }
  const iniciales = director
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.transferencia }]}
        eyebrow={t.eyebrow}
        title={t.titulo}
        intro={intro}
      />

      {/* Misión: texto destacado con el filete ámbar, sin caja */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pt-14">
          <Reveal>
            <div
              className="page-block max-w-[62ch] border-l-2 border-diderot-gold pl-6 font-serif text-[22px] italic leading-snug text-gray-800 sm:text-[24px]"
              dangerouslySetInnerHTML={{ __html: mision }}
            />
          </Reveal>
        </div>

        {/* Líneas y servicios de transferencia (sección desactivada por defecto) */}
        {mostrarLineas && lineas.length > 0 ? (
          <div id="lineas" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.lineasTitulo}
            </h2>
            <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {lineas.map((v, i) => (
                <li key={i}>
                  <Reveal delay={i * 90} className="h-full">
                    <article className="flex h-full flex-col gap-2 border-t border-gray-300 pt-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        {String(v.titulo ?? "")}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">{String(v.texto ?? "")}</p>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="pb-14" />
        )}
      </section>

      {/* DIDEROT TransferLab (GTC del IUCE) */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <div id="transferlab" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
          <Reveal>
            <article className="grid overflow-hidden rounded border border-gray-200 bg-surface-card md:grid-cols-[minmax(0,300px)_1fr]">
              {/* Panel de marca: índigo con pentagrama y ondas sonoras */}
              <div
                className="flex flex-col justify-between gap-8 bg-diderot-indigo p-7 text-white"
                style={STAFF_ON_INDIGO}
              >
                <SoundWave bars={5} className="text-diderot-gold" />
                <div>
                  <p className="font-serif text-lg italic text-white/80">DIDEROT</p>
                  <p className="text-3xl font-semibold leading-tight tracking-tight">TransferLab</p>
                  <p className="mt-2 text-sm leading-snug text-white/80">{t.gtcPanel}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-7 sm:p-8">
                <Eyebrow>{t.gtcEyebrow}</Eyebrow>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                  DIDEROT TransferLab
                </h2>
                <div
                  className="page-block max-w-[80ch] text-[17px] leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: transferlab }}
                />
                <div className="mt-auto flex flex-col gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {director ? (
                    <p className="flex items-center gap-3 text-sm text-gray-600">
                      {ficha?.photo ? (
                        <Image
                          src={ficha.photo}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 flex-none rounded-full object-cover"
                        />
                      ) : (
                        <InitialsAvatar initials={iniciales} className="h-10 w-10 text-xs" />
                      )}
                      <span>
                        <span className="data-label block">{t.direccion}</span>
                        <span className="font-medium text-gray-900">{director}</span>
                      </span>
                    </p>
                  ) : null}
                  <a
                    href={SITE.links.iuce}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-sub inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    {t.iuce}
                    <ArrowUpRight className="h-4 w-4 flex-none" aria-hidden="true" />
                    <span className="sr-only">{t.nuevaVentana}</span>
                  </a>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* Plataformas y proyectos con impacto */}
      {proyectos.length > 0 ? (
        <section className="border-t border-gray-200">
          <div id="proyectos" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                  {t.proyectosTitulo}
                </h2>
                <p className="max-w-[70ch] text-[15px] text-gray-600">{t.proyectosTexto}</p>
              </div>
              <Link href={href("/investigacion#proyectos")} className="link-sub text-sm font-medium">
                {t.verProyectos}
              </Link>
            </div>
            <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-12 p-0 md:grid-cols-2 lg:grid-cols-3">
              {proyectos.map((p, i) => {
                const acronimo = String(p.acronimo ?? "").trim();
                const titulo = String(p.titulo ?? "").trim();
                const financiacion = String(p.financiacion ?? "").trim();
                const periodo = String(p.periodo ?? "").trim();
                const ip = String(p.ip ?? "").trim();
                const texto = String(p.texto ?? "").trim();
                const enlace = linkFor(p.enlace);
                const externo = enlace?.startsWith("http") ?? false;
                return (
                  <li key={i}>
                    <Reveal delay={(i % 3) * 90} className="h-full">
                      <article className="flex h-full flex-col gap-2.5 border-t-2 border-diderot-gold pt-5">
                        <p className="flex flex-wrap items-baseline justify-between gap-3">
                          {acronimo ? (
                            <span className="text-xl font-semibold tracking-tight text-ink">{acronimo}</span>
                          ) : (
                            <span />
                          )}
                          {periodo ? (
                            <span className="font-serif text-lg italic tabular-nums text-gray-600">{periodo}</span>
                          ) : null}
                        </p>
                        <h3 className="text-[15px] font-semibold leading-snug text-gray-900">{titulo}</h3>
                        {financiacion ? (
                          <p className="text-sm text-diderot-amber">{financiacion}</p>
                        ) : null}
                        {texto ? <p className="text-sm leading-relaxed text-gray-600">{texto}</p> : null}
                        {ip || enlace ? (
                          <div className="mt-auto flex flex-col gap-2 pt-2">
                            {ip ? (
                              <p className="text-[13px] text-gray-600">
                                <span className="data-label">{t.ip}</span> {ip}
                              </p>
                            ) : null}
                            {enlace ? (
                              <a
                                href={enlace}
                                target={externo ? "_blank" : undefined}
                                rel={externo ? "noopener noreferrer" : undefined}
                                className="link-sub inline-flex w-fit items-center gap-1 text-sm font-medium"
                              >
                                {t.webProyecto}
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                {externo ? <span className="sr-only">{t.nuevaVentana}</span> : null}
                              </a>
                            ) : null}
                          </div>
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

      {/* Divulgación (sección desactivada por defecto) */}
      {mostrarDivulgacion && divulgacion.length > 0 ? (
        <section className="border-t border-gray-200 bg-surface-card">
          <div id="divulgacion" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.divulgacionTitulo}
            </h2>
            <p className="mb-8 max-w-[70ch] text-[15px] text-gray-600">{t.divulgacionTexto}</p>
            <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {divulgacion.map((d, i) => {
                const enlace = linkFor(d.enlace);
                const externo = enlace?.startsWith("http") ?? false;
                return (
                  <li key={i}>
                    <Reveal delay={i * 90} className="h-full">
                      <article className="flex h-full flex-col gap-2 border-t border-gray-300 pt-4">
                        <h3 className="text-base font-semibold text-gray-900">{String(d.titulo ?? "")}</h3>
                        <p className="text-sm leading-relaxed text-gray-600">{String(d.texto ?? "")}</p>
                        {enlace ? (
                          <a
                            href={enlace}
                            target={externo ? "_blank" : undefined}
                            rel={externo ? "noopener noreferrer" : undefined}
                            className="link-sub mt-auto inline-flex w-fit items-center gap-1 pt-1 text-sm font-medium"
                          >
                            {String(d.titulo ?? "")}
                            {externo ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                            {externo ? <span className="sr-only">{t.nuevaVentana}</span> : null}
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

      {/* OTC USAL */}
      {otcHref ? (
        <section className="border-t border-gray-200">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <Reveal>
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.otcNombre}</h2>
                  <div
                    className="page-block mt-1 max-w-[70ch] text-[15px] leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: otcDescripcion }}
                  />
                </div>
                <a
                  href={otcHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-sub inline-flex flex-none items-center gap-1 text-sm font-medium"
                >
                  {otcHref.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">{t.nuevaVentana}</span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Llamada final */}
      <section className="border-t border-gray-200 bg-surface-tinted">
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
