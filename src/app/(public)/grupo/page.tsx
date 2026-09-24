import { metadataBilingue } from "@/lib/metadata";
import {
  Check,
  ExternalLink,
  FileCheck,
  Fingerprint,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Quote,
  School,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SectionSubnav } from "@/components/layout/section-subnav";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import Image from "next/image";
import { MapEmbed } from "@/components/ui/map-embed";
import { Reveal } from "@/components/ui/reveal";
import { VideoEmbed } from "@/components/ui/video-embed";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import {
  MembersGrid,
  type PublicMember,
} from "@/components/grupo/members-grid";
import {
  GroupBadge,
  type MemberGroup,
} from "@/components/grupo/group-badge";
import { CopyEmail } from "@/components/ui/copy-email";
import { Timeline } from "@/components/grupo/timeline";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
import { prisma } from "@/lib/prisma";
import { withLocale, type Locale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Instituto",
    description:
      "Perfil del IUCE, equipo de dirección, miembros, ubicación en el Edificio Solís, instalaciones y edificio histórico.",
  },
  {
    title: "Institute",
    description:
      "IUCE profile, management team, members, location in the Solís Building, facilities and historic building.",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques; los datos del gestor no se tocan).
const T = {
  es: {
    breadcrumbInicio: "Inicio",
    breadcrumbActual: "Instituto",
    cronologia: "Cronología del Instituto",
    titulo: "El Instituto",
    subnavPerfil: "Perfil",
    subnavRiie: "RIIE",
    subnavEquipo: "Equipo de dirección",
    subnavMiembros: "Miembros",
    subnavUbicacion: "Ubicación",
    subnavInstalaciones: "Instalaciones",
    subnavEdificio: "Edificio histórico",
    subnavReservas: "Reserva de espacios",
    perfilTitulo: "Perfil",
    funcionesTitulo: "Funciones del Instituto",
    reglamentoNota:
      "Art. 3 del Reglamento del IUCE, aprobado por Consejo de Gobierno de 28 de junio de 2023.",
    descargarReglamento: "Descargar reglamento",
    honorifico: "Dra.",
    directoraIuce: "Directora del IUCE",
    bienvenidaTitulo: "Bienvenida de la directora",
    conocerRiie: "Conocer la RIIE",
    equipoTitulo: "Equipo de dirección",
    equipoContacto:
      "Para contactar por teléfono: 923 294 634 (Secretaría del IUCE) o 923 294 500 (centralita de la USAL) seguido de la extensión.",
    ptgasTitulo: "Personal técnico y de administración",
    ptgasAbbr: "Personal Técnico, de Gestión y de Administración y Servicios",
    escribir: "Escribir",
    miembrosTitulo: "Miembros",
    miembrosIntro:
      "Investigadoras e investigadores de todas las ramas de conocimiento vinculados al Instituto.",
    consejoTitulo: "Consejo asesor",
    consejoIntro:
      "Investigadoras e investigadores externos de referencia que asesoran al Instituto.",
    ubicacionTitulo: "Ubicación",
    contactoDireccion: "Dirección",
    contactoDireccionLineas: [
      "Paseo de Canalejas, 169 · Edificio Solís, 1.ª planta",
      "37008 Salamanca",
    ] as readonly string[],
    contactoTelefono: "Teléfono",
    contactoTelefonoLineas: [
      "+34 923 294 634 (Secretaría)",
      "+34 923 294 500 (centralita USAL + extensión)",
    ] as readonly string[],
    correoTitulo: "Correo electrónico",
    rorTitulo: "Identificador ROR",
    mapaTitulo: "Mapa — cómo llegar al Edificio Solís",
    instalacionesTitulo: "Instalaciones",
    instalacionesIntro:
      "Espacios de investigación, formación y trabajo en la primera planta del Edificio Solís.",
    reservar: "Reservar un espacio ↗",
    fotoPrefijo: "Foto",
    edificioTitulo: "Edificio histórico",
    altEdificio: "Fachada del Edificio Solís, sede del IUCE",
    videoTitulo: "El Colegio de Huérfanos, sede histórica del IUCE",
    paraSaberMas: "Para saber más",
    altFoto: (name: string) => `Fotografía de ${name}`,
    orcidLabel: (name: string) => `ORCID de ${name}`,
    portalDe: (name: string) => `Producción científica de ${name}`,
  },
  en: {
    breadcrumbInicio: "Home",
    breadcrumbActual: "Institute",
    cronologia: "Timeline of the Institute",
    titulo: "The Institute",
    subnavPerfil: "Profile",
    subnavRiie: "RIIE",
    subnavEquipo: "Management team",
    subnavMiembros: "Members",
    subnavUbicacion: "Location",
    subnavInstalaciones: "Facilities",
    subnavEdificio: "Historic building",
    subnavReservas: "Book a space",
    perfilTitulo: "Profile",
    funcionesTitulo: "Functions of the Institute",
    reglamentoNota:
      "Art. 3 of the IUCE Regulations, approved by the Governing Council on 28 June 2023.",
    descargarReglamento: "Download the regulations",
    honorifico: "Dr",
    directoraIuce: "Director of the IUCE",
    bienvenidaTitulo: "A welcome from the Director",
    conocerRiie: "About RIIE",
    equipoTitulo: "Management team",
    equipoContacto:
      "To reach us by phone, call 923 294 634 (IUCE Administrative Office) or 923 294 500 (USAL switchboard) followed by the extension.",
    ptgasTitulo: "Technical and administrative staff",
    ptgasAbbr: "Technical, Management, Administration and Services Staff",
    escribir: "Write",
    miembrosTitulo: "Members",
    miembrosIntro:
      "Researchers from every branch of knowledge affiliated with the Institute.",
    consejoTitulo: "Advisory board",
    consejoIntro:
      "Leading external researchers who advise the Institute.",
    ubicacionTitulo: "Location",
    contactoDireccion: "Address",
    contactoDireccionLineas: [
      "Paseo de Canalejas, 169 · Solís Building, 1st floor",
      "37008 Salamanca",
    ] as readonly string[],
    contactoTelefono: "Phone",
    contactoTelefonoLineas: [
      "+34 923 294 634 (Administrative Office)",
      "+34 923 294 500 (USAL switchboard + extension)",
    ] as readonly string[],
    correoTitulo: "Email",
    rorTitulo: "ROR identifier",
    mapaTitulo: "Map — how to get to the Solís Building",
    instalacionesTitulo: "Facilities",
    instalacionesIntro:
      "Research, training and work spaces on the first floor of the Solís Building.",
    reservar: "Book a space ↗",
    fotoPrefijo: "Photo",
    edificioTitulo: "Historic building",
    altEdificio: "Façade of the Solís Building, home of the IUCE",
    videoTitulo: "The Colegio de Huérfanos, historic seat of the IUCE",
    paraSaberMas: "Further reading",
    altFoto: (name: string) => `Photograph of ${name}`,
    orcidLabel: (name: string) => `${name}'s ORCID`,
    portalDe: (name: string) => `${name}: research output`,
  },
} as const;

