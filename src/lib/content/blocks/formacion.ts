import { SITE } from "@/lib/site";
import { ICON_FIELD, type PageContentModule } from "./types";

/**
 * Contenido editable de «Formación» (pageSlug "formacion"): misma estructura
 * que la página de Formación del IUCE (cabecera en dos columnas con tarjetas
 * de datos y secciones de tarjetas con borde superior de color).
 *
 * Datos reales: tesis dirigidas y datos del grupo (Portal de Producción
 * Científica de la USAL, grupo 12132), programas de doctorado y Seminario
 * Internacional 2026. Los textos de TFG/TFM, profesorado y movilidad son
 * PROVISIONALES (redacción genérica y prudente, editable desde el panel).
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "formacion",
    label: "Formación",
    blocks: [
      {
        blockKey: "hero-eyebrow",
        title: "Cabecera — antetítulo",
        defaultContent: `<p>Formación investigadora y docente</p>`,
      },
      {
        blockKey: "hero-titulo",
        title: "Cabecera — título",
        defaultContent: `<p>Formación</p>`,
      },
      {
        blockKey: "intro",
        title: "Cabecera — párrafo de presentación",
        defaultContent: `<p>DIDEROT forma a investigadoras, investigadores y docentes en las didácticas digitales de la música y las artes performativas: dirección de tesis doctorales y de trabajos fin de grado y máster, seminarios especializados, formación del profesorado y estancias de investigación.</p>`,
      },
      {
        blockKey: "url-doctorado",
        title: "Cabecera — URL del botón «Programa de Doctorado» (vacío = ocultar)",
        defaultContent: `<p>${SITE.links.doctorado}</p>`,
      },
      {
        blockKey: "doctorado-intro",
        title: "Doctorado — texto de presentación",
        defaultContent: `<p>Miembros de DIDEROT dirigen tesis doctorales sobre educación musical, artes performativas y tecnología. Si te interesa hacer tu tesis con el grupo, escríbenos y te orientamos sobre las líneas de trabajo, la dirección y el acceso a los programas.</p>`,
      },
      {
        blockKey: "seminario-edicion",
        title: "Seminario Internacional — antetítulo (edición y año)",
        defaultContent: `<p>Seminario Internacional · 1.ª edición · 2026</p>`,
      },
      {
        blockKey: "seminario-titulo",
        title: "Seminario Internacional — título",
        defaultContent: `<p>Didácticas digitales de la expresión musical y las artes performativas</p>`,
      },
      {
        blockKey: "seminario-subtitulo",
        title: "Seminario Internacional — subtítulo (vacío = ocultar)",
        defaultContent: `<p>Tecnologías inteligentes y creatividad en entornos virtuales</p>`,
      },
      {
        blockKey: "seminario-intro",
        title: "Seminario Internacional — descripción",
        defaultContent: `<p>Organizado por DIDEROT, el Instituto Universitario de Ciencias de la Educación (IUCE) y el Centro de Formación Permanente de la Universidad de Salamanca, el seminario reúne investigación y docencia en torno a las tecnologías inteligentes y la creatividad en la educación musical y las artes performativas. Su primera edición se celebró en 2026, en tres jornadas en el Edificio Solís.</p>`,
      },
      {
        blockKey: "seminario-direccion",
        title: "Seminario Internacional — dirección académica (vacío = ocultar)",
        defaultContent: `<p>Javier F. Merchán Sánchez-Jara (IUCE)</p>`,
      },
      {
        blockKey: "movilidad-intro",
        title: "Estancias y movilidad — texto de presentación",
        defaultContent: `<p>La participación de DIDEROT en proyectos internacionales abre oportunidades de estancias de investigación y de movilidad, tanto para quienes visitan el grupo como para sus miembros.</p>`,
      },
      {
        blockKey: "cta",
        title: "Formación — llamada final de contacto",
        defaultContent: `<p><strong>¿Quieres hacer tu tesis, TFG o TFM con DIDEROT?</strong></p>
<p>Escríbenos y te orientamos sobre las líneas de trabajo y la dirección.</p>`,
      },
    ],
  },
  lists: [
    {
      pageSlug: "formacion",
      blockKey: "list:datos",
      title: "Cabecera (tarjetas de datos)",
      itemLabel: "dato",
      fields: [
        { key: "cifra", label: "Cifra grande", type: "text" },
        { key: "texto", label: "Texto", type: "textarea" },
      ],
      // Datos del Portal de Producción Científica de la USAL (grupo 12132).
      defaultItems: [
        {
          cifra: "3",
          texto:
            "tesis doctorales defendidas con dirección de miembros del grupo (2021–2024)",
        },
        {
          cifra: "2026",
          texto:
            "primera edición del Seminario Internacional, en tres jornadas",
        },
        {
          cifra: "2",
          texto:
            "programas de doctorado en los que participa la coordinación del grupo",
        },
      ],
    },
    {
      pageSlug: "formacion",
      blockKey: "list:programas",
      title: "Doctorado (programas)",
      itemLabel: "programa",
      fields: [
        { key: "titulo", label: "Nombre del programa", type: "text" },
        { key: "texto", label: "Texto", type: "textarea" },
        {
          key: "enlace",
          label: "Web del programa",
          type: "url",
          hint: "vacío = sin enlace",
        },
        { key: "acento", label: "Borde superior ámbar", type: "check" },
      ],
      defaultItems: [
        {
          titulo: "Formación en la Sociedad del Conocimiento",
          texto:
            "Programa de Doctorado de la Universidad de Salamanca configurado en el seno del IUCE, en el que miembros del grupo dirigen tesis sobre educación musical, artes y tecnología.",
          enlace: SITE.links.doctorado,
          acento: false,
        },
        {
          titulo: "Tradición literaria, cultura escrita y humanidades digitales",
          texto:
            "Programa de doctorado en el que participa también la coordinación del grupo.",
          enlace: "",
          acento: true,
        },
      ],
    },
    {
      pageSlug: "formacion",
      blockKey: "list:ambitos",
      title: "Doctorado (ámbitos para tesis y trabajos)",
      itemLabel: "ámbito",
      fields: [ICON_FIELD, { key: "texto", label: "Texto", type: "text" }],
      defaultItems: [
        { icon: "music", texto: "Didácticas digitales de la expresión musical" },
        {
          icon: "brain-circuit",
          texto: "Tecnologías inteligentes e IA en educación musical",
        },
        {
          icon: "file-music",
          texto: "Edición y codificación digital de la música (MEI, OMR)",
        },
        {
          icon: "landmark",
          texto: "Patrimonio musical y música de tradición oral",
        },
        {
          icon: "drama",
          texto: "Artes performativas y educación artística inclusiva",
        },
        {
          icon: "gamepad-2",
          texto: "Videojuegos, bandas sonoras y nuevos medios",
        },
      ],
    },
    {
      pageSlug: "formacion",
      blockKey: "list:tesis",
      title: "Tesis doctorales dirigidas",
      itemLabel: "tesis",
      fields: [
        { key: "anio", label: "Año de defensa", type: "text" },
        { key: "titulo", label: "Título", type: "textarea" },
        { key: "autoria", label: "Doctorando/a", type: "text" },
        { key: "direccion", label: "Dirección", type: "text" },
        {
          key: "enlace",
          label: "Enlace (repositorio, DOI…)",
          type: "url",
          hint: "vacío = sin enlace",
        },
      ],
      // Portal de Producción Científica de la USAL (grupo 12132).
      defaultItems: [
        {
          anio: "2024",
          titulo:
            "Didáctica de la expresión musical y música popular de tradición oral: Tecnologías digitales en las aulas de secundaria de Castilla y León",
          autoria: "Sara González Gutiérrez",
          direccion:
            "Matilde María Olarte Martínez, Javier Félix Merchán Sánchez-Jara y María Navarro Cáceres",
          enlace: "",
        },
        {
          anio: "2023",
          titulo:
            "El libro y el lector: estudio de la percepción de la lectura digital en el ámbito académico",
          autoria: "Ludovica Mastrobattista",
          direccion:
            "José Antonio Cordón García y Javier Félix Merchán Sánchez-Jara",
          enlace: "",
        },
        {
          anio: "2021",
          titulo:
            "Historia de la capilla de Santa María La Mayor de Ledesma y su música a través de los villancicos de Pablo Santander (1764-1810). Aplicación en el aula de la recuperación del patrimonio musical hispánico mediante metodologías activas educativas",
          autoria: "Marta Iglesias Sánchez",
          direccion: "Judith Helvia García Martín y Elena Berrón Ruiz",
          enlace: "",
        },
      ],
    },
    {
      pageSlug: "formacion",
      blockKey: "list:jornadas",
      title: "Seminario Internacional (jornadas)",
      itemLabel: "jornada",
      fields: [
        { key: "codigo", label: "Número", type: "text", hint: "p. ej. I, II, III" },
        { key: "titulo", label: "Título", type: "textarea" },
        { key: "fecha", label: "Fecha y hora", type: "text" },
        { key: "lugar", label: "Lugar", type: "text" },
      ],
      defaultItems: [
        {
          codigo: "I",
          titulo:
            "Encuentro de investigación predoctoral. Educación musical y artes performativas",
          fecha: "30 de abril de 2026 · 16:00 h",
          lugar: "Aula 12A, Edificio Solís",
        },
        {
          codigo: "II",
          titulo:
            "Mesa de comunicaciones. Investigación y proyectos en educación musical y artes performativas",
          fecha: "4 de junio de 2026 · 16:00 h",
          lugar: "Aula 17A (IUCE), Edificio Solís",
        },
        {
          codigo: "III",
          titulo:
            "Mesa de comunicaciones. Intersecciones entre arte, educación y tecnología",
          fecha: "10 de junio de 2026 · 16:30 h",
          lugar: "Aula de Usos Múltiples (IUCE), Edificio Solís",
        },
      ],
    },
    {
      pageSlug: "formacion",
      blockKey: "list:actividades",
      title: "Profesorado, TFG y TFM (tarjetas)",
      itemLabel: "tarjeta",
      fields: [
        ICON_FIELD,
        { key: "titulo", label: "Título", type: "text" },
        { key: "texto", label: "Texto", type: "textarea" },
        { key: "cta", label: "Texto del enlace", type: "text" },
        {
          key: "enlace",
          label: "Enlace",
          type: "url",
          hint: "URL o ruta interna como /contacto; vacío = sin enlace",
        },
        { key: "acento", label: "Borde superior ámbar", type: "check" },
      ],
      defaultItems: [
        {
          icon: "presentation",
          titulo: "Formación del profesorado",
          texto:
            "Cursos, talleres y seminarios para docentes de música y artes sobre recursos, metodologías y tecnologías digitales.",
          cta: "Proponer una actividad →",
          enlace: "/contacto?asunto=colaboracion",
          acento: false,
        },
        {
          icon: "graduation-cap",
          titulo: "Trabajos Fin de Grado",
          texto:
            "Dirección de TFG sobre educación musical, artes performativas y tecnología.",
          cta: "Escríbenos →",
          enlace: "/contacto?asunto=doctorado",
          acento: false,
        },
        {
          icon: "book-open",
          titulo: "Trabajos Fin de Máster",
          texto:
            "Dirección de TFM y orientación a quienes quieren iniciarse en la investigación en educación musical y artes.",
          cta: "Escríbenos →",
          enlace: "/contacto?asunto=doctorado",
          acento: true,
        },
      ],
    },
    {
      pageSlug: "formacion",
      blockKey: "list:movilidad",
      title: "Estancias y movilidad (tarjetas)",
      itemLabel: "tarjeta",
      fields: [
        ICON_FIELD,
        { key: "titulo", label: "Título", type: "text" },
        { key: "texto", label: "Texto", type: "textarea" },
      ],
      defaultItems: [
        {
          icon: "globe",
          titulo: "Estancias de investigación",
          texto:
            "Acogida de investigadoras e investigadores visitantes y estancias de miembros del grupo en otros centros, en el marco de sus proyectos.",
        },
        {
          icon: "network",
          titulo: "Proyectos internacionales",
          texto:
            "Proyectos como EA-DIGIFOLK (Horizonte Europa, MSCA Staff Exchanges) promueven el intercambio de personal investigador entre instituciones europeas e iberoamericanas.",
        },
        {
          icon: "earth",
          titulo: "Mención Internacional",
          texto:
            "Orientación sobre las estancias en centros extranjeros que exige la Mención Internacional en el título de doctor.",
        },
      ],
    },
  ],
  blocksEn: {
    "formacion:hero-eyebrow": `<p>Research and teacher training</p>`,
    "formacion:hero-titulo": `<p>Training</p>`,
    "formacion:intro": `<p>DIDEROT trains researchers and teachers in the digital didactics of music and the performing arts: supervision of doctoral theses and of bachelor's and master's theses, specialised seminars, teacher training and research stays.</p>`,
    "formacion:doctorado-intro": `<p>DIDEROT members supervise doctoral theses on music education, the performing arts and technology. If you would like to do your thesis with the group, write to us and we will advise you on research lines, supervision and admission to the programmes.</p>`,
    "formacion:seminario-edicion": `<p>International Seminar · 1st edition · 2026</p>`,
    "formacion:seminario-titulo": `<p>Digital didactics of musical expression and the performing arts</p>`,
    "formacion:seminario-subtitulo": `<p>Intelligent technologies and creativity in virtual environments</p>`,
    "formacion:seminario-intro": `<p>Organised by DIDEROT, the University Institute of Education Sciences (IUCE) and the Lifelong Learning Centre of the University of Salamanca, the seminar brings together research and teaching on intelligent technologies and creativity in music education and the performing arts. Its first edition was held in 2026, over three sessions in the Solís Building.</p>`,
    "formacion:movilidad-intro": `<p>DIDEROT's participation in international projects opens up opportunities for research stays and mobility, both for those visiting the group and for its members.</p>`,
    "formacion:cta": `<p><strong>Would you like to do your PhD, bachelor's or master's thesis with DIDEROT?</strong></p>
<p>Write to us and we will advise you on research lines and supervision.</p>`,
  },
  listsEn: {
    "formacion:list:datos": [
      {
        cifra: "3",
        texto:
          "doctoral theses defended under the supervision of group members (2021–2024)",
      },
      {
        cifra: "2026",
        texto: "first edition of the International Seminar, over three sessions",
      },
      {
        cifra: "2",
        texto: "doctoral programmes in which the group's coordinator takes part",
      },
    ],
    "formacion:list:programas": [
      {
        titulo: "Education in the Knowledge Society",
        texto:
          "Doctoral programme of the University of Salamanca, shaped within the IUCE, in which group members supervise theses on music education, the arts and technology.",
        enlace: SITE.links.doctorado,
        acento: false,
      },
      {
        titulo: "Tradición literaria, cultura escrita y humanidades digitales",
        texto:
          "Doctoral programme (Literary tradition, written culture and digital humanities) in which the group's coordinator also takes part.",
        enlace: "",
        acento: true,
      },
    ],
    "formacion:list:ambitos": [
      { icon: "music", texto: "Digital didactics of musical expression" },
      {
        icon: "brain-circuit",
        texto: "Intelligent technologies and AI in music education",
      },
      {
        icon: "file-music",
        texto: "Digital music editing and encoding (MEI, OMR)",
      },
      { icon: "landmark", texto: "Musical heritage and oral-tradition music" },
      {
        icon: "drama",
        texto: "Performing arts and inclusive arts education",
      },
      {
        icon: "gamepad-2",
        texto: "Video games, soundtracks and new media",
      },
    ],
    "formacion:list:tesis": [
      {
        anio: "2024",
        titulo:
          "Didáctica de la expresión musical y música popular de tradición oral: Tecnologías digitales en las aulas de secundaria de Castilla y León",
        autoria: "Sara González Gutiérrez",
        direccion:
          "Matilde María Olarte Martínez, Javier Félix Merchán Sánchez-Jara and María Navarro Cáceres",
        enlace: "",
      },
      {
        anio: "2023",
        titulo:
          "El libro y el lector: estudio de la percepción de la lectura digital en el ámbito académico",
        autoria: "Ludovica Mastrobattista",
        direccion:
          "José Antonio Cordón García and Javier Félix Merchán Sánchez-Jara",
        enlace: "",
      },
      {
        anio: "2021",
        titulo:
          "Historia de la capilla de Santa María La Mayor de Ledesma y su música a través de los villancicos de Pablo Santander (1764-1810). Aplicación en el aula de la recuperación del patrimonio musical hispánico mediante metodologías activas educativas",
        autoria: "Marta Iglesias Sánchez",
        direccion: "Judith Helvia García Martín and Elena Berrón Ruiz",
        enlace: "",
      },
    ],
    "formacion:list:jornadas": [
      {
        codigo: "I",
        titulo:
          "Predoctoral research meeting. Music education and the performing arts",
        fecha: "30 April 2026 · 16:00",
        lugar: "Room 12A, Solís Building",
      },
      {
        codigo: "II",
        titulo:
          "Paper session. Research and projects in music education and the performing arts",
        fecha: "4 June 2026 · 16:00",
        lugar: "Room 17A (IUCE), Solís Building",
      },
      {
        codigo: "III",
        titulo:
          "Paper session. Intersections between art, education and technology",
        fecha: "10 June 2026 · 16:30",
        lugar: "Multipurpose Room (IUCE), Solís Building",
      },
    ],
    "formacion:list:actividades": [
      {
        icon: "presentation",
        titulo: "Teacher training",
        texto:
          "Courses, workshops and seminars for music and arts teachers on digital resources, methods and technologies.",
        cta: "Propose an activity →",
        enlace: "/contacto?asunto=colaboracion",
        acento: false,
      },
      {
        icon: "graduation-cap",
        titulo: "Bachelor's theses (TFG)",
        texto:
          "Supervision of bachelor's theses on music education, the performing arts and technology.",
        cta: "Write to us →",
        enlace: "/contacto?asunto=doctorado",
        acento: false,
      },
      {
        icon: "book-open",
        titulo: "Master's theses (TFM)",
        texto:
          "Supervision of master's theses and guidance for those starting out in research on music and arts education.",
        cta: "Write to us →",
        enlace: "/contacto?asunto=doctorado",
        acento: true,
      },
    ],
    "formacion:list:movilidad": [
      {
        icon: "globe",
        titulo: "Research stays",
        texto:
          "Hosting visiting researchers and stays by group members at other centres, within the framework of their projects.",
      },
      {
        icon: "network",
        titulo: "International projects",
        texto:
          "Projects such as EA-DIGIFOLK (Horizon Europe, MSCA Staff Exchanges) promote staff exchanges between European and Ibero-American institutions.",
      },
      {
        icon: "earth",
        titulo: "International Mention",
        texto:
          "Guidance on the stays at foreign institutions required for the International Mention in the doctoral degree.",
      },
    ],
  },
};
