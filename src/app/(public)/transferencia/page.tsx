import { metadataBilingue } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, Share2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { buttonClassName } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Reveal } from "@/components/ui/reveal";
import { SoundWave } from "@/components/ui/sound-wave";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible } from "@/lib/page-visibility";
import { SITE } from "@/lib/site";
import { safeHref } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Transferencia de conocimiento",
    description:
      "Transferencia de conocimiento de DIDEROT: DIDEROT TransferLab (GTC del IUCE), formación y asesoramiento, recursos digitales para la educación musical, proyectos con impacto y divulgación.",
  },
  {
    title: "Knowledge transfer",
    description:
      "DIDEROT's knowledge transfer: DIDEROT TransferLab (an IUCE Knowledge Transfer Group), training and advice, digital resources for music education, projects with impact and outreach.",
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
    gtcPanel: "Grupo de Transferencia del Conocimiento",
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
    gtcPanel: "Knowledge Transfer Group",
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
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-11 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.transferencia },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.eyebrow}
          </p>
          <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[80ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        </div>
      </section>

      {/* Misión */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pt-14">
          <Reveal from="scale">
            <div className="rounded-xl border border-gray-200 border-l-[3px] border-l-diderot-amber bg-surface-tinted p-7">
              <div
                className="page-block max-w-[95ch] text-base leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: mision }}
              />
            </div>
          </Reveal>
        </div>

        {/* Líneas y servicios de transferencia */}
        {lineas.length > 0 ? (
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
              {t.lineasTitulo}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {lineas.map((v, i) => {
                const Icon = iconFor(v.icon);
                return (
                  <Reveal key={i} delay={i * 90} className="h-full">
                    <article className="card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm hover:shadow-md">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-diderot-pale text-ink">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-base font-semibold text-gray-900">
                        {String(v.titulo ?? "")}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {String(v.texto ?? "")}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pb-12" />
        )}
      </section>

      {/* DIDEROT TransferLab (GTC del IUCE) */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <div id="transferlab" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
          <Reveal from="scale">
            <article className="grid overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm md:grid-cols-[minmax(0,300px)_1fr]">
              {/* Panel de marca: índigo con pentagrama y onda sonora */}
              <div
                className="flex flex-col justify-between gap-8 bg-diderot-indigo p-7 text-white"
                style={STAFF_ON_INDIGO}
              >
                <SoundWave bars={5} className="text-diderot-gold" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                    DIDEROT
                  </p>
                  <p className="text-3xl font-bold leading-tight tracking-tight">
                    TransferLab
                  </p>
                  <p className="mt-2 text-sm leading-snug text-white/80">
                    {t.gtcPanel} · IUCE
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 p-7 sm:p-8">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-diderot-pale text-diderot-amber">
                    <Share2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-diderot-amber">
                    {t.gtcEyebrow}
                  </p>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                  DIDEROT TransferLab
                </h2>
                <div
                  className="page-block max-w-[80ch] text-base leading-relaxed text-gray-600"
                  dangerouslySetInnerHTML={{ __html: transferlab }}
                />
                <div className="mt-auto flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
                        <InitialsAvatar
                          initials={iniciales}
                          className="h-10 w-10 text-xs"
                        />
                      )}
                      <span>
                        <span className="block text-xs text-gray-500">
                          {t.direccion}
                        </span>
                        <span className="font-medium text-gray-900">
                          {director}
                        </span>
                      </span>
                    </p>
                  ) : null}
                  <a
                    href={SITE.links.iuce}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
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
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
                  {t.proyectosTitulo}
                </h2>
                <p className="max-w-[80ch] text-sm text-gray-500">
                  {t.proyectosTexto}
                </p>
              </div>
              <Link
                href={href("/investigacion#proyectos")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
              >
                {t.verProyectos}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {proyectos.map((p, i) => {
                const acronimo = String(p.acronimo ?? "").trim();
                const titulo = String(p.titulo ?? "").trim();
                const financiacion = String(p.financiacion ?? "").trim();
                const periodo = String(p.periodo ?? "").trim();
                const ip = String(p.ip ?? "").trim();
                const texto = String(p.texto ?? "").trim();
                const enlace = linkFor(p.enlace);
                return (
                  <Reveal key={i} delay={(i % 3) * 90} className="h-full">
                    <article className="card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-violet bg-surface-card p-6 shadow-sm hover:shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {acronimo ? (
                          <span className="inline-flex w-fit items-center rounded-md bg-diderot-pale px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink">
                            {acronimo}
                          </span>
                        ) : (
                          <span />
                        )}
                        {periodo ? (
                          <span className="text-xs font-medium text-gray-500">
                            {periodo}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-base font-semibold leading-snug text-gray-900">
                        {titulo}
                      </h3>
                      {financiacion ? (
                        <p className="text-sm font-medium text-diderot-amber">
                          {financiacion}
                        </p>
                      ) : null}
                      {texto ? (
                        <p className="text-sm leading-relaxed text-gray-600">
                          {texto}
                        </p>
                      ) : null}
                      {ip || enlace ? (
                        <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 pt-3">
                          {ip ? (
                            <p className="text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">
                                {t.ip}:
                              </span>{" "}
                              {ip}
                            </p>
                          ) : null}
                          {enlace ? (
                            <a
                              href={enlace}
                              target={enlace.startsWith("http") ? "_blank" : undefined}
                              rel={enlace.startsWith("http") ? "noopener noreferrer" : undefined}
                              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
                            >
                              {t.webProyecto}
                              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                              {enlace.startsWith("http") ? (
                                <span className="sr-only">{t.nuevaVentana}</span>
                              ) : null}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Divulgación */}
      {divulgacion.length > 0 ? (
        <section className="border-t border-gray-200 bg-surface-card">
          <div id="divulgacion" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.divulgacionTitulo}
            </h2>
            <p className="mb-7 max-w-[80ch] text-sm text-gray-500">
              {t.divulgacionTexto}
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {divulgacion.map((d, i) => {
                const Icon = iconFor(d.icon);
                const enlace = linkFor(d.enlace);
                const externo = enlace?.startsWith("http") ?? false;
                const cuerpo = (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-diderot-pale text-ink">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">
                      {String(d.titulo ?? "")}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {String(d.texto ?? "")}
                    </p>
                  </>
                );
                const tarjeta =
                  "flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-surface-page p-6 shadow-sm";
                return (
                  <Reveal key={i} delay={i * 90} className="h-full">
                    {enlace ? (
                      <a
                        href={enlace}
                        target={externo ? "_blank" : undefined}
                        rel={externo ? "noopener noreferrer" : undefined}
                        className={cn(
                          tarjeta,
                          "card-lift group hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
                        )}
                      >
                        {cuerpo}
                        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet">
                          {externo ? (
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                          )}
                          {externo ? (
                            <span className="sr-only">{t.nuevaVentana}</span>
                          ) : null}
                        </span>
                      </a>
                    ) : (
                      <article className={tarjeta}>{cuerpo}</article>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* OTC USAL */}
      {otcHref ? (
        <section className="border-t border-gray-200">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <Reveal>
              <div className="flex flex-col items-start gap-6 rounded-xl border border-gray-200 bg-surface-card p-7 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-5 sm:items-center">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-diderot-indigo text-white">
                    <Building2 className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {t.otcNombre}
                    </p>
                    <div
                      className="page-block mt-0.5 max-w-[70ch] text-sm leading-relaxed text-gray-600"
                      dangerouslySetInnerHTML={{ __html: otcDescripcion }}
                    />
                  </div>
                </div>
                <a
                  href={otcHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonClassName({ variant: "outline" }),
                    "flex-none gap-1.5",
                  )}
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

      {/* CTA */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div
            className="page-block text-sm text-gray-600 [&_strong]:text-base [&_strong]:font-semibold [&_strong]:text-gray-900"
            dangerouslySetInnerHTML={{ __html: cta }}
          />
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