// Cargos que llegan de la BD en español, con su equivalente para la web en
// inglés (los datos del gestor no se traducen; solo su presentación).
const ROLES_EN: Record<string, string> = {
  Directora: "Director",
  Subdirector: "Deputy Director",
  "Secretario Académico": "Academic Secretary",
  "Secretaría Administrativa": "Administrative Office",
  "Técnico Informático": "IT Technician",
};

// Áreas/adscripciones más habituales de los miembros (campo libre en BD). Solo
// se traducen las categorías genéricas; las líneas concretas de un grupo se
// dejan como están. El nombre del grupo tras « · Grupo …» es nombre propio.
const AREAS_EN: Record<string, string> = {
  Investigadores: "Researchers",
  "Consejo asesor": "Advisory board",
  "Personal de Administración y Servicios": "Administration and services staff",
  "Gestora Proyectos Investigación": "Research Projects Manager",
  "Gestor Proyectos Investigación": "Research Projects Manager",
};



interface DirectionMember {
  name: string;
  role: string;
  email: string | null;
  extension: string | null;
  photo: string | null;
  /** Ficha del Portal de Producción Científica (el nombre enlaza allí). */
  portalUrl: string | null;
  orcid: string | null;
  group: MemberGroup | null;
}

// Fallback si la BD no está disponible; en producción salen del gestor.
const direccionFallback: DirectionMember[] = [
  {
    name: "Susana Olmos Migueláñez",
    role: "Directora",
    email: "solmos@usal.es",
    extension: "3424",
    photo: null,
    portalUrl: null,
    group: null,
    orcid: "https://orcid.org/0000-0002-0816-4179",
  },
  {
    name: "Francisco José García Peñalvo",
    role: "Subdirector",
    email: "fgarcia@usal.es",
    extension: "6095",
    photo: null,
    portalUrl: null,
    group: null,
    orcid: "https://orcid.org/0000-0001-9987-5584",
  },
  {
    name: "Javier Félix Merchán Sánchez-Jara",
    role: "Secretario Académico",
    email: "javiermerchan@usal.es",
    extension: "3368",
    photo: null,
    portalUrl: null,
    group: null,
    orcid: "https://orcid.org/0000-0003-1828-5182",
  },
];

