import { SITE } from "@/lib/site";
import type { PageContentModule } from "./types";

/**
 * Contenido editable de «Publicaciones» (pageSlug "publicaciones"). Las
 * referencias NO están aquí: viven en la tabla Publication (panel →
 * Publicaciones, alta manual o importación desde ORCID).
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "publicaciones",
    label: "Publicaciones",
    blocks: [
      {
        blockKey: "intro",
        title: "Publicaciones — párrafo de cabecera",
        defaultContent: `<p>Producción científica del grupo DIDEROT: artículos, libros, capítulos de libro, comunicaciones a congresos y otros trabajos de sus miembros.</p>`,
      },
      {
        blockKey: "portal-descripcion",
        title: "Banda del Portal de Producción Científica — texto",
        defaultContent: `<p>La producción científica completa y actualizada de los miembros del grupo, con sus indicadores bibliométricos, puede consultarse también en el Portal de Producción Científica de la Universidad de Salamanca.</p>`,
      },
      {
        blockKey: "url-portal",
        title: "Banda del Portal — URL del botón (p. ej. la ficha del grupo en el Portal; vacío = sin botón)",
        defaultContent: `<p>${SITE.links.portal}</p>`,
      },
    ],
  },
  lists: [],
  blocksEn: {
    "publicaciones:intro": `<p>Scientific output of the DIDEROT group: articles, books, book chapters, conference papers and other work by its members.</p>`,
    "publicaciones:portal-descripcion": `<p>The complete, up-to-date scientific output of the group's members, including their bibliometric indicators, is also available on the University of Salamanca Research Portal.</p>`,
  },
  listsEn: {},
};
