import { metadataBilingue } from "@/lib/metadata";
import Image from "next/image";
import { ArrowUpRight, ExternalLink, Library, User, Users } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { buttonClassName } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Reveal } from "@/components/ui/reveal";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { prisma } from "@/lib/prisma";
import { groups as groupsFallback } from "@/lib/content/groups";
import { getPublicProjects } from "@/lib/projects-service";
import { getArticulosDireccion } from "@/lib/orcid";
import { ProjectsExplorer } from "@/components/investigacion/projects-explorer";
import { withLocale, type Locale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible, isSectionVisible } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Investigación",
    description:
      "Grupos de investigación, proyectos y publicaciones del IUCE: investigación interdisciplinar sobre los procesos de formación en Educación Superior.",
  },
  {
    title: "Research",
    description:
      "IUCE research groups, projects and publications: interdisciplinary research on training processes in Higher Education.",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques; los datos de BD se muestran tal cual).
const T = {
  es: {
    inicio: "Inicio",
    investigacion: "Investigación",
    titulo: "La investigación del IUCE",
    subnavGrupos: "Grupos",
    subnavProyectos: "Proyectos",
    subnavPublicaciones: "Publicaciones",
    gruposTitulo: "Grupos de investigación",
    gruposDescripcion:
      "Grupos de Investigación Reconocidos de la USAL vinculados al Instituto.",
    logoDe: "Logotipo de",
    webDe: "Web de",
    equipoInterdisciplinar: "Equipo interdisciplinar",
    proyectosTitulo: "Proyectos",
    publicacionesTitulo: "Publicaciones",
    portalEyebrow: "Portal de Investigación de la USAL",
    portalTitulo: "Producción científica del IUCE",
    verProduccion: "Ver la producción científica",
    visitarRevista: "Visitar la revista",
  },
  en: {
    inicio: "Home",
    investigacion: "Research",
    titulo: "Research at the IUCE",
    subnavGrupos: "Groups",
    subnavProyectos: "Projects",
    subnavPublicaciones: "Publications",
    gruposTitulo: "Research groups",
    gruposDescripcion:
      "USAL Recognised Research Groups linked to the Institute.",
    logoDe: "Logo of",
    webDe: "Website of",
    equipoInterdisciplinar: "Interdisciplinary team",
    proyectosTitulo: "Projects",
    publicacionesTitulo: "Publications",
    portalEyebrow: "USAL Research Portal",
    portalTitulo: "Scientific output of the IUCE",
    verProduccion: "View the scientific output",
    visitarRevista: "Visit the journal",
  },
} as const;

interface GroupCard {
  acronym: string;
  name: string;
  chip: string | null;
  lead: string | null;
  url: string | null;
  logo: string | null;
  /** Ficha del responsable, para poner su retrato junto al nombre. */
  leadMember: { name: string; photo: string | null } | null;
}