const CARGOS_DIRECCION = ["Directora", "Subdirector", "Secretario Académico"];

// PTGAS: Personal Técnico, de Gestión y de Administración y Servicios.
const CARGOS_PTGAS = ["Secretaría Administrativa", "Técnico Informático"];

const ptgasFallback: DirectionMember[] = [
  {
    name: "Fernando De Castro de Arriba",
    role: "Secretaría Administrativa",
    email: "fdecastro@usal.es",
    extension: "4634",
    photo: null,
    portalUrl: null,
    group: null,
    orcid: null,
  },
  {
    name: "Enrique González Gutiérrez",
    role: "Técnico Informático",
    email: "iuce.tecnico@usal.es",
    extension: "1903",
    photo: null,
    portalUrl: null,
    group: null,
    orcid: null,
  },
];

/** Equipo directivo y PTGAS (secretaría y técnico), con sus fotos del gestor. */
async function getDireccion(): Promise<{
  equipo: DirectionMember[];
  ptgas: DirectionMember[];
}> {
  try {
    const rows = await prisma.member.findMany({
      where: { role: { not: null }, active: true },
      include: { group: true },
    });
    const pick = (cargos: string[]) =>
      cargos
        .map((cargo) => rows.find((m) => m.role === cargo))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => ({
          name: m.name,
          role: m.role!,
          email: m.email,
          extension: m.extension,
          photo: m.photo,
          portalUrl: m.portalUrl,
          orcid: m.orcid,
          scopus: m.scopus,
          group: m.group
            ? {
                acronym: m.group.acronym,
                name: m.group.name,
                logo: m.group.logo,
                url: m.group.url,
              }
            : null,
        }));
    const equipo = pick(CARGOS_DIRECCION);
    if (equipo.length > 0) {
      return { equipo, ptgas: pick(CARGOS_PTGAS) };
    }
  } catch {
    // BD no disponible
  }
  return { equipo: direccionFallback, ptgas: ptgasFallback };
}

// Miembros por defecto (si la BD no está disponible); en producción salen
// del gestor (Equipo y miembros).
const miembrosFallback = [
  {
    name: "María José Rodríguez Conde",
    area: "Métodos de Investigación y Diagnóstico en Educación",
  },
  { name: "Fernando Martínez Abad", area: "Evaluación educativa · Grupo GRIAL" },
  {
    name: "Erla Mariela Morales Morgado",
    area: "Tecnología educativa · Grupo GRIAL",
  },
  { name: "Susana Olmos Migueláñez", area: "Directora · Evaluación educativa" },
  {
    name: "Francisco José García Peñalvo",
    area: "Director del grupo GRIAL · Informática",
  },
];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Miembros públicos, con el consejo asesor APARTE (se muestra en su propia
 *  banda, no mezclado en la rejilla de investigadores). */
