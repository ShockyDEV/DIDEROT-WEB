import { ICON_FIELD, type PageContentModule } from "./types";

/**
 * Contenido editable de «Investigación» (pageSlug "investigacion").
 *
 * Líneas: los cinco ejes de la portada de la web antigua, cada uno con sus
 * líneas OFICIALES registradas en el Portal de Producción Científica de la
 * USAL (grupo 12132, sep. 2026) en el campo «sublineas» (una por renglón).
 * Las descripciones de los ejes son provisionales: la web antigua no las
 * tenía, se han redactado a partir de las propias líneas.
 *
 * Los proyectos NO están aquí: viven en la tabla Project (panel → Proyectos).
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "investigacion",
    label: "Investigación",
    blocks: [
      {
        blockKey: "intro",
        title: "Investigación — párrafo de cabecera",
        defaultContent: `<p>Investigamos la intersección entre la educación musical, el arte y la vanguardia tecnológica: nuevas metodologías y estrategias didácticas, recursos digitales y un uso crítico de la tecnología en la enseñanza y el aprendizaje de la música y las artes performativas.</p>`,
      },
      {
        blockKey: "lineas-intro",
        title: "Líneas — párrafo introductorio",
        defaultContent: `<p>Las líneas de investigación del grupo, registradas en el Portal de Producción Científica de la Universidad de Salamanca, se agrupan en cinco ejes de trabajo.</p>`,
      },
      {
        blockKey: "proyectos-descripcion",
        title: "Proyectos — subtítulo del explorador (los proyectos se gestionan en Proyectos)",
        defaultContent: `<p>Proyectos europeos, nacionales y autonómicos del grupo. Busca por título, acrónimo, investigador principal o entidad financiadora.</p>`,
      },
    ],
  },

  lists: [
    {
      pageSlug: "investigacion",
      blockKey: "list:lineas",
      title: "Líneas de investigación (tarjetas de ejes)",
      itemLabel: "eje",
      fields: [
        ICON_FIELD,
        { key: "titulo", label: "Título del eje", type: "text" },
        {
          key: "descripcion",
          label: "Descripción breve",
          type: "textarea",
          hint: "una o dos frases; vacío = sin descripción",
        },
        {
          key: "sublineas",
          label: "Líneas oficiales del eje",
          type: "textarea",
          hint: "una línea por renglón, tal como figuran en el Portal de Producción Científica",
        },
      ],
      defaultItems: [
        {
          icon: "audio-waveform",
          titulo: "Expresión musical y tecnología",
          descripcion:
            "La didáctica de la expresión musical mediada por tecnologías digitales, de las aplicaciones educativas a la robótica y los videojuegos.",
          sublineas:
            "Didáctica de la Expresión Musical en la Sociedad del Conocimiento\nTecnologías Digitales en Educación Musical\nRobótica y Videojuegos en Educación Musical",
        },
        {
          icon: "code-2",
          titulo: "Music Encoding Initiative y Educación",
          descripcion:
            "Usos educativos y pedagogía de la Music Encoding Initiative (MEI), el estándar abierto de codificación de partituras.",
          sublineas:
            "Music Encoding Initiative y Educación Musical\nPedagogía de la Music Encoding Initiative",
        },
        {
          icon: "headphones",
          titulo: "Recursos digitales para educación musical",
          descripcion:
            "Recursos digitales e información musical al servicio de la enseñanza y el aprendizaje de la música.",
          sublineas: "Información Musical en Entornos Educativos",
        },
        {
          icon: "music-4",
          titulo: "Lectoescritura musical en la era digital",
          descripcion:
            "La enseñanza y el aprendizaje de la lectura y la escritura musical en entornos digitales.",
          sublineas: "Lectoescritura Digital en Educación Musical",
        },
        {
          icon: "drama",
          titulo: "Arte, Tecnología y Educación",
          descripcion:
            "La intersección entre el arte y las nuevas tecnologías, y su lugar en la educación artística.",
          sublineas:
            "Nuevas Tecnologías en Educación Artística\nIntersección del Arte y las Nuevas Tecnologías y su Docencia",
        },
      ],
    },
  ],

  blocksEn: {
    "investigacion:intro": `<p>We research where music education, art and cutting-edge technology meet: new teaching methodologies and strategies, digital resources and a critical use of technology in the teaching and learning of music and the performing arts.</p>`,
    "investigacion:lineas-intro": `<p>The group's research lines, registered on the University of Salamanca Research Portal, are organised into five main areas of work.</p>`,
    "investigacion:proyectos-descripcion": `<p>The group's European, national and regional projects. Search by title, acronym, principal investigator or funding body.</p>`,
  },

  listsEn: {
    "investigacion:list:lineas": [
      {
        icon: "audio-waveform",
        titulo: "Musical expression and technology",
        descripcion:
          "Teaching musical expression through digital technologies, from educational applications to robotics and video games.",
        sublineas:
          "Didactics of Musical Expression in the Knowledge Society\nDigital Technologies in Music Education\nRobotics and Video Games in Music Education",
      },
      {
        icon: "code-2",
        titulo: "Music Encoding Initiative and Education",
        descripcion:
          "Educational uses and pedagogy of the Music Encoding Initiative (MEI), the open standard for encoding music notation.",
        sublineas:
          "Music Encoding Initiative and Music Education\nPedagogy of the Music Encoding Initiative",
      },
      {
        icon: "headphones",
        titulo: "Digital resources for music education",
        descripcion:
          "Digital resources and music information for teaching and learning music.",
        sublineas: "Music Information in Educational Settings",
      },
      {
        icon: "music-4",
        titulo: "Music literacy in the digital age",
        descripcion:
          "Teaching and learning to read and write music in digital environments.",
        sublineas: "Digital Music Literacy in Music Education",
      },
      {
        icon: "drama",
        titulo: "Art, Technology and Education",
        descripcion:
          "The intersection of art and new technologies, and its place in arts education.",
        sublineas:
          "New Technologies in Arts Education\nThe Intersection of Art and New Technologies and its Teaching",
      },
    ],
  },
};