const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Iniciales del nombre, para el avatar de quien no tiene foto. */
function iniciales(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Empareja el responsable del grupo (texto libre y abreviado en el panel,
 * p. ej. «J. J. Mena») con su ficha de miembro, para poder mostrar su foto.
 *
 * Se busca SOLO entre los miembros del propio grupo: los responsables lo son
 * (invariante comprobado), y así un apellido común no puede emparejar con un
 * homónimo de otro grupo. Si el texto no cuadra con nadie (el panel admite
 * escribir cualquier cosa), devuelve null y la tarjeta cae al icono genérico.
 */
function buscarResponsable<T extends { name: string; photo: string | null }>(
  lead: string | null,
  members: T[],
): T | null {
  if (!lead) return null;
  const inicial = sinTildes(lead).charAt(0);
  const apellidos = sinTildes(lead.replace(/^(?:\p{Lu}\.\s*)+/u, "")).trim();
  if (!apellidos) return null;
  const hits = members.filter((m) => {
    const n = sinTildes(m.name);
    return n.startsWith(inicial) && n.includes(apellidos);
  });
  // Ante ambigüedad (dos personas del grupo encajarían), mejor el icono.
  return hits.length === 1 ? hits[0] : null;
}

/**
 * Grupos de investigación desde el gestor. La lista oficial (9 grupos,
 * verificada contra la web original) actúa de fallback sin BD. El nombre
 * usa nameEn (si existe) cuando la web se sirve en inglés.
 */
async function getGrupos(locale: Locale): Promise<GroupCard[]> {
  try {
    const rows = await prisma.researchGroup.findMany({
      orderBy: { acronym: "asc" },
      include: {
        members: {
          where: { active: true },
          select: { name: true, photo: true },
        },
      },
    });
    if (rows.length > 0) {
      return rows.map((g) => ({
        acronym: g.acronym,
        name: locale === "en" ? (g.nameEn ?? g.name) : g.name,
        chip: g.chip,
        lead: g.lead,
        url: g.url,
        logo: g.logo,
        leadMember: buscarResponsable(g.lead, g.members),
      }));
    }
  } catch {
    // BD no disponible
  }
  return groupsFallback.map((g) => ({
    acronym: g.acronym,
    name: g.name,
    chip: g.chip ?? null,
    lead: g.lead ?? null,
    url: g.url ?? null,
    logo: g.logo ?? null,
    leadMember: null,
  }));
}


export default async function InvestigacionPage() {
  await assertVisible("investigacion");

  // La sección de Proyectos se mantiene a mano: solo se pinta si la
  // administración la ha activado en el panel (Visualización → Secciones).
  const proyectosVisibles = await isSectionVisible("seccion-proyectos");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  const subnav = [
    { id: "grupos", label: t.subnavGrupos },
    ...(proyectosVisibles
      ? [{ id: "proyectos", label: t.subnavProyectos }]
      : []),
    { id: "publicaciones", label: t.subnavPublicaciones },
  ];
  // Contenido editable desde el gestor (Contenido → Páginas → Investigación).
  // Nota: DIDEROT figuraba por error entre los proyectos; es un grupo.
  const [
    grupos,
    intro,
    publicacionesDescripcion,
    portalDescripcion,
    urlPortal,
    eksDescripcion,
    urlEks,
    proyectosDescripcion,
    muestraTitulo,
    proyectos,
    articulos,
    articulosOrcid,
  ] = await Promise.all([
    getGrupos(locale),
    getBlock("investigacion", "intro"),
    getBlock("investigacion", "publicaciones-descripcion"),
    getBlock("investigacion", "portal-descripcion"),
    getBlockText("investigacion", "url-portal"),
    getBlock("investigacion", "eks-descripcion"),
    getBlockText("investigacion", "url-eks"),
    getBlock("investigacion", "proyectos-descripcion"),
    getBlockText("investigacion", "muestra-titulo"),
    proyectosVisibles ? getPublicProjects() : Promise.resolve([]),
    getListBlock("investigacion", "list:publicaciones"),
    // Última publicación de cada miembro de la dirección vía la API pública
    // de ORCID (caché de 24 h). Si falla, se usa la lista editable de abajo.
    getArticulosDireccion(locale),
  ]);
  const articulosVista = articulosOrcid ?? articulos;

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.investigacion },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.investigacion}
          </p>
          <h1 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[75ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
          <div className="mt-7">
            <SectionSubnav items={subnav} />
          </div>
        </div>
      </section>

      {/* Grupos */}
      <section id="grupos" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-7">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.gruposTitulo}
            </h2>
            <p className="max-w-[75ch] text-sm text-gray-500">
              {t.gruposDescripcion}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grupos.map((g, i) => {
              const LeadIcon = g.lead ? User : Users;
              // Retrato del responsable; si no se pudo emparejar con su ficha
              // (texto libre del panel) o no tiene foto, cae al icono.
              const responsable = g.leadMember?.photo ? (
                <Image
                  src={g.leadMember.photo}
                  alt=""
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] flex-none rounded-full object-cover"
                />
              ) : g.leadMember ? (
                <InitialsAvatar
                  initials={iniciales(g.leadMember.name)}
                  className="h-[22px] w-[22px] flex-none text-[9px]"
                />
              ) : (
                <LeadIcon
                  className="h-[13px] w-[13px] flex-none"
                  aria-hidden="true"
                />
              );
              const urlLabel = g.url
                ? g.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
                : null;
              // El logo y el nombre del grupo enlazan a su web (si la tiene).
              const cabecera = (
                <>
                  {g.logo ? (
                    // Placa blanca fija: los logos (algunos en negro) deben
                    // verse igual en tema claro y oscuro.
                    <div className="mb-1 flex h-16 items-center rounded-md bg-white px-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.logo}
                        alt={`${t.logoDe} ${g.acronym}`}
                        className="max-h-12 max-w-[160px] object-contain"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-ink transition-colors group-hover/web:text-diderot-violet">
                      {g.acronym}
                      {g.url ? (
                        <span className="ml-1.5 text-sm font-normal text-gray-300 transition-colors group-hover/web:text-diderot-violet">
                          ↗
                        </span>
                      ) : null}
                    </h3>
                    {g.chip ? (
                      <span className="flex-none rounded-full bg-diderot-pale px-2.5 py-[3px] text-[10px] font-bold tracking-[.04em] text-ink">
                        {g.chip}
                      </span>
                    ) : null}
                  </div>
                </>
              );
              return (
                <Reveal key={g.acronym} delay={(i % 3) * 80} className="h-full">
                <article className="card-lift flex h-full flex-col gap-2.5 rounded-xl border border-gray-200 bg-surface-card p-[22px] shadow-sm hover:border-brand-400 hover:shadow-md">
                  {g.url ? (
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${t.webDe} ${g.acronym} — ${urlLabel}`}
                      className="group/web flex flex-col gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2"
                    >
                      {cabecera}
                    </a>
                  ) : (
                    cabecera
                  )}
                  <p className="text-sm leading-normal text-gray-600">
                    {g.name}
                  </p>
                  <p className="mt-auto flex items-center gap-2 text-xs text-gray-500">
                    {responsable}
                    {g.lead ?? t.equipoInterdisciplinar}
                  </p>
                </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proyectos (solo si la sección está activada en el panel) */}
      {proyectosVisibles ? (
        <section
          id="proyectos"
          className="scroll-mt-20 border-y border-gray-200 bg-surface-card"
        >
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.proyectosTitulo}
            </h2>
            <div
              className="page-block mb-6 max-w-[80ch] text-sm text-gray-500"
              dangerouslySetInnerHTML={{ __html: proyectosDescripcion }}
            />
            <ProjectsExplorer
              projects={proyectos}
              currentYear={new Date().getFullYear()}
              locale={locale}
            />
          </div>
        </section>
      ) : null}

      {/* Publicaciones */}
      <section id="publicaciones" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
          <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
            {t.publicacionesTitulo}
          </h2>
          <div
            className="page-block mb-6 max-w-[80ch] text-sm text-gray-500"
            dangerouslySetInnerHTML={{ __html: publicacionesDescripcion }}
          />

          {/* Elemento principal: la producción científica en el Portal de
              Investigación de la USAL (la revista EKS queda como secundaria). */}
          <Reveal from="scale" className="mb-6 rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-amber bg-surface-tinted p-8 shadow-sm">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5 sm:items-center">
                <span className="flex h-16 w-16 flex-none items-center justify-center rounded-lg bg-diderot-indigo text-white">
                  <Library className="h-8 w-8" aria-hidden="true" />
                </span>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                    {t.portalEyebrow}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {t.portalTitulo}
                  </p>
                  <div
                    className="page-block mt-1 max-w-[62ch] text-sm leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: portalDescripcion }}
                  />
                </div>
              </div>
              {urlPortal ? (
                <a
                  href={urlPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName({ size: "lg" }) + " flex-none gap-1.5"}
                >
                  {t.verProduccion}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </Reveal>

          {muestraTitulo ? (
            <h3 className="mb-4 text-lg font-bold tracking-tight text-gray-900">
              {muestraTitulo}
            </h3>
          ) : null}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articulosVista.map((a, i) => {
              const enlace = String(a.enlace ?? "");
              const tarjeta = (
                <article className="card-lift h-full rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm hover:shadow-md">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                    {String(a.eyebrow)}
                  </p>
                  <p className="mb-2 text-sm font-semibold leading-normal text-gray-900">
                    {String(a.titulo)}
                    {enlace ? (
                      <span className="ml-1 text-gray-300" aria-hidden="true">
                        ↗
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.autores ? <>{String(a.autores)} — </> : null}
                    <em>{String(a.revista)}</em>
                  </p>
                </article>
              );
              return (
                <Reveal key={i} delay={i * 90} className="h-full">
                  {enlace ? (
                    <a
                      href={enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2"
                    >
                      {tarjeta}
                    </a>
                  ) : (
                    tarjeta
                  )}
                </Reveal>
              );
            })}
          </div>

          {/* Secundaria: revista EKS, editada en el IUCE */}
          <Reveal className="flex flex-col items-start gap-4 rounded-xl border border-gray-200 bg-surface-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-diderot-indigo text-xs font-bold text-white">
                EKS
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Education in the Knowledge Society
                </p>
                <div
                  className="page-block mt-0.5 max-w-[70ch] text-xs leading-relaxed text-gray-500"
                  dangerouslySetInnerHTML={{ __html: eksDescripcion }}
                />
              </div>
            </div>
            {urlEks ? (
              <a
                href={urlEks}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-none items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
              >
                {t.visitarRevista}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </Reveal>
        </div>
      </section>
    </>
  );
}
