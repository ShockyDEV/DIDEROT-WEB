/**
 * Contenido semilla de noticias, extraído de los prototipos del handoff
 * (contenido real de iuce.usal.es). Única fuente de verdad hasta que el panel
 * de administración gestione las noticias: la usan las páginas públicas
 * (Inicio, Noticias, detalle) y el seed de Prisma.
 *
 * `content` es HTML (mismo formato que producirá el editor del admin).
 */
export interface NewsItem {
  slug: string;
  title: string;
  category: string;
  /** Fecha ISO para ordenar y para `publishedAt` en el seed. */
  publishedAt: string;
  /** Fecha corta para tarjetas (como en los prototipos). */
  dateDisplay: string;
  /** Fecha larga para el detalle. */
  dateLong: string;
  author: string;
  excerpt: string;
  photoLabel: string;
  photoCaption?: string;
  /** Ruta de la imagen de portada real (p. ej. /uploads/legacy/x.jpg). */
  coverImage?: string | null;
  content: string;
  featured?: boolean;
}

export const NEWS_CATEGORIES = [
  "Congresos",
  "Formación",
  "Innovación docente",
  "Investigación",
  "Premios",
  "Doctorado",
  "Institucional",
] as const;

// Etiqueta EN de cada categoría (el valor guardado y el filtro de URL siguen
// siendo el español). Compartido por la portada, el listado y el detalle.
export const NEWS_CATEGORY_EN: Record<string, string> = {
  Congresos: "Conferences",
  Formación: "Training",
  "Innovación docente": "Teaching innovation",
  Investigación: "Research",
  Premios: "Awards",
  Doctorado: "PhD",
  Institucional: "Institutional",
};

/** Etiqueta de categoría según idioma (es = tal cual; en = traducida). */
export function categoryLabel(category: string, locale: "es" | "en"): string {
  return locale === "en" ? (NEWS_CATEGORY_EN[category] ?? category) : category;
}

