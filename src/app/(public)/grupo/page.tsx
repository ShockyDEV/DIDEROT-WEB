import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { metadataBilingue } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/page-header";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { Reveal } from "@/components/ui/reveal";
import { Gota } from "@/components/ui/eyebrow";
import { SoundWave } from "@/components/ui/sound-wave";
import {
  MembersGrid,
  type MemberGroup,
} from "@/components/grupo/members-grid";
import { getBlock, getListBlock } from "@/lib/content-blocks-service";
import type { ListItem } from "@/lib/content/list-blocks";
import { cn } from "@/lib/cn";
import {
  MEMBER_CATEGORIES,
  getPublicMembers,
  safeHttpUrl,
  safeImageSrc,
} from "@/lib/members-service";
import { pick, withLocale, type Locale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { assertVisible, getHiddenPaths, isSectionVisible } from "@/lib/page-visibility";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "El grupo",
    description:
      "Presentación, equipo y afiliación de DIDEROT, Grupo de Investigación Reconocido de la Universidad de Salamanca adscrito al IUCE.",
  },
  {
    title: "The group",
    description:
      "About, team and affiliation of DIDEROT, a Recognised Research Group of the University of Salamanca affiliated with the IUCE.",
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
    rotuloSolis: "Edificio Solís, sede del IUCE",
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
    rotuloSolis: "Solís Building, home of the IUCE",
    conoceTransferLab: "Discover DIDEROT TransferLab",
  },
} as const;

/**
 * Institución de la lista editable «Afiliación»: logotipo (versión clara y
 * oscura; sin versión oscura, el claro va sobre una placa blanca) y texto.
 * Sin logotipo, solo texto. Si tiene web, toda la fila enlaza a ella.
 */
