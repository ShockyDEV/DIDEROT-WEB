/**
 * Contenido semilla de eventos (de los prototipos del handoff). Lo usan la
 * página pública de Eventos y el seed de Prisma.
 */
export interface EventItem {
  title: string;
  /** Título en inglés (la web /en usa titleEn ?? title). */
  titleEn?: string;
  type: "Congreso" | "Seminario" | "Jornada";
  /** Fecha ISO de inicio (para el seed y para ordenar). */
  startsAt: string;
  location: string;
  meta: string;
  status: "UPCOMING" | "PAST";
  url?: string;
  /** Bloque de fecha (día/mes) de la fila de próximos. */
  dateBlock?: { top: string; bottom: string };
  /** Rango corto para la lista de celebrados. */
  dateRange?: string;
}

export const featuredEvent = {
  title: "ICED26 — International Consortium for Educational Development",
  titleEn: "ICED26 — International Consortium for Educational Development",
  type: "Congreso",
  description:
    "Salamanca acoge el congreso internacional de referencia en desarrollo educativo universitario, organizado con la participación del IUCE. Tres días de conferencias, talleres y comunicaciones en torno a la formación docente en Educación Superior.",
  dateDisplay: "Junio de 2026",
  startsAt: "2026-06-15",
  location: "Salamanca",
  url: "https://iced26.es/",
  photoLabel: "Imagen ICED26 / Salamanca",
};

export const upcomingEvents: EventItem[] = [
  {
    title: "Semana Doctoral 2026 — Formación en la Sociedad del Conocimiento",
    titleEn: "Doctoral Week 2026 — Education in the Knowledge Society",
    type: "Jornada",
    startsAt: "2026-11-09",
    location: "IUCE, Edificio Solís",
    meta: "Jornada · IUCE, Edificio Solís · Programa por confirmar",
    status: "UPCOMING",
    dateBlock: { top: "NOV", bottom: "2026" },
  },
];

export const pastEvents: EventItem[] = [
  {
    title: "XXII Congreso Internacional de Tecnología, Conocimiento y Sociedad",
    titleEn: "22nd International Conference on Technology, Knowledge and Society",
    type: "Congreso",
    startsAt: "2026-04-16",
    location: "Rodas (Grecia)",
    meta: "Congreso · Rodas (Grecia) · Universidad del Egeo",
    status: "PAST",
    dateRange: "16–17 abr",
  },
  {
    title: "I Congreso Internacional sobre Evaluación Educativa",
    titleEn: "1st International Conference on Educational Assessment",
    type: "Congreso",
    startsAt: "2026-03-19",
    location: "Bilbao",
    meta: "Congreso · Bilbao · ISEI-IVEI y Gobierno Vasco",
    status: "PAST",
    dateRange: "19–20 mar",
  },
  {
    title:
      "III Jornada de Innovación Docente JIDUCYL26 — «De la experiencia a la evidencia»",
    titleEn:
      "3rd Teaching Innovation Conference JIDUCYL26 — “From experience to evidence”",
    type: "Jornada",
    startsAt: "2026-03-13",
    location: "Burgos",
    meta: "Jornada · Burgos · Universidades públicas de Castilla y León",
    status: "PAST",
    dateRange: "13 mar",
  },
];
