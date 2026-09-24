import { SITE } from "@/lib/site";
import { ICON_FIELD, type PageContentModule } from "./types";

/**
 * Contenido editable de «Transferencia» (pageSlug "transferencia"): misma
 * estructura que la página de Transferencia del IUCE, sin las gráficas.
 *
 * Datos reales: DIDEROT TransferLab (GTC del IUCE dirigido por J. F. Merchán
 * Sánchez-Jara) y los proyectos Co-POEM, EA-DIGIFOLK y FolkAI. El resto de
 * textos (intro, misión, líneas) es PROVISIONAL: redacción prudente para que
 * el grupo la ajuste desde el panel.
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "transferencia",
    label: "Transferencia de conocimiento",
    blocks: [
      {
        blockKey: "intro",
        title: "Transferencia — párrafo de cabecera",
        defaultContent: `<p>Transferir el conocimiento a la sociedad forma parte del trabajo de DIDEROT: que la investigación sobre didácticas digitales de la música y las artes performativas llegue a las aulas, a los centros educativos, a las instituciones culturales y a las empresas del sector.</p>`,
      },
      {
        blockKey: "mision",
        title: "Transferencia — texto de misión (banda destacada)",
        defaultContent: `<p>El grupo pone su investigación (didácticas digitales, tecnologías inteligentes aplicadas a la música, edición y codificación digital del patrimonio musical) al servicio de docentes, centros e instituciones, mediante proyectos colaborativos, formación especializada, recursos digitales y actividades de divulgación.</p>`,
      },
      {
        blockKey: "transferlab",
        title: "DIDEROT TransferLab — descripción",
        defaultContent: `<p><strong>DIDEROT TransferLab</strong> es el Grupo de Transferencia del Conocimiento (GTC) del Instituto Universitario de Ciencias de la Educación (IUCE) vinculado a DIDEROT. Canaliza la transferencia del grupo hacia el sistema educativo, el sector cultural y el tejido empresarial: asesoramiento, formación, desarrollo de recursos y colaboración en proyectos.</p>`,
      },
      {
        blockKey: "transferlab-direccion",
        title: "DIDEROT TransferLab — dirección (nombre; vacío = ocultar)",
        defaultContent: `<p>${SITE.lead}</p>`,
      },
      {
        blockKey: "url-otc",
        title: "Transferencia — URL de la Oficina de Transferencia de la USAL (vacío = ocultar la tarjeta)",
        defaultContent: `<p>https://transferencia.usal.es</p>`,
      },
      {
        blockKey: "otc-descripcion",
        title: "Transferencia — texto de la tarjeta de la OTC USAL",
        defaultContent: `<p>La Oficina de Transferencia de Conocimiento de la Universidad de Salamanca canaliza los contratos del artículo 60, las patentes y la colaboración con empresas e instituciones.</p>`,
      },
      {
        blockKey: "cta",
        title: "Transferencia — llamada final (colabora con DIDEROT)",
        defaultContent: `<p><strong>¿Tu centro, institución o empresa quiere colaborar con DIDEROT?</strong></p>
<p>Escríbenos y estudiamos juntos cómo puede ayudarte la investigación del grupo: formación, recursos digitales, patrimonio musical o divulgación.</p>`,
      },
    ],
  },
  lists: [
    {
      pageSlug: "transferencia",
      blockKey: "list:lineas",
      title: "Líneas y servicios de transferencia (tarjetas)",
      itemLabel: "línea",
      fields: [
        ICON_FIELD,
        { key: "titulo", label: "Título", type: "text" },
        { key: "texto", label: "Texto", type: "textarea" },
      ],
      defaultItems: [
        {
          icon: "graduation-cap",
          titulo: "Asesoramiento y formación del profesorado",
          texto:
            "Formación y asesoramiento a docentes y centros en didácticas digitales de la música y las artes performativas.",
        },
        {
          icon: "laptop",
          titulo: "Recursos y plataformas digitales",
          texto:
            "Diseño, desarrollo y evaluación de recursos, aplicaciones y plataformas digitales para la educación musical.",
        },
        {
          icon: "file-music",
          titulo: "Edición y codificación digital de la música",
          texto:
            "Edición digital de partituras y codificación en estándares abiertos como MEI, al servicio de la preservación y la difusión del patrimonio musical.",
        },
        {
          icon: "megaphone",
          titulo: "Divulgación y comunicación científica",
          texto:
            "Seminarios, jornadas, publicaciones y actividades que acercan la investigación en educación musical y artes a la sociedad.",
        },
      ],
    },
    {
      pageSlug: "transferencia",
      blockKey: "list:proyectos",
      title: "Plataformas y proyectos con impacto",
      itemLabel: "proyecto",
      fields: [
        { key: "acronimo", label: "Acrónimo", type: "text" },
        { key: "titulo", label: "Título del proyecto", type: "textarea" },
        {
          key: "financiacion",
          label: "Programa y financiación",
          type: "text",
          hint: "p. ej. Erasmus+ KA201 · Comisión Europea",
        },
        { key: "periodo", label: "Periodo", type: "text", hint: "p. ej. 2019–2022" },
        {
          key: "ip",
          label: "Investigación principal",
          type: "text",
          hint: "vacío = no se muestra",
        },
        { key: "texto", label: "Resumen breve", type: "textarea" },
        {
          key: "enlace",
          label: "Web del proyecto",
          type: "url",
          hint: "vacío = tarjeta sin enlace",
        },
      ],
      defaultItems: [
        {
          acronimo: "EA-DIGIFOLK",
          titulo:
            "An European and Ibero-American approach for the digital collection, analysis and dissemination of folk music",
          financiacion: "Horizonte Europa · MSCA Staff Exchanges (Unión Europea)",
          periodo: "2023–2026",
          ip: "Javier Félix Merchán Sánchez-Jara y María Navarro Cáceres",
          texto:
            "Recopilación, análisis y difusión digital de la música folk desde un enfoque europeo e iberoamericano, con intercambio de personal investigador entre instituciones.",
          enlace: "https://digifolk.usal.es/#/",
        },
        {
          acronimo: "Co-POEM",
          titulo:
            "Platform for the Collaborative Generation of European Popular Music",
          financiacion: "Erasmus+ KA201 · Comisión Europea",
          periodo: "2019–2022",
          ip: "María Navarro Cáceres",
          texto:
            "Plataforma para la creación colaborativa de música popular europea, desarrollada en una asociación estratégica Erasmus+ de educación escolar.",
          enlace: "",
        },
        {
          acronimo: "FolkAI",
          titulo:
            "Preservación y Difusión de la Tradición Musical Europea a través de la Inteligencia Artificial",
          financiacion: "Ministerio de Ciencia e Innovación (MICINN)",
          periodo: "2020–2023",
          ip: "",
          texto:
            "Inteligencia artificial al servicio de la preservación y la difusión de la tradición musical europea.",
          enlace: "",
        },
      ],
    },
    {
      pageSlug: "transferencia",
      blockKey: "list:divulgacion",
      title: "Divulgación (tarjetas)",
      itemLabel: "tarjeta",
      fields: [
        ICON_FIELD,
        { key: "titulo", label: "Título", type: "text" },
        { key: "texto", label: "Texto", type: "textarea" },
        {
          key: "enlace",
          label: "Enlace",
          type: "url",
          hint: "URL o ruta interna como /eventos; vacío = sin enlace",
        },
      ],
      defaultItems: [
        {
          icon: "music-4",
          titulo: "Música Sincrónica",
          texto: "Blog sobre músicas populares en educación musical.",
          enlace: "",
        },
        {
          icon: "presentation",
          titulo: "Seminarios y jornadas",
          texto:
            "Encuentros abiertos en los que el grupo comparte su investigación con docentes, estudiantes y otros equipos.",
          enlace: "/eventos",
        },
        {
          icon: "newspaper",
          titulo: "Noticias del grupo",
          texto:
            "La actualidad de los proyectos, las publicaciones y las actividades de DIDEROT.",
          enlace: "/noticias",
        },
      ],
    },
  ],
  blocksEn: {
    "transferencia:intro": `<p>Transferring knowledge to society is part of DIDEROT's work: making sure that research on digital didactics of music and the performing arts reaches classrooms, schools, cultural institutions and companies in the sector.</p>`,
    "transferencia:mision": `<p>The group places its research (digital didactics, intelligent technologies applied to music, digital editing and encoding of musical heritage) at the service of teachers, schools and institutions, through collaborative projects, specialised training, digital resources and outreach activities.</p>`,
    "transferencia:transferlab": `<p><strong>DIDEROT TransferLab</strong> is the Knowledge Transfer Group (GTC) of the University Institute of Education Sciences (IUCE) linked to DIDEROT. It channels the group's knowledge transfer towards the education system, the cultural sector and industry: advice, training, resource development and collaboration on projects.</p>`,
    "transferencia:otc-descripcion": `<p>The Knowledge Transfer Office of the University of Salamanca channels Article 60 contracts, patents and collaboration with companies and institutions.</p>`,
    "transferencia:cta": `<p><strong>Would your school, institution or company like to work with DIDEROT?</strong></p>
<p>Write to us and we will explore together how the group's research can help you: training, digital resources, musical heritage or outreach.</p>`,
  },
  listsEn: {
    "transferencia:list:lineas": [
      {
        icon: "graduation-cap",
        titulo: "Teacher advice and training",
        texto:
          "Training and advice for teachers and schools on digital didactics of music and the performing arts.",
      },
      {
        icon: "laptop",
        titulo: "Digital resources and platforms",
        texto:
          "Design, development and evaluation of digital resources, applications and platforms for music education.",
      },
      {
        icon: "file-music",
        titulo: "Digital music editing and encoding",
        texto:
          "Digital editing of scores and encoding in open standards such as MEI, supporting the preservation and dissemination of musical heritage.",
      },
      {
        icon: "megaphone",
        titulo: "Outreach and science communication",
        texto:
          "Seminars, study days, publications and activities that bring research in music and arts education closer to society.",
      },
    ],
    "transferencia:list:proyectos": [
      {
        acronimo: "EA-DIGIFOLK",
        titulo:
          "An European and Ibero-American approach for the digital collection, analysis and dissemination of folk music",
        financiacion: "Horizon Europe · MSCA Staff Exchanges (European Union)",
        periodo: "2023–2026",
        ip: "Javier Félix Merchán Sánchez-Jara and María Navarro Cáceres",
        texto:
          "Digital collection, analysis and dissemination of folk music from a European and Ibero-American perspective, with staff exchanges between institutions.",
        enlace: "https://digifolk.usal.es/#/",
      },
      {
        acronimo: "Co-POEM",
        titulo:
          "Platform for the Collaborative Generation of European Popular Music",
        financiacion: "Erasmus+ KA201 · European Commission",
        periodo: "2019–2022",
        ip: "María Navarro Cáceres",
        texto:
          "A platform for the collaborative creation of European popular music, developed within an Erasmus+ strategic partnership for school education.",
        enlace: "",
      },
      {
        acronimo: "FolkAI",
        titulo:
          "Preservation and Dissemination of the European Musical Tradition through Artificial Intelligence",
        financiacion: "Spanish Ministry of Science and Innovation (MICINN)",
        periodo: "2020–2023",
        ip: "",
        texto:
          "Artificial intelligence serving the preservation and dissemination of the European musical tradition.",
        enlace: "",
      },
    ],
    "transferencia:list:divulgacion": [
      {
        icon: "music-4",
        titulo: "Música Sincrónica",
        texto: "A blog on popular music in music education.",
        enlace: "",
      },
      {
        icon: "presentation",
        titulo: "Seminars and study days",
        texto:
          "Open meetings where the group shares its research with teachers, students and other teams.",
        enlace: "/eventos",
      },
      {
        icon: "newspaper",
        titulo: "Group news",
        texto:
          "The latest on DIDEROT's projects, publications and activities.",
        enlace: "/noticias",
      },
    ],
  },
};
