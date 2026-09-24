import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Quote } from "lucide-react";
import { metadataBilingue } from "@/lib/metadata";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { Reveal } from "@/components/ui/reveal";
import { SoundWave } from "@/components/ui/sound-wave";
import {
  MembersGrid,
  type MemberGroup,
} from "@/components/grupo/members-grid";
import { getBlock, getListBlock } from "@/lib/content-blocks-service";
import type { ListItem } from "@/lib/content/list-blocks";
import { iconFor } from "@/lib/icon-map";
import { cn } from "@/lib/cn";
import {
  MEMBER_CATEGORIES,
  getPublicMembers,
  safeHttpUrl,
  safeImageSrc,
} from "@/lib/members-service";
import { pick, withLocale, type Locale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible, getHiddenPaths } from "@/lib/page-visibility";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "El grupo",
    description:
      "Presentación, objetivos, equipo y afiliación de DIDEROT, Grupo de Investigación Reconocido de la Universidad de Salamanca adscrito al IUCE.",
  },
  {
    title: "The group",
    description:
      "About, aims, team and affiliation of DIDEROT, a Recognised Research Group of the University of Salamanca affiliated with the IUCE.",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques; el equipo, desde la BD).
const T = {
  es: {
    inicio: "Inicio",
    grupo: "El grupo",
    titulo: "El grupo DIDEROT",
    presentacion: "Presentación",
    objetivos: "Objetivos",
    equipo: "Equipo",
    afiliacion: "Afiliación",
    enBreve: "El grupo en breve",
    citas: "Ideas que guían nuestro trabajo",
    altSolis: "Fachada del Edificio Solís, sede del IUCE en Salamanca",
    rotuloSolis: "Edificio Solís · sede del IUCE",
    conoceTransferLab: "Conoce DIDEROT TransferLab",
  },
  en: {
    inicio: "Home",
    grupo: "The group",
    titulo: "The DIDEROT group",
    presentacion: "About us",
    objetivos: "Aims",
    equipo: "Team",
    afiliacion: "Affiliation",
    enBreve: "The group at a glance",
    citas: "Ideas that guide our work",
    altSolis: "Façade of the Solís Building, home of the IUCE in Salamanca",
    rotuloSolis: "Solís Building · home of the IUCE",
    conoceTransferLab: "Discover DIDEROT TransferLab",
  },
} as const;

/**
 * Tarjeta de una institución de la lista editable «Afiliación». Logotipo en
 * versión clara/oscura (si no hay versión oscura, el claro va sobre una placa
 * blanca en tema oscuro) o, sin logotipo, el icono elegido en el panel. Si
 * tiene web, toda la tarjeta enlaza a ella.
 */
