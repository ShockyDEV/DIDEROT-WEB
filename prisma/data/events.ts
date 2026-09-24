/**
 * Eventos de DIDEROT para la semilla de la BD.
 *
 * FUENTE: carteles oficiales de las tres jornadas del Seminario Internacional
 * «Didácticas digitales de la expresión musical y las artes performativas»
 * (1.ª edición, 2026), organizado por DIDEROT, el IUCE y el Centro de
 * Formación Permanente de la USAL (DIDEROT/Seminariosartwork). Los carteles
 * se sirven desde public/images/eventos.
 */
export interface EventSeed {
  title: string;
  titleEn: string;
  type: string;
  description: string;
  descriptionEn: string;
  /** Fecha y hora local (Europa/Madrid) en ISO con desfase. */
  startsAt: string;
  location: string;
  image: string;
  status: "UPCOMING" | "PAST" | "CANCELLED";
  newsSlug?: string;
}

const SEMINARIO =
  "Seminario Internacional «Didácticas digitales de la expresión musical y las artes performativas: tecnologías inteligentes y creatividad en entornos virtuales» (1.ª edición). Dirección académica: Javier F. Merchán Sánchez-Jara (IUCE). Organizan DIDEROT, el IUCE y el Centro de Formación Permanente de la Universidad de Salamanca.";
const SEMINARIO_EN =
  "International Seminar «Digital didactics of musical expression and the performing arts: intelligent technologies and creativity in virtual environments» (1st edition). Academic director: Javier F. Merchán Sánchez-Jara (IUCE). Organised by DIDEROT, the IUCE and the Lifelong Learning Centre of the University of Salamanca.";

export const events: EventSeed[] = [
  {
    title: "Jornada I · Encuentro de investigación predoctoral. Educación musical y artes performativas",
    titleEn: "Session I · Predoctoral research meeting. Music education and the performing arts",
    type: "Jornada",
    description: SEMINARIO,
    descriptionEn: SEMINARIO_EN,
    startsAt: "2026-04-30T16:00:00+02:00",
    location: "Aula 12A, Edificio Solís (Universidad de Salamanca)",
    image: "/images/eventos/jornada-i.jpg",
    status: "PAST",
    newsSlug: "seminario-internacional-didacticas-digitales-jornada-i",
  },
  {
    title:
      "Jornada II · Mesa de comunicaciones. Investigación y proyectos en educación musical y artes performativas",
    titleEn:
      "Session II · Paper session. Research and projects in music education and the performing arts",
    type: "Jornada",
    description: SEMINARIO,
    descriptionEn: SEMINARIO_EN,
    startsAt: "2026-06-04T16:00:00+02:00",
    location: "Aula 17A (IUCE), Edificio Solís",
    image: "/images/eventos/jornada-ii.jpg",
    status: "PAST",
  },
  {
    title: "Jornada III · Mesa de comunicaciones. Intersecciones entre arte, educación y tecnología",
    titleEn: "Session III · Paper session. Intersections between art, education and technology",
    type: "Jornada",
    description: SEMINARIO,
    descriptionEn: SEMINARIO_EN,
    startsAt: "2026-06-10T16:30:00+02:00",
    location: "Aula de Usos Múltiples (IUCE), Edificio Solís",
    image: "/images/eventos/jornada-iii.jpg",
    status: "PAST",
  },
];