async function getMiembros(
  locale: Locale,
): Promise<{ miembros: PublicMember[]; consejo: PublicMember[] }> {
  const en = locale === "en";
  // Traduce cada segmento «rol · área» por separado con sus mapas; deja igual
  // lo que no tenga traducción conocida (líneas concretas, nombres propios).
  const localizeArea = (role: string | null, area: string | null) =>
    [
      role ? (en ? (ROLES_EN[role] ?? role) : role) : null,
      area ? (en ? (AREAS_EN[area] ?? area) : area) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  try {
    const rows = await prisma.member.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { group: true },
    });
    if (rows.length > 0) {
      const esConsejo = (a: string | null) => a === "Consejo asesor";
      const map = (list: typeof rows): PublicMember[] =>
        list.map((m) => ({
          name: m.name,
          area: localizeArea(m.role, m.area),
          email: m.email,
          photo: m.photo,
          portalUrl: m.portalUrl,
          orcid: m.orcid,
          scopus: m.scopus,
          group: m.group
            ? {
                acronym: m.group.acronym,
                name: en ? (m.group.nameEn ?? m.group.name) : m.group.name,
                logo: m.group.logo,
                url: m.group.url,
              }
            : null,
        }));
      return {
        miembros: map(rows.filter((m) => !esConsejo(m.area))),
        consejo: map(rows.filter((m) => esConsejo(m.area))),
      };
    }
  } catch {
    // BD no disponible
  }
  return {
    miembros: miembrosFallback.map((m) => ({
      ...m,
      email: null,
      photo: null,
      group: null,
      portalUrl: null,
      orcid: null,
      scopus: null,
    })),
    consejo: [],
  };
}

