/**
 * Páginas públicas que se pueden ocultar desde el panel (Visualización).
 *
 * Fuera del registro quedan a propósito: la portada, las páginas legales
 * (aviso legal, privacidad, cookies, accesibilidad — obligatorias). Ocultar una página la retira del menú y hace que su URL
 * responda 404 a los visitantes; la administración sí puede seguir viéndola
 * para trabajar en ella.
 */
export interface PublicPageDef {
  /** Clave estable (se guarda en BD). */
  slug: string;
  label: string;
  /** Ruta pública. */
  path: string;
  /** Para qué sirve, en el panel. */
  hint: string;
}

/**
 * Secciones DENTRO de páginas que se pueden ocultar desde el panel. A
 * diferencia de las páginas, una sección oculta simplemente no se pinta (la
 * página sigue existiendo, sin 404) y puede nacer oculta por defecto
 * (defaultHidden) hasta que la administración decida mostrarla.
 */
export interface PublicSectionDef {
  /** Clave estable (comparte la tabla PageVisibility con las páginas). */
  slug: string;
  label: string;
  /** Ruta con ancla, para el enlace «ver» del panel. */
  path: string;
  hint: string;
  /** Estado cuando nadie ha tocado el interruptor todavía. */
  defaultHidden: boolean;
}

export const PUBLIC_SECTIONS: PublicSectionDef[] = [
  {
    slug: "seccion-proyectos",
    label: "Investigación — Proyectos",
    path: "/investigacion#proyectos",
    hint: "Explorador de proyectos del grupo (se gestionan en Proyectos)",
    defaultHidden: false,
  },
];

export const PUBLIC_PAGES: PublicPageDef[] = [
  {
    slug: "grupo",
    label: "El grupo",
    path: "/grupo",
    hint: "Presentación, objetivos, equipo y afiliación",
  },
  {
    slug: "investigacion",
    label: "Investigación",
    path: "/investigacion",
    hint: "Líneas de investigación y proyectos",
  },
  {
    slug: "publicaciones",
    label: "Publicaciones",
    path: "/publicaciones",
    hint: "Producción científica del grupo (se gestiona en Publicaciones)",
  },
  {
    slug: "transferencia",
    label: "Transferencia",
    path: "/transferencia",
    hint: "DIDEROT TransferLab, recursos y divulgación",
  },
  {
    slug: "formacion",
    label: "Formación",
    path: "/formacion",
    hint: "Doctorado, seminarios, estancias y formación del profesorado",
  },
  {
    slug: "eventos",
    label: "Eventos",
    path: "/eventos",
    hint: "Seminarios, jornadas y congresos",
  },
  {
    slug: "noticias",
    label: "Noticias",
    path: "/noticias",
    hint: "Actualidad del grupo",
  },
  {
    slug: "contacto",
    label: "Contacto",
    path: "/contacto",
    hint: "Formulario y datos de contacto",
  },
];
