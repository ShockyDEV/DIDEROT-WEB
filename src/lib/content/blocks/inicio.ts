import { ICON_FIELD, type PageContentModule } from "./types";

/**
 * Contenido editable de «Inicio — Portada» (pageSlug "inicio").
 *
 * Los textos salen de la portada de la web antigua (diderot.usal.es, abril
 * de 2024) y de los datos del Portal de Producción Científica de la USAL.
 * Las cifras de la banda «DIDEROT en cifras» NO son editables: se calculan
 * en vivo desde la BD (equipo, proyectos, publicaciones, eventos).
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "inicio",
    label: "Inicio — Portada",
    blocks: [
      {
        blockKey: "hero-eyebrow",
        title: "Portada — antetítulo (línea ámbar pequeña)",
        defaultContent: `<p>Grupo de Investigación Reconocido · USAL</p>`,
      },
      {
        blockKey: "hero-titulo",
        title: "Portada — título principal",
        defaultContent: `<p>Didácticas digitales de la expresión musical y las artes performativas</p>`,
      },
      {
        blockKey: "hero-parrafo",
        title: "Portada — párrafo de presentación",
        defaultContent: `<p>Un equipo interdisciplinar de investigadores de distintas áreas de conocimiento e instituciones que identifica, desarrolla y aplica nuevas metodologías y estrategias didácticas en la intersección entre la educación musical, el arte y la vanguardia tecnológica.</p>`,
      },
      {
        blockKey: "hero-boton-principal",
        title: "Portada — texto del botón principal (lleva a «El grupo»)",
        defaultContent: `<p>Conoce el grupo</p>`,
      },
      {
        blockKey: "hero-boton-secundario",
        title: "Portada — texto del botón secundario (lleva a «Publicaciones»)",
        defaultContent: `<p>Publicaciones</p>`,
      },
      {
        blockKey: "hero-foto-etiqueta",
        title: "Portada — rótulo sobre la foto (vacío = sin rótulo)",
        defaultContent: `<p>Proyecto DIDEROT · Aula performativa</p>`,
      },
      {
        blockKey: "cifras-eyebrow",
        title: "Cifras — antetítulo de la banda",
        defaultContent: `<p>Actividad del grupo</p>`,
      },
      {
        blockKey: "cifras-titulo",
        title: "Cifras — título de la banda",
        defaultContent: `<p>DIDEROT en cifras</p>`,
      },
      {
        blockKey: "cifras-parrafo",
        title: "Cifras — párrafo (las cifras se calculan solas con los datos del panel)",
        defaultContent: `<p>El equipo, los proyectos y la producción científica del grupo, con datos siempre al día.</p>`,
      },
      {
        blockKey: "cita",
        title: "Banda de cita — texto de la cita (vacío = ocultar la banda)",
        defaultContent: `<p>«El desafío debe centrarse en repensar, tanto las estructuras, canales, flujos y objetos informativos, como las tradiciones pedagógicas dentro de las instituciones educativas, formales e informales, a la luz de las nuevas formas de aproximación al conocimiento que promueve la vanguardia tecnológica»</p>`,
      },
      {
        blockKey: "cita-autor",
        title: "Banda de cita — autoría (p. ej. «Merchán (2022)»)",
        defaultContent: `<p>Merchán (2022)</p>`,
      },
    ],
  },

  lists: [
    {
      pageSlug: "inicio",
      blockKey: "list:hitos-hero",
      title: "Portada — hitos bajo el titular",
      itemLabel: "hito",
      fields: [ICON_FIELD, { key: "texto", label: "Texto", type: "text" }],
      defaultItems: [
        { icon: "award", texto: "Grupo de Investigación Reconocido desde 2021" },
        { icon: "landmark", texto: "Adscrito al IUCE" },
        { icon: "network", texto: "Interdisciplinar e interuniversitario" },
      ],
    },
    {
      pageSlug: "inicio",
      blockKey: "list:accesos-rapidos",
      title: "Portada — tarjetas de acceso rápido",
      itemLabel: "tarjeta",
      fields: [
        ICON_FIELD,
        { key: "titulo", label: "Título", type: "text" },
        { key: "descripcion", label: "Descripción", type: "textarea" },
        {
          key: "enlace",
          label: "Enlace",
          type: "url",
          hint: "ruta interna (/publicaciones, /investigacion#proyectos) o URL externa (https://…)",
        },
        { key: "destacado", label: "Icono en ámbar (acento)", type: "check" },
      ],
      defaultItems: [
        {
          icon: "audio-lines",
          titulo: "Investigación",
          descripcion: "Líneas de investigación del grupo y sus ejes de trabajo",
          enlace: "/investigacion",
          destacado: false,
        },
        {
          icon: "file-music",
          titulo: "Publicaciones",
          descripcion: "Artículos, libros, capítulos y comunicaciones del grupo",
          enlace: "/publicaciones",
          destacado: true,
        },
        {
          icon: "piano",
          titulo: "Proyectos",
          descripcion: "Proyectos de investigación e innovación, vigentes y finalizados",
          enlace: "/investigacion#proyectos",
          destacado: false,
        },
        {
          icon: "radio",
          titulo: "Transferencia",
          descripcion: "DIDEROT TransferLab y transferencia de conocimiento",
          enlace: "/transferencia",
          destacado: false,
        },
      ],
    },
  ],

  blocksEn: {
    "inicio:hero-eyebrow": `<p>Recognised Research Group · USAL</p>`,
    "inicio:hero-titulo": `<p>Digital didactics of musical expression and the performing arts</p>`,
    "inicio:hero-parrafo": `<p>An interdisciplinary team of researchers from different fields of knowledge and institutions who identify, develop and apply new teaching methodologies and strategies where music education, art and cutting-edge technology meet.</p>`,
    "inicio:hero-boton-principal": `<p>Meet the group</p>`,
    "inicio:hero-boton-secundario": `<p>Publications</p>`,
    "inicio:hero-foto-etiqueta": `<p>DIDEROT Project · Performative classroom</p>`,
    "inicio:cifras-eyebrow": `<p>Group activity</p>`,
    "inicio:cifras-titulo": `<p>DIDEROT in figures</p>`,
    "inicio:cifras-parrafo": `<p>The group's team, projects and scientific output, always up to date.</p>`,
    "inicio:cita": `<p>“The challenge must focus on rethinking both the structures, channels, flows and objects of information and the pedagogical traditions within educational institutions, formal and informal, in the light of the new ways of approaching knowledge fostered by the technological avant-garde”</p>`,
  },

  listsEn: {
    "inicio:list:hitos-hero": [
      { icon: "award", texto: "Recognised Research Group since 2021" },
      { icon: "landmark", texto: "Affiliated with the IUCE" },
      { icon: "network", texto: "Interdisciplinary and inter-university" },
    ],
    "inicio:list:accesos-rapidos": [
      {
        icon: "audio-lines",
        titulo: "Research",
        descripcion: "The group's research lines and main areas of work",
        enlace: "/investigacion",
        destacado: false,
      },
      {
        icon: "file-music",
        titulo: "Publications",
        descripcion: "Articles, books, chapters and conference papers by the group",
        enlace: "/publicaciones",
        destacado: true,
      },
      {
        icon: "piano",
        titulo: "Projects",
        descripcion: "Research and innovation projects, ongoing and completed",
        enlace: "/investigacion#proyectos",
        destacado: false,
      },
      {
        icon: "radio",
        titulo: "Knowledge transfer",
        descripcion: "DIDEROT TransferLab and knowledge transfer",
        enlace: "/transferencia",
        destacado: false,
      },
    ],
  },
};