export default async function InstitutoPage() {
  await assertVisible("instituto");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Cargos de BD (en español) mostrados con su equivalente en inglés.
  const roleLabel = (role: string) =>
    locale === "en" ? (ROLES_EN[role] ?? role) : role;
  const subnav = [
    { id: "perfil", label: t.subnavPerfil },
    { id: "riie", label: t.subnavRiie },
    { id: "equipo", label: t.subnavEquipo },
    { id: "miembros", label: t.subnavMiembros },
    { id: "ubicacion", label: t.subnavUbicacion },
    { id: "instalaciones", label: t.subnavInstalaciones },
    { id: "edificio", label: t.subnavEdificio },
    // Vive en otra web: sale del sitio en vez de saltar a un ancla.
    {
      id: "reservas",
      label: t.subnavReservas,
      external: "https://reservas.iuce.usal.es",
    },
  ];
  const contacto = [
    {
      icon: MapPin,
      title: t.contactoDireccion,
      lines: t.contactoDireccionLineas,
    },
    {
      icon: Phone,
      title: t.contactoTelefono,
      lines: t.contactoTelefonoLineas,
    },
  ];
  // Bloques editables desde el panel (Contenido → Páginas) + datos del gestor
  const [
    heroParrafo,
    perfilIntro,
    edificioTexto,
    edificioBiblio,
    urlVideoHistoria,
    urlReglamento,
    riie,
    urlRiie,
    citaDirectora,
    { miembros, consejo },
    { equipo, ptgas },
    funciones,
    hitos,
    instalaciones,
  ] = await Promise.all([
    getBlock("instituto", "hero-parrafo"),
    getBlock("instituto", "perfil-intro"),
    getBlock("instituto", "edificio"),
    getBlock("instituto", "edificio-biblio"),
    getBlockText("instituto", "url-video-historia"),
    getBlockText("instituto", "url-reglamento"),
    getBlock("instituto", "riie"),
    getBlockText("instituto", "url-riie"),
    getBlock("instituto", "cita-directora"),
    getMiembros(locale),
    getDireccion(),
    getListBlock("instituto", "list:funciones"),
    getListBlock("instituto", "list:hitos"),
    getListBlock("instituto", "list:instalaciones"),
  ]);
  const directora = equipo.find((m) => m.role === "Directora") ?? null;

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.breadcrumbInicio, href: href("/") },
                { label: t.breadcrumbActual },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            Instituto Universitario de Ciencias de la Educación
          </p>
          <h1 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[70ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: heroParrafo }}
          />
          <div className="mt-7">
            <SectionSubnav items={subnav} />
          </div>
        </div>
      </section>

      {/* Perfil */}
      <section id="perfil" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 pt-14">
          {/* Intro breve y tarjeta de hitos, a alturas parejas */}
          <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            <Reveal from="left">
              <div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
                  {t.perfilTitulo}
                </h2>
                <div
                  className="page-block text-base leading-relaxed text-gray-600"
                  // Bloque editable desde el gestor (instituto:perfil-intro)
                  dangerouslySetInnerHTML={{ __html: perfilIntro }}
                />
              </div>
            </Reveal>
            <Reveal from="right" delay={120} className="h-full">
              <div className="flex h-full flex-col justify-center rounded-xl border border-gray-200 bg-surface-tinted px-7 py-7">
                <Timeline items={hitos} label={t.cronologia} />
              </div>
            </Reveal>
          </div>

          {/* Funciones a todo el ancho (6 items en 3 columnas en escritorio) */}
          <Reveal className="mt-10">
            <h3 className="mb-3.5 text-lg font-semibold text-gray-900">
              {t.funcionesTitulo}
            </h3>
            <ul className="mb-2.5 grid list-none grid-cols-1 gap-x-8 gap-y-2.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {funciones.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-normal text-gray-600"
                >
                  <Check
                    className="mt-[3px] h-[15px] w-[15px] flex-none text-diderot-amber"
                    aria-hidden="true"
                  />
                  {String(f.texto)}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              {t.reglamentoNota}
              {urlReglamento ? (
                <>
                  {" "}
                  <a
                    href={urlReglamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-diderot-violet hover:underline"
                  >
                    {t.descargarReglamento}
                  </a>
                </>
              ) : null}
            </p>
          </Reveal>
        </div>

        {/* Bienvenida de la directora: a todo el ancho, texto en dos columnas
            de lectura y firma al pie (el texto se edita en el gestor). */}
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
          <Reveal>
            <div className="rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-amber bg-surface-card p-7 shadow-sm sm:p-9">
              {/* Ancho de carta: una sola columna de lectura centrada */}
              <div className="mx-auto max-w-[75ch]">
                <div className="mb-5 flex items-center gap-3">
                  <Quote
                    className="h-[22px] w-[22px] flex-none text-diderot-amber"
                    aria-hidden="true"
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.bienvenidaTitulo}
                  </h3>
                </div>
                <div
                  className="page-block text-[15px] leading-relaxed text-gray-600"
                  // Bloque editable desde el gestor (instituto:cita-directora)
                  dangerouslySetInnerHTML={{ __html: citaDirectora }}
                />
                <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                  {directora?.photo ? (
                    <Image
                      src={directora.photo}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 flex-none rounded-full object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      icon={User}
                      rounded="full"
                      className="h-12 w-12 flex-none"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.honorifico}{" "}
                      {directora?.name ?? "Susana Olmos Migueláñez"}
                    </p>
                    <p className="text-xs text-gray-500">{t.directoraIuce}</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Red de Institutos de Investigación en Educación (RIIE). Tiene ancla
            propia: la subnavegación (y el desplegable del menú) enlazan aquí. */}
        {urlRiie ? (
          <div id="riie" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-14">
            <Reveal>
              <div className="flex flex-col items-start gap-5 rounded-xl border border-gray-200 border-l-[3px] border-l-diderot-amber bg-surface-tinted p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4 sm:items-center">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-diderot-indigo text-xs font-bold tracking-wide text-white">
                    RIIE
                  </span>
                  <div
                    className="page-block max-w-[85ch] text-sm leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: riie }}
                  />
                </div>
                <a
                  href={urlRiie}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-none items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
                >
                  {t.conocerRiie}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </Reveal>
          </div>
        ) : null}
      </section>

      {/* Equipo de dirección */}
      <section
        id="equipo"
        className="scroll-mt-20 border-y border-gray-200 bg-surface-card"
      >
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
            {t.equipoTitulo}
          </h2>
          <p className="mb-7 max-w-[80ch] text-sm text-gray-500">
            {t.equipoContacto}
          </p>
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipo.map((p, i) => (
              <Reveal key={p.name} delay={i * 90} className="h-full">
              <div className="card-lift flex h-full flex-col items-start gap-4 rounded-xl border border-gray-200 bg-surface-page p-6 shadow-sm hover:shadow-md">
                {p.photo ? (
                  <Image
                    src={p.photo}
                    alt={t.altFoto(p.name)}
                    width={96}
                    height={96}
                    className="h-24 w-24 flex-none rounded-full object-cover"
                  />
                ) : (
                  <ImagePlaceholder
                    icon={User}
                    rounded="full"
                    className="h-24 w-24 flex-none"
                  />
                )}
                <div>
                  {/* El nombre lleva a su producción científica, igual que la
                      foto en la rejilla de miembros. */}
                  {p.portalUrl ? (
                    <a
                      href={p.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t.portalDe(p.name)}
                      className="group/persona inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
                    >
                      <span className="text-base font-semibold text-gray-900 transition-colors group-hover/persona:text-diderot-violet">
                        {p.name}
                      </span>
                      <ExternalLink
                        className="h-3 w-3 flex-none text-gray-300 transition-colors group-hover/persona:text-diderot-violet"
                        aria-hidden="true"
                      />
                    </a>
                  ) : (
                    <p className="text-base font-semibold text-gray-900">
                      {p.name}
                    </p>
                  )}
                  <p className="text-xs font-bold uppercase tracking-wider text-diderot-amber">
                    {roleLabel(p.role)}
                  </p>
                  {p.extension ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Ext. {p.extension}
                    </p>
                  ) : null}
                </div>
                {p.group ? <GroupBadge group={p.group} /> : null}
                <div className="mt-auto flex items-center gap-3">
                  {p.email ? <CopyEmail email={p.email} locale={locale} /> : null}
                  {p.orcid ? (
                    <a
                      href={p.orcid}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.orcidLabel(p.name)}
                      title={t.orcidLabel(p.name)}
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-gray-200 text-[10px] font-bold text-[#A6CE39] transition-colors hover:border-[#A6CE39] hover:bg-[#A6CE39]/10"
                    >
                      iD
                    </a>
                  ) : null}
                </div>
              </div>
              </Reveal>
            ))}
          </div>

          {/* PTGAS: personal técnico y de administración del Instituto */}
          <div className="rounded-xl border border-gray-200 bg-surface-tinted px-6 py-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t.ptgasTitulo}{" "}
              <abbr title={t.ptgasAbbr} className="no-underline">
                (PTGAS)
              </abbr>
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {ptgas.map((p) => (
                <div
                  key={p.name}
                  className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                >
                  {p.photo ? (
                    <Image
                      src={p.photo}
                      alt={t.altFoto(p.name)}
                      width={56}
                      height={56}
                      className="h-14 w-14 flex-none rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full border border-gray-200 bg-surface-card text-ink">
                      <User className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {roleLabel(p.role)}
                      {p.extension ? <> · Ext. {p.extension}</> : null}
                    </p>
                    {p.email ? (
                      <div className="mt-1.5">
                        <CopyEmail email={p.email} locale={locale} />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Miembros */}
      <section id="miembros" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-6">
            <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
              {t.miembrosTitulo}
            </h2>
            <p className="max-w-[70ch] text-sm text-gray-500">
              {t.miembrosIntro}
            </p>
          </div>
          <MembersGrid members={miembros} locale={locale} />

          {/* Consejo asesor: va APARTE, no mezclado en la rejilla de
              miembros (petición del usuario). */}
          {consejo.length > 0 ? (
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="mb-6">
                <h3 className="mb-1.5 text-xl font-bold tracking-tight text-gray-900">
                  {t.consejoTitulo}
                </h3>
                <p className="max-w-[70ch] text-sm text-gray-500">
                  {t.consejoIntro}
                </p>
              </div>
              <MembersGrid
                members={consejo}
                locale={locale}
                searchable={false}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Ubicación */}
      <section
        id="ubicacion"
        className="scroll-mt-20 border-y border-gray-200 bg-surface-card"
      >
        <div className="mx-auto grid max-w-6xl items-stretch gap-10 px-6 py-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
              {t.ubicacionTitulo}
            </h2>
            <div className="flex flex-col gap-[18px]">
              {contacto.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="flex items-start gap-3.5">
                    <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-normal text-gray-600">
                        {c.lines.map((line, i) => (
                          <span key={line}>
                            {i > 0 ? <br /> : null}
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3.5">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                  <Mail className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.correoTitulo}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    <a
                      href="mailto:iuce@usal.es"
                      className="text-diderot-violet hover:underline"
                    >
                      iuce@usal.es
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-diderot-pale text-ink">
                  <Fingerprint className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.rorTitulo}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600">
                    <a
                      href="https://ror.org/00xnj6419"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-diderot-violet hover:underline"
                    >
                      ror.org/00xnj6419
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <MapEmbed title={t.mapaTitulo} className="min-h-[320px] w-full" />
        </div>
      </section>

      {/* Instalaciones */}
      <section id="instalaciones" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-6 flex items-baseline justify-between gap-6">
            <div>
              <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
                {t.instalacionesTitulo}
              </h2>
              <p className="max-w-[70ch] text-sm text-gray-500">
                {t.instalacionesIntro}
              </p>
            </div>
            <a
              href="https://reservas.iuce.usal.es"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none text-sm font-medium text-diderot-violet hover:underline"
            >
              {t.reservar}
            </a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {instalaciones.map((f, i) => (
              <Reveal key={i} delay={(i % 4) * 90} className="h-full">
              <figure className="card-lift m-0 h-full overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm hover:shadow-md">
                {f.foto ? (
                  <div className="relative h-[140px] w-full">
                    <Image
                      src={String(f.foto)}
                      alt={String(f.titulo)}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <ImagePlaceholder
                    label={`${t.fotoPrefijo} — ${String(f.titulo)}`}
                    rounded="none"
                    className="h-[140px] w-full border-x-0 border-t-0"
                  />
                )}
                <figcaption className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-gray-900">
                    {String(f.titulo)}
                  </p>
                  <p className="mt-[3px] text-xs leading-snug text-gray-500">
                    {String(f.texto)}
                  </p>
                </figcaption>
              </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Edificio histórico */}
      <section
        id="edificio"
        className="scroll-mt-20 border-t border-gray-200 bg-surface-card"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
              {t.edificioTitulo}
            </h2>
            <div
              className="page-block text-base leading-relaxed text-gray-600"
              // Bloque editable desde el gestor (instituto:edificio)
              dangerouslySetInnerHTML={{ __html: edificioTexto }}
            />
          </div>
          <Reveal from="right" className="relative h-[340px] w-full overflow-hidden rounded-xl">
            <Image
              src="/images/edificio-solis.jpg"
              alt={t.altEdificio}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          </Reveal>
        </div>

        {/* Vídeo del edificio + bibliografía */}
        {urlVideoHistoria || edificioBiblio ? (
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 pb-16 lg:grid-cols-[1.2fr_1fr]">
            {urlVideoHistoria ? (
              <Reveal>
                <VideoEmbed src={urlVideoHistoria} title={t.videoTitulo} />
              </Reveal>
            ) : null}
            {edificioBiblio ? (
              <Reveal from="right">
                <div className="rounded-xl border border-gray-200 bg-surface-page p-6">
                  <h3 className="mb-3 text-base font-semibold text-gray-900">
                    {t.paraSaberMas}
                  </h3>
                  <div
                    className="page-block text-sm leading-relaxed text-gray-600 [&_li]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: edificioBiblio }}
                  />
                </div>
              </Reveal>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  );
}
