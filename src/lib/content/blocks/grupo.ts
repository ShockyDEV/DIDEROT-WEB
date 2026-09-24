import { SITE } from "@/lib/site";
import { ICON_FIELD, type PageContentModule } from "./types";

/**
 * Contenido editable de «El grupo» (pageSlug "grupo"): presentación (texto
 * de la portada de la web antigua), ficha del grupo (datos del Portal de
 * Producción Científica de la USAL), citas, objetivos (redactados a partir
 * de la presentación, sin añadir nada que no se deduzca de ella) y
 * afiliaciones. El equipo NO está aquí: sale de la tabla Member (panel →
 * Equipo).
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "grupo",
    label: "El grupo",
    blocks: [
      {
        blockKey: "hero-parrafo",
        title: "Cabecera — párrafo bajo el título",
        defaultContent: `<p>Un equipo interdisciplinar e interuniversitario que investiga nuevas didácticas digitales para la educación musical y las artes performativas.</p>`,
      },
      {
        blockKey: "presentacion",
        title: "Presentación — texto del grupo",
        defaultContent: `<p>El <strong>GIR DIDEROT</strong> (Didácticas Digitales de la Expresión Musical y las Artes Performativas) es un Grupo de Investigación Reconocido de la Universidad de Salamanca, adscrito al Instituto Universitario de Ciencias de la Educación (IUCE).</p>
<p>El grupo está formado por un número de investigadores de diferentes áreas de conocimiento e instituciones académicas que trabajan interdisciplinarmente en la identificación, desarrollo y aplicación de nuevas metodologías y estrategias didácticas en el ámbito de intersección entre la educación musical, el arte y la vanguardia tecnológica.</p>
<p>En las últimas décadas, la investigación en educación musical ha ampliado sus dominios metodológicos, teóricos y epistemológicos, a través de la incorporación de nuevos enfoques interdisciplinares, favoreciendo el concurso de músicos, pedagogos, humanistas digitales, musicólogos, psicólogos o documentalistas con el fin de potenciar la experiencia artística y el aprendizaje significativo en los procesos de enseñanza-aprendizaje de la música y las artes performativas.</p>
<p>En este contexto, queremos contribuir a la generación y transferencia de conocimiento en educación musical desde la perspectiva del análisis y uso crítico de los nuevos desarrollos tecnológicos que ofrece la Sociedad del Conocimiento. Todos nuestros esfuerzos e iniciativas tienen como objetivo último promover la investigación y desarrollo de nuevas didácticas digitales en educación musical como proceso integrador e inclusivo, parte integrante esencial en la innovación, el progreso y el avance de la práctica artística en el ecosistema educativo.</p>`,
      },
      {
        blockKey: "equipo-intro",
        title: "Equipo — párrafo introductorio (las personas se gestionan en Equipo)",
        defaultContent: `<p>Investigadoras e investigadores de diferentes áreas de conocimiento e instituciones académicas que trabajan de forma interdisciplinar.</p>`,
      },
      {
        blockKey: "afiliacion-intro",
        title: "Afiliación — párrafo introductorio",
        defaultContent: `<p>DIDEROT es un Grupo de Investigación Reconocido de la Universidad de Salamanca, adscrito al Instituto Universitario de Ciencias de la Educación (IUCE) y vinculado al Programa de Doctorado «Formación en la Sociedad del Conocimiento».</p>`,
      },
      {
        blockKey: "transferlab",
        title: "Afiliación — banda de DIDEROT TransferLab (vacío = ocultar)",
        defaultContent: `<p><strong>DIDEROT TransferLab</strong> es un Grupo de Transferencia del Conocimiento (GTC) del IUCE, dirigido por el coordinador del grupo, Javier Félix Merchán Sánchez-Jara, para trasladar a la sociedad los resultados de la investigación de DIDEROT.</p>`,
      },
    ],
  },

  lists: [
    {
      pageSlug: "grupo",
      blockKey: "list:datos",
      title: "Presentación (ficha «El grupo en breve»)",
      itemLabel: "dato",
      fields: [
        ICON_FIELD,
        { key: "etiqueta", label: "Etiqueta", type: "text", hint: "p. ej. Creación" },
        { key: "texto", label: "Texto", type: "text" },
      ],
      // Datos del Portal de Producción Científica de la USAL (grupo 12132).
      defaultItems: [
        {
          icon: "award",
          etiqueta: "Tipología",
          texto: "Grupo de Investigación Reconocido (GIR) de la Universidad de Salamanca",
        },
        { icon: "calendar-check", etiqueta: "Creación", texto: "20 de diciembre de 2021" },
        {
          icon: "landmark",
          etiqueta: "Instituto",
          texto: "Instituto Universitario de Ciencias de la Educación (IUCE)",
        },
        { icon: "users-round", etiqueta: "Coordinación", texto: "Javier Félix Merchán Sánchez-Jara" },
        {
          icon: "radio",
          etiqueta: "Transferencia",
          texto: "DIDEROT TransferLab, Grupo de Transferencia del Conocimiento del IUCE",
        },
      ],
    },
    {
      pageSlug: "grupo",
      blockKey: "list:citas",
      title: "Presentación (tarjetas de cita)",
      itemLabel: "cita",
      fields: [
        {
          key: "texto",
          label: "Cita",
          type: "textarea",
          hint: "con sus comillas: «…»",
        },
        { key: "autor", label: "Autoría", type: "text", hint: "p. ej. «González (2022)»" },
      ],
      defaultItems: [
        {
          texto:
            "«La integración de la tecnología tiene que ver, fundamentalmente, con los contenidos y las prácticas pedagógicas más eficaces. La tecnología son las herramientas con las que impartimos contenidos y aplicamos prácticas de forma más eficaz. Debe centrarse en el currículo y el aprendizaje. La integración no se define por la cantidad o el tipo de tecnología utilizada, sino por cómo y por qué se utiliza.»",
          autor: "Earle (2002)",
        },
        {
          texto:
            "«Hay que reflexionar en torno a la detección de necesidades pedagógicas emergentes, y en cómo dar una respuesta crítica y adaptada a las nuevas posibilidades tecnológicas, trascendiendo la mera traslación de procesos de enseñanza-aprendizaje que se producían en el mundo físico real al mundo digital»",
          autor: "González (2022)",
        },
        {
          texto:
            "«Es imprescindible no evadir el debate de cómo, por qué, y para qué se utilizan las nuevas tecnologías en el aula»",
          autor: "González (2022)",
        },
      ],
    },
    {
      pageSlug: "grupo",
      blockKey: "list:objetivos",
      title: "Objetivos del grupo",
      itemLabel: "objetivo",
      fields: [{ key: "texto", label: "Texto", type: "textarea" }],
      // Redactados a partir de la presentación del grupo (web antigua).
      defaultItems: [
        { texto: "Identificar, desarrollar y aplicar nuevas metodologías y estrategias didácticas en la intersección entre la educación musical, el arte y la vanguardia tecnológica." },
        { texto: "Contribuir a la generación y transferencia de conocimiento en educación musical desde el análisis y el uso crítico de los nuevos desarrollos tecnológicos de la Sociedad del Conocimiento." },
        { texto: "Promover la investigación y el desarrollo de nuevas didácticas digitales en educación musical como proceso integrador e inclusivo." },
        { texto: "Potenciar la experiencia artística y el aprendizaje significativo en la enseñanza y el aprendizaje de la música y las artes performativas." },
        { texto: "Favorecer el trabajo interdisciplinar de músicos, pedagogos, humanistas digitales, musicólogos, psicólogos y documentalistas." },
        { texto: "Impulsar la innovación, el progreso y el avance de la práctica artística en el ecosistema educativo." },
      ],
    },
    {
      pageSlug: "grupo",
      blockKey: "list:afiliaciones",
      title: "Afiliación (instituciones)",
      itemLabel: "institución",
      fields: [
        { key: "titulo", label: "Nombre", type: "text" },
        { key: "texto", label: "Descripción", type: "textarea" },
        { key: "enlace", label: "Web", type: "url", hint: "https://…" },
        {
          key: "logo",
          label: "Logotipo (tema claro)",
          type: "url",
          hint: "súbelo en Archivos y pega aquí la URL; vacío = icono",
        },
        {
          key: "logoOscuro",
          label: "Logotipo en blanco (tema oscuro)",
          type: "url",
          hint: "vacío = se usa el de tema claro sobre placa blanca",
        },
        ICON_FIELD,
      ],
      defaultItems: [
        {
          titulo: "Instituto Universitario de Ciencias de la Educación (IUCE)",
          texto: "Instituto al que está adscrito el grupo. Paseo de Canalejas, 169 · Edificio Solís · 37008 Salamanca.",
          enlace: SITE.links.iuce,
          logo: "/images/afiliaciones/iuce-logo.png",
          logoOscuro: "/images/afiliaciones/iuce-logo-white.webp",
          icon: "landmark",
        },
        {
          titulo: "Universidad de Salamanca",
          texto: "DIDEROT es uno de los Grupos de Investigación Reconocidos (GIR) de la Universidad.",
          enlace: SITE.links.usal,
          logo: "/images/usal-logo.png",
          logoOscuro: "/images/usal-logo-white.webp",
          icon: "building-2",
        },
        {
          titulo: "Programa de Doctorado «Formación en la Sociedad del Conocimiento»",
          texto: "Programa de doctorado de la Universidad de Salamanca vinculado al grupo.",
          enlace: SITE.links.doctorado,
          logo: "",
          logoOscuro: "",
          icon: "graduation-cap",
        },
      ],
    },
  ],

  blocksEn: {
    "grupo:hero-parrafo": `<p>An interdisciplinary, inter-university team researching new digital didactics for music education and the performing arts.</p>`,
    "grupo:presentacion": `<p>The <strong>DIDEROT GIR</strong> (Digital Didactics of Musical Expression and the Performing Arts) is a Recognised Research Group of the University of Salamanca, affiliated with the University Institute of Education Sciences (IUCE).</p>
<p>The group brings together researchers from different fields of knowledge and academic institutions who work in an interdisciplinary way to identify, develop and apply new teaching methodologies and strategies where music education, art and cutting-edge technology intersect.</p>
<p>In recent decades, research in music education has broadened its methodological, theoretical and epistemological scope by incorporating new interdisciplinary approaches, bringing together musicians, educators, digital humanists, musicologists, psychologists and information scientists in order to enhance artistic experience and meaningful learning in the teaching and learning of music and the performing arts.</p>
<p>In this context, we seek to contribute to the generation and transfer of knowledge in music education through the analysis and critical use of the new technological developments offered by the Knowledge Society. The ultimate aim of all our efforts and initiatives is to promote research into, and the development of, new digital didactics in music education as an integrating and inclusive process, an essential part of innovation, progress and the advancement of artistic practice in the educational ecosystem.</p>`,
    "grupo:equipo-intro": `<p>Researchers from different fields of knowledge and academic institutions working together across disciplines.</p>`,
    "grupo:afiliacion-intro": `<p>DIDEROT is a Recognised Research Group of the University of Salamanca, affiliated with the University Institute of Education Sciences (IUCE) and linked to the “Education in the Knowledge Society” PhD Programme.</p>`,
    "grupo:transferlab": `<p><strong>DIDEROT TransferLab</strong> is a Knowledge Transfer Group (GTC) of the IUCE, led by the group's coordinator, Javier Félix Merchán Sánchez-Jara, to bring the results of DIDEROT's research to society.</p>`,
  },

  listsEn: {
    "grupo:list:datos": [
      {
        icon: "award",
        etiqueta: "Type",
        texto: "Recognised Research Group (GIR) of the University of Salamanca",
      },
      { icon: "calendar-check", etiqueta: "Established", texto: "20 December 2021" },
      {
        icon: "landmark",
        etiqueta: "Institute",
        texto: "University Institute of Education Sciences (IUCE)",
      },
      { icon: "users-round", etiqueta: "Coordinator", texto: "Javier Félix Merchán Sánchez-Jara" },
      {
        icon: "radio",
        etiqueta: "Knowledge transfer",
        texto: "DIDEROT TransferLab, Knowledge Transfer Group of the IUCE",
      },
    ],
    "grupo:list:citas": [
      {
        // Cita original en inglés (Earle, 2002, Educational Technology 42(1)).
        texto:
          "“Integrating technology is not about technology – it is primarily about content and effective instructional practices. Technology involves the tools with which we deliver content and implement practices in better ways. Its focus must be on curriculum and learning. Integration is defined not by the amount or type of technology used, but by how and why it is used.”",
        autor: "Earle (2002)",
      },
      {
        texto:
          "“We need to reflect on how to detect emerging pedagogical needs, and on how to respond critically and adaptively to new technological possibilities, going beyond the mere transfer to the digital world of the teaching and learning processes that took place in the real physical world”",
        autor: "González (2022)",
      },
      {
        texto:
          "“It is essential not to evade the debate on how, why and for what purpose new technologies are used in the classroom”",
        autor: "González (2022)",
      },
    ],
    "grupo:list:objetivos": [
      { texto: "To identify, develop and apply new teaching methodologies and strategies at the intersection of music education, art and cutting-edge technology." },
      { texto: "To contribute to the generation and transfer of knowledge in music education through the analysis and critical use of the new technological developments of the Knowledge Society." },
      { texto: "To promote research into, and the development of, new digital didactics in music education as an integrating and inclusive process." },
      { texto: "To enhance artistic experience and meaningful learning in the teaching and learning of music and the performing arts." },
      { texto: "To foster interdisciplinary work among musicians, educators, digital humanists, musicologists, psychologists and information scientists." },
      { texto: "To drive innovation, progress and the advancement of artistic practice in the educational ecosystem." },
    ],
    "grupo:list:afiliaciones": [
      {
        titulo: "University Institute of Education Sciences (IUCE)",
        texto: "The institute to which the group is attached. Paseo de Canalejas, 169 · Solís Building · 37008 Salamanca.",
        enlace: SITE.links.iuce,
        logo: "/images/afiliaciones/iuce-logo.png",
        logoOscuro: "/images/afiliaciones/iuce-logo-white.webp",
        icon: "landmark",
      },
      {
        titulo: "University of Salamanca",
        texto: "DIDEROT is one of the University's Recognised Research Groups (GIR).",
        enlace: SITE.links.usal,
        logo: "/images/usal-logo.png",
        logoOscuro: "/images/usal-logo-white.webp",
        icon: "building-2",
      },
      {
        titulo: "PhD Programme “Education in the Knowledge Society”",
        texto: "University of Salamanca doctoral programme linked to the group.",
        enlace: SITE.links.doctorado,
        logo: "",
        logoOscuro: "",
        icon: "graduation-cap",
      },
    ],
  },
};
