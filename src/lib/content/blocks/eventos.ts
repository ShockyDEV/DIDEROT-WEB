import type { PageContentModule } from "./types";

/**
 * Contenido editable de «Eventos» (pageSlug "eventos"). Los eventos en sí
 * (título, fechas, lugar, cartel, crónica…) se gestionan en el panel →
 * Eventos; aquí solo quedan los textos fijos de la página.
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "eventos",
    label: "Eventos",
    blocks: [
      {
        blockKey: "intro",
        title: "Eventos — párrafo de cabecera",
        defaultContent: `<p>Seminarios, jornadas, congresos, conciertos y talleres organizados por DIDEROT o con participación del grupo.</p>`,
      },
      {
        blockKey: "seminario",
        title: "Eventos — banda del Seminario Internacional (enlaza a Formación; vacío = ocultar)",
        defaultContent: `<p>El seminario internacional del grupo, organizado con el IUCE y el Centro de Formación Permanente de la Universidad de Salamanca: tecnologías inteligentes y creatividad en entornos virtuales. Su primera edición (2026) se celebró en tres jornadas.</p>`,
      },
    ],
  },
  lists: [],
  blocksEn: {
    "eventos:intro": `<p>Seminars, study days, conferences, concerts and workshops organised by DIDEROT or with the group's participation.</p>`,
    "eventos:seminario": `<p>The group's international seminar, organised with the IUCE and the Lifelong Learning Centre of the University of Salamanca: intelligent technologies and creativity in virtual environments. Its first edition (2026) was held over three sessions.</p>`,
  },
  listsEn: {},
};