export const news: NewsItem[] = [
  {
    slug: "xxii-congreso-tecnologia-conocimiento-sociedad",
    title:
      "La USAL, en la XXII edición del Congreso Internacional de Tecnología, Conocimiento y Sociedad",
    category: "Congresos",
    publishedAt: "2026-04-20",
    dateDisplay: "20 abr 2026",
    dateLong: "20 de abril de 2026",
    author: "Redacción IUCE",
    excerpt:
      "La Universidad del Egeo celebró en la isla de Rodas la edición 2026 del congreso, bilingüe y en modalidad híbrida, con participación del profesorado del IUCE.",
    photoLabel: "Foto — Congreso de Rodas",
    photoCaption:
      "Sesión plenaria de la edición 2026, celebrada en la Universidad del Egeo (Rodas, Grecia).",
    featured: true,
    content: `<p>La <strong>Universidad del Egeo</strong> fue la institución anfitriona de la XXII edición del Congreso Internacional de Tecnología, Conocimiento y Sociedad, celebrada los días 16 y 17 de abril de 2026 en la isla de Rodas (Grecia), en modalidad híbrida y con programa bilingüe.</p>
<p>El congreso reunió a investigadores de más de veinte países en torno a los retos que la tecnología plantea a la sociedad contemporánea: inteligencia artificial en contextos educativos, brecha digital, ciudadanía y gobernanza del conocimiento.</p>
<blockquote><p>«La conversación sobre tecnología educativa ya no va de herramientas, sino de evidencia: qué mejora realmente el aprendizaje y en qué condiciones.»</p></blockquote>
<p>El profesorado del IUCE participó con varias comunicaciones sobre <strong>evaluación educativa mediada por tecnología</strong> y analítica del aprendizaje, en línea con los proyectos activos del Instituto y del grupo GRIAL.</p>
<p>La próxima edición del congreso se celebrará en 2027, con sede aún por confirmar. Las actas se publicarán en acceso abierto durante los próximos meses.</p>`,
  },
  {
    slug: "plan-formacion-profesorado-2026",
    title: "En marcha el Plan de Formación del Profesorado 2026",
    category: "Formación",
    publishedAt: "2026-01-15",
    dateDisplay: "15 ene 2026",
    dateLong: "15 de enero de 2026",
    author: "Redacción IUCE",
    excerpt:
      "Con más de 100 actividades planificadas, es el plan de mayor magnitud de los últimos años.",
    photoLabel: "Foto — Plan de Formación 2026",
    content: `<p>El IUCE pone en marcha el <strong>Plan de Formación Docente 2026</strong>, a iniciativa del Vicerrectorado de Estudios de Grado y Calidad de la Universidad de Salamanca.</p>
<p>Con más de un centenar de actividades planificadas —cursos, talleres, seminarios y SPOCs—, se trata del plan de mayor magnitud de los últimos años. La oferta cubre metodologías docentes, evaluación, tecnología educativa, idiomas y gestión de datos de investigación.</p>
<p>El programa completo y las inscripciones están disponibles en la sección de Formación de esta web y en la plataforma institucional.</p>`,
  },
  {
    slug: "jiducyl26-jornada-innovacion-docente",
    title: "La USAL, en la III Jornada de Innovación Docente JIDUCYL26",
    category: "Innovación docente",
    publishedAt: "2026-03-14",
    dateDisplay: "14 mar 2026",
    dateLong: "14 de marzo de 2026",
    author: "Redacción IUCE",
    excerpt:
      "Bajo el lema «De la experiencia a la evidencia», Burgos reunió a más de 300 docentes de las universidades públicas de Castilla y León.",
    photoLabel: "Foto — JIDUCYL26",
    content: `<p>La Universidad de Burgos acogió el 13 de marzo la <strong>III Jornada de Innovación Docente de las Universidades públicas de Castilla y León (JIDUCYL26)</strong>, bajo el lema «De la experiencia a la evidencia».</p>
<p>Más de 300 docentes de las cuatro universidades públicas de la comunidad compartieron experiencias de innovación con resultados contrastados. La delegación de la USAL, coordinada desde el IUCE, presentó comunicaciones sobre evaluación formativa, aula invertida y analítica del aprendizaje.</p>
<p>La próxima edición se celebrará en 2027 en la Universidad de León.</p>`,
  },
  {
    slug: "premio-ennova-health-visualmed",
    title: "Premio Ennova Health para el grupo VisualMed System",
    category: "Premios",
    publishedAt: "2025-11-21",
    dateDisplay: "21 nov 2025",
    dateLong: "21 de noviembre de 2025",
    author: "Redacción IUCE",
    excerpt: "Entregado en el Real Teatro del Retiro de Madrid.",
    photoLabel: "Foto — entrega del premio",
    content: `<p>El grupo de investigación <strong>VisualMed System</strong>, vinculado al IUCE y dirigido por Juan Antonio Juanes, ha recibido el <strong>Premio Ennova Health 2025</strong> por su trabajo en visualización médica y tecnologías aplicadas a la formación en Ciencias de la Salud.</p>
<p>El galardón se entregó en una ceremonia celebrada en el Real Teatro del Retiro de Madrid, que reunió a los proyectos más innovadores del ámbito sanitario y educativo.</p>`,
  },
  {
    slug: "congreso-evaluacion-educativa-bilbao",
    title: "I Congreso Internacional sobre Evaluación Educativa, en Bilbao",
    category: "Congresos",
    publishedAt: "2026-03-19",
    dateDisplay: "19 mar 2026",
    dateLong: "19 de marzo de 2026",
    author: "Redacción IUCE",
    excerpt:
      "Organizado por el ISEI-IVEI junto al Departamento de Educación del Gobierno Vasco.",
    photoLabel: "Foto — Congreso Bilbao",
    content: `<p>Bilbao acogió los días 19 y 20 de marzo el <strong>I Congreso Internacional sobre Evaluación Educativa</strong>, organizado por el Instituto Vasco de Evaluación e Investigación Educativa (ISEI-IVEI) junto al Departamento de Educación del Gobierno Vasco.</p>
<p>Investigadores del IUCE participaron con ponencias sobre evaluación diagnóstica de competencias y uso de evidencia en las políticas educativas.</p>`,
  },
  {
    slug: "semana-doctoral-2025",
    title: "La Semana Doctoral reúne a los doctorandos del programa",
    category: "Doctorado",
    publishedAt: "2025-11-10",
    dateDisplay: "nov 2025",
    dateLong: "noviembre de 2025",
    author: "Redacción IUCE",
    excerpt:
      "Seminarios y defensa de avances de investigación en el IUCE.",
    photoLabel: "Foto — Semana Doctoral",
    content: `<p>El programa de doctorado <strong>Formación en la Sociedad del Conocimiento</strong> celebró su Semana Doctoral anual en la sede del IUCE, en el Edificio Solís.</p>
<p>Durante una semana, los doctorandos presentaron los avances de sus investigaciones ante los grupos del programa, en sesiones combinadas con seminarios metodológicos y actividades de encuentro entre investigadores.</p>`,
  },
  {
    slug: "memoria-actividades-2025",
    title: "Publicada la memoria de actividades 2025 del IUCE",
    category: "Institucional",
    publishedAt: "2026-02-10",
    dateDisplay: "10 feb 2026",
    dateLong: "10 de febrero de 2026",
    author: "Redacción IUCE",
    excerpt: "Un año de investigación, formación y transferencia, en cifras.",
    photoLabel: "Foto — memoria de actividades",
    content: `<p>El IUCE ha publicado su <strong>memoria de actividades de 2025</strong>, que recoge en cifras un año de investigación, formación y transferencia al sistema educativo.</p>
<p>El documento repasa los proyectos activos, las actividades del Plan de Formación Docente, la producción científica de los grupos y la actividad de la revista EKS.</p>`,
  },
];

export function getNews(slug: string): NewsItem | undefined {
  return news.find((n) => n.slug === slug);
}

export function getFeaturedNews(): NewsItem {
  return news.find((n) => n.featured) ?? news[0];
}

/** Noticias del feed (todas menos la destacada), más recientes primero. */
export function getFeedNews(): NewsItem[] {
  const featured = getFeaturedNews();
  return news
    .filter((n) => n.slug !== featured.slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Otras noticias recientes distintas de la indicada (para "Más actualidad"). */
export function getRelatedNews(slug: string, count = 3): NewsItem[] {
  return news
    .filter((n) => n.slug !== slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, count);
}