function AffiliationRow({ item }: Readonly<{ item: ListItem }>) {
  const titulo = String(item.titulo ?? "").trim();
  const texto = String(item.texto ?? "").trim();
  const enlace = safeHttpUrl(String(item.enlace ?? ""));
  const logo = safeImageSrc(String(item.logo ?? ""));
  const logoOscuro = safeImageSrc(String(item.logoOscuro ?? ""));

  const contenido = (
    <>
      {logo ? (
        <span className="flex h-14 w-[132px] flex-none items-center justify-start">
          {/* Logotipos editables (locales o externos, de proporción libre):
              <img> con alto máximo en vez de next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt=""
            className={cn(
              "max-h-12 max-w-full object-contain",
              logoOscuro ? "dark:hidden" : "dark:rounded-sm dark:bg-white dark:p-1.5",
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
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-ink">
          <span className={enlace ? "link-trace" : undefined}>{titulo}</span>
          {enlace ? (
            <ArrowUpRight
              className="ml-1 inline h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-diderot-amber"
              aria-hidden="true"
            />
          ) : null}
        </span>
        {texto ? (
          <span className="mt-1 block text-[13px] leading-relaxed text-gray-500">{texto}</span>
        ) : null}
      </span>
    </>
  );

  const clase = "flex h-full flex-col gap-4 py-4 sm:flex-row sm:items-center";
  if (!enlace) return <div className={clase}>{contenido}</div>;
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        clase,
        "group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
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
    mostrarObjetivos,
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
    // Objetivos: ocultos por defecto (repetían la presentación); se pueden
    // volver a mostrar desde el panel → Visualización.
    isSectionVisible("grupo-objetivos"),
  ]);

  const grupos = agrupar(members, locale);
  const totalMiembros = grupos.reduce((n, g) => n + g.members.length, 0);
  const hayObjetivos = mostrarObjetivos && objetivos.length > 0;
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
      <PageHeader
        breadcrumb={[{ label: t.inicio, href: href("/") }, { label: t.grupo }]}
        eyebrow={pick(locale, SITE.name, SITE.nameEn)}
        title={t.titulo}
        intro={heroParrafo}
      >
        <div className="mt-8">
          <SectionSubnav items={subnav} />
        </div>
      </PageHeader>

      {/* Presentación */}
      <section id="presentacion" className="scroll-mt-20">
        <div className={cn("mx-auto max-w-6xl px-6 pt-14", citas.length === 0 && "pb-14")}>
          <div className="grid items-start gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
            <Reveal from="left">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                {t.presentacion}
              </h2>
              {/* Justificado solo en pantallas anchas y con partición silábica
                  (lang correcto en <html>); en móvil, alineado a la izquierda. */}
              <div
                className="page-block hyphens-auto text-[17px] leading-relaxed text-gray-600 lg:text-justify"
                // Bloque editable desde el gestor (grupo:presentacion)
                dangerouslySetInnerHTML={{ __html: presentacion }}
              />
            </Reveal>

            {datos.length > 0 ? (
              <Reveal from="right" delay={120}>
                {/* Ficha del grupo sobre el pentagrama de la marca. */}
                <aside
                  aria-labelledby="grupo-en-breve"
                  className="staff-lines rounded border border-gray-200 bg-surface-tinted px-7 py-6"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 id="grupo-en-breve" className="text-lg font-semibold text-ink">
                      {t.enBreve}
                    </h3>
                    <SoundWave className="text-diderot-gold" />
                  </div>
                  <dl className="divide-y divide-gray-200">
                    {datos.map((d, i) => (
                      <div key={i} className="py-3">
                        <dt className="data-label">{String(d.etiqueta ?? "")}</dt>
                        <dd className="mt-0.5 text-[15px] leading-snug text-gray-800">
                          {String(d.texto ?? "")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </aside>
              </Reveal>
            ) : null}
          </div>
        </div>

        {/* Citas del grupo: serif en cursiva con filete ámbar, en dos columnas
            (tres si son tres, seis…: sin cita huérfana). */}
        {citas.length > 0 ? (
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
            <h3 className="mb-6 text-lg font-semibold text-gray-900">{t.citas}</h3>
            <div
              className={cn(
                "grid gap-x-12 gap-y-9 md:grid-cols-2",
                citas.length % 3 === 0 && "lg:grid-cols-3 lg:gap-x-10",
              )}
            >
              {citas.map((c, i) => (
                <Reveal key={i} delay={i * 90}>
                  <figure className="border-l-2 border-diderot-gold pl-6">
                    <blockquote className="font-serif text-[19px] italic leading-snug text-gray-800">
                      <p>{String(c.texto ?? "")}</p>
                    </blockquote>
                    {c.autor ? (
                      <figcaption className="mt-3 text-sm font-semibold text-diderot-amber">
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

      {/* Objetivos (sección desactivada por defecto) */}
      {hayObjetivos ? (
        <section id="objetivos" className="scroll-mt-20 border-y border-gray-200 bg-surface-card">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <Reveal>
              <h2 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
                {t.objetivos}
              </h2>
              <ul className="grid list-none grid-cols-1 gap-x-12 gap-y-4 p-0 md:grid-cols-2">
                {objetivos.map((o, i) => (
                  <li key={i} className="flex items-baseline gap-3 text-[15px] leading-relaxed text-gray-600">
                    <Gota className="text-diderot-gold" />
                    {String(o.texto ?? "")}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Equipo (BD). Buscador si hay más de 9 personas. */}
      <section id="equipo" className="scroll-mt-20 border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-9">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.equipo}
            </h2>
            <div
              className="page-block max-w-[66ch] text-[15px] text-gray-600"
              dangerouslySetInnerHTML={{ __html: equipoIntro }}
            />
          </div>
          <MembersGrid groups={grupos} locale={locale} searchable={totalMiembros > 9} />
        </div>
      </section>

      {/* Afiliación */}
      <section id="afiliacion" className="scroll-mt-20 border-t border-gray-200 bg-surface-card">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
              {t.afiliacion}
            </h2>
            <div
              className="page-block text-[17px] leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: afiliacionIntro }}
            />
            {afiliaciones.length > 0 ? (
              <ul className="mt-6 list-none divide-y divide-gray-200 border-y border-gray-200 p-0">
                {afiliaciones.map((a, i) => (
                  <li key={i}>
                    <Reveal delay={i * 80}>
                      <AffiliationRow item={a} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <Reveal from="right" className="relative">
            <div className="relative h-[320px] w-full overflow-hidden rounded lg:h-[440px]">
              <Image
                src="/images/edificio-solis.jpg"
                alt={t.altSolis}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <p className="pointer-events-none absolute bottom-[22px] left-0 bg-diderot-indigo px-4 py-2 font-serif text-[15px] italic text-white">
              {t.rotuloSolis}
            </p>
          </Reveal>
        </div>

        {/* DIDEROT TransferLab (GTC del IUCE) → página de Transferencia */}
        {hayTransferLab ? (
          <div className="mx-auto max-w-6xl px-6 pb-16">
            <Reveal>
              <div className="flex flex-col items-start gap-4 border-l-2 border-diderot-gold py-1 pl-6 md:flex-row md:items-center md:justify-between md:gap-10">
                <div
                  className="page-block max-w-[80ch] text-[15px] leading-relaxed text-gray-600"
                  // Bloque editable desde el gestor (grupo:transferlab)
                  dangerouslySetInnerHTML={{ __html: transferlab }}
                />
                {!hiddenPaths.includes("/transferencia") ? (
                  <Link href={href("/transferencia")} className="link-sub flex-none text-sm font-medium">
                    {t.conoceTransferLab}
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
