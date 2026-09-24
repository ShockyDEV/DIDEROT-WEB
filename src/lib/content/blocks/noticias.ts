import type { PageContentModule } from "./types";

/**
 * Contenido editable de «Noticias» (pageSlug "noticias"). Las noticias se
 * gestionan en el panel → Noticias; aquí solo el párrafo de cabecera.
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "noticias",
    label: "Noticias",
    blocks: [
      {
        blockKey: "intro",
        title: "Noticias — párrafo de cabecera",
        defaultContent: `<p>La actualidad del grupo: investigación, proyectos, publicaciones, eventos, formación y divulgación.</p>`,
      },
    ],
  },
  lists: [],
  blocksEn: {
    "noticias:intro": `<p>The latest from the group: research, projects, publications, events, training and outreach.</p>`,
  },
  listsEn: {},
};