function AffiliationCard({ item }: Readonly<{ item: ListItem }>) {
  const titulo = String(item.titulo ?? "").trim();
  const texto = String(item.texto ?? "").trim();
  const enlace = safeHttpUrl(String(item.enlace ?? ""));
  const logo = safeImageSrc(String(item.logo ?? ""));
  const logoOscuro = safeImageSrc(String(item.logoOscuro ?? ""));
  const Icon = iconFor(item.icon);

  const contenido = (
    <>
      <span className="flex h-14 w-[132px] flex-none items-center justify-start">
        {logo ? (
          <>
            {/* Logotipos editables (locales o externos, de proporción libre):
                <img> con alto máximo en vez de next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              className={cn(
                "max-h-12 max-w-full object-contain",
                logoOscuro ? "dark:hidden" : "dark:rounded-md dark:bg-white dark:p-1.5",
              )}
            />
            {logoOscuro ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoOscuro}
                alt=""
                className="hidden max-h-11 max-w-full object-contain dark:block"
              />
            ) : null}
          </>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-diderot-pale">
            <Icon className="h-6 w-6 text-diderot-amber" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-diderot-violet">
          {titulo}
          {enlace ? (
            <ArrowUpRight
              className="ml-1 inline h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-diderot-violet"
              aria-hidden="true"
            />
          ) : null}
        </span>
        {texto ? (
          <span className="mt-1 block text-[13px] leading-relaxed text-gray-500">
            {texto}
          </span>
        ) : null}
      </span>
    </>
  );

  const clase =
    "flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-surface-page p-4 sm:flex-row sm:items-center";
  if (!enlace) return <div className={clase}>{contenido}</div>;
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        clase,
        "group card-lift shadow-sm hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
      )}
    >
      {contenido}
    </a>
  );
}

/** Miembros agrupados por categoría (en el orden fijo de la web), sin vacías. */
function agrupar(
  members: Awaited<ReturnType<typeof getPublicMembers>>,
  locale: Locale,
): MemberGroup[] {
  return MEMBER_CATEGORIES.map((c) => ({
    key: c.value,
    title: pick(locale, c.label, c.labelEn),
    members: members.filter((m) => m.category === c.value),
  })).filter((g) => g.members.length > 0);
}

export default async function GrupoPage() {
  await assertVisible("grupo");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);

  // Bloques y listas editables (panel → Contenido → Páginas → El grupo) y el
  // equipo desde la BD (panel → Equipo).
  const [
    heroParrafo,
    presentacion,
    datos,
    citas,
    objetivos,
    equipoIntro,
    afiliacionIntro,
    afiliaciones,
    transferlab,
    members,
    hiddenPaths,
  ] = await Promise.all([
    getBlock("grupo", "hero-parrafo"),
    getBlock("grupo", "presentacion"),
    getListBlock("grupo", "list:datos"),
    getListBlock("grupo", "list:citas"),
    getListBlock("grupo", "list:objetivos"),
    getBlock("grupo", "equipo-intro"),
    getBlock("grupo", "afiliacion-intro"),
    getListBlock("grupo", "list:afiliaciones"),
    getBlock("grupo", "transferlab"),
    getPublicMembers(locale),
    getHiddenPaths(),
  ]);

  const grupos = agrupar(members, locale);
  const totalMiembros = grupos.reduce((n, g) => n + g.members.length, 0);
  const hayObjetivos = objetivos.length > 0;
  const hayTransferLab = transferlab.replace(/<[^>]+>/g, "").trim() !== "";

  // Mismos ids que el desplegable «El grupo» de la cabecera.
  const subnav = [
    { id: "presentacion", label: t.presentacion },
    ...(hayObjetivos ? [{ id: "objetivos", label: t.objetivos }] : []),
    { id: "equipo", label: t.equipo },
    { id: "afiliacion", label: t.afiliacion },
  ];

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.grupo },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {pick(locale, SITE.name, SITE.nameEn)}
          </p>
          <h1 className="mb-3.5 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[70ch] text-base leading-relaxed text-gray-600"
            // Bloque editable desde el gestor (grupo:hero-parrafo)
            dangerouslySetInnerHTML={{ __html: heroParrafo }}
          />
          <div className="mt-7">
            <SectionSubnav items={subnav} />
          </div>
        </div>
      </section>

      {/* Presentación */}
      <section id="presentacion" className="scroll-mt-20">
        <div
          className={cn(
            "mx-auto max-w-6xl px-6 pt-14",
            citas.length === 0 && "pb-14",
          )}
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            <Reveal from="left">
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
                {t.presentacion}
              </h2>
              <div
                className="page-block text-base leading-relaxed text-gray-600"
                // Bloque editable desde el gestor (grupo:presentacion)
                dangerouslySetInnerHTML={{ __html: presentacion }}
              />
            </Reveal>

            {datos.length > 0 ? (
              <Reveal from="right" delay={120}>
                {/* Ficha del grupo sobre el pentagrama de la marca. */}
                <aside
                  aria-labelledby="grupo-en-breve"
                  className="staff-lines rounded-xl border border-gray-200 bg-surface-tinted px-7 py-7"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h3
                      id="grupo-en-breve"
                      className="text-sm font-bold uppercase tracking-wider text-ink"
                    >
                      {t.enBreve}
                    </h3>
                    <SoundWave className="text-diderot-gold" />
                  </div>
                  <ul className="flex list-none flex-col gap-5 p-0">
                    {datos.map((d, i) => {
                      const Icon = iconFor(d.icon);
                      return (
                        <li key={i} className="flex items-start gap-3.5">
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-gray-200 bg-surface-card shadow-sm">
                            <Icon className="h-[18px] w-[18px] text-ink" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-diderot-amber">
                              {String(d.etiqueta ?? "")}
                            </p>
                            <p className="mt-0.5 text-sm leading-snug text-gray-700">
                              {String(d.texto ?? "")}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              </Reveal>
            ) : null}
          </div>
        </div>

        {/* Citas: tarjetas con borde superior ámbar (como la bienvenida de la
            directora del IUCE), en dos columnas equilibradas. */}
        {citas.length > 0 ? (
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">{t.citas}</h3>
            <div className="gap-5 md:columns-2">
              {citas.map((c, i) => (
                <Reveal key={i} delay={i * 90} className="mb-5 break-inside-avoid">
                  <figure className="rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-amber bg-surface-card p-7 shadow-sm">
                    <Quote
                      className="mb-4 h-[22px] w-[22px] text-diderot-amber"
                      aria-hidden="true"
                    />
                    <blockquote className="text-[15px] leading-relaxed text-gray-600">
                      <p>{String(c.texto ?? "")}</p>
                    </blockquote>
                    {c.autor ? (
                      <figcaption className="mt-5 border-t border-gray-100 pt-4 text-sm font-semibold text-gray-900">
                        {String(c.autor)}
                      </figcaption>
                    ) : null}
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Objetivos */}
      {hayObjetivos ? (
        <section
          id="objetivos"
          className="scroll-mt-20 border-y border-gray-200 bg-surface-card"
        >
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal>
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
                {t.objetivos}
              </h2>
              <ul className="grid list-none grid-cols-1 gap-x-10 gap-y-4 p-0 md:grid-cols-2">
                {objetivos.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[15px] leading-relaxed text-gray-600"
                  >
                    <Check
                      className="mt-1 h-4 w-4 flex-none text-diderot-amber"
                      aria-hidden="true"
                    />
                    {String(o.texto ?? "")}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Equipo (BD). Buscador si hay más de 9 personas. */}
      <section id="equipo" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-8">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.equipo}
            </h2>
            <div
              className="page-block max-w-[70ch] text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: equipoIntro }}
            />
          </div>
          <MembersGrid
            groups={grupos}
            locale={locale}
            searchable={totalMiembros > 9}
          />
        </div>
      </section>

      {/* Afiliación */}
      <section
        id="afiliacion"
        className="scroll-mt-20 border-t border-gray-200 bg-surface-card"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
              {t.afiliacion}
            </h2>
            <div
              className="page-block text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: afiliacionIntro }}
            />
            {afiliaciones.length > 0 ? (
              <ul className="mt-6 flex list-none flex-col gap-3.5 p-0">
                {afiliaciones.map((a, i) => (
                  <li key={i}>
                    <Reveal delay={i * 80} className="h-full">
                      <AffiliationCard item={a} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Reveal from="right" className="relative">
            <div className="relative h-[320px] w-full overflow-hidden rounded-xl lg:h-[440px]">
              <Image
                src="/images/edificio-solis.jpg"
                alt={t.altSolis}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="pointer-events-none absolute bottom-[22px] left-0 rounded-r-md bg-diderot-indigo px-3.5 py-2 text-xs text-white">
              {t.rotuloSolis}
            </div>
          </Reveal>
        </div>

        {/* DIDEROT TransferLab (GTC del IUCE) → página de Transferencia */}
        {hayTransferLab ? (
          <div className="mx-auto max-w-6xl px-6 pb-16">
            <Reveal>
              <div className="flex flex-col items-start gap-5 rounded-xl border border-gray-200 border-l-[3px] border-l-diderot-amber bg-surface-tinted p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4 sm:items-center">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-diderot-indigo text-xs font-bold tracking-wide text-white">
                    GTC
                  </span>
                  <div
                    className="page-block max-w-[85ch] text-sm leading-relaxed text-gray-600"
                    // Bloque editable desde el gestor (grupo:transferlab)
                    dangerouslySetInnerHTML={{ __html: transferlab }}
                  />
                </div>
                {!hiddenPaths.includes("/transferencia") ? (
                  <Link
                    href={href("/transferencia")}
                    className="inline-flex min-h-6 flex-none items-center gap-1.5 rounded text-sm font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-tinted"
                  >
                    {t.conoceTransferLab}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </Reveal>
          </div>
        ) : null}
      </section>
    </>
  );
}
