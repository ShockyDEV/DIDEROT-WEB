/**
 * Proyectos y financiaciones de DIDEROT para la semilla de la BD.
 *
 * FUENTES:
 *  - Portal de Producción Científica de la USAL, pestaña «Financiación» del
 *    grupo 12132 (11 financiaciones desde 2019, 2.302.676 €), con la ficha
 *    de cada proyecto (referencia, financiador, fechas, importe, ámbito,
 *    responsables y equipo). Datos a 10-09-2026.
 *  - Memoria del IUCE 2024-2025 (Tabla 4, línea DIDEROT): IHMAGINE y
 *    HAR2017-82413-R, que no figuran en el agregado del portal (el portal
 *    avisa de que puede no ser exhaustivo y solo tiene datos desde 2019).
 *
 * En los proyectos que no dirige el grupo, el resumen indica qué miembros de
 * DIDEROT forman parte del equipo según el portal. Los resúmenes solo
 * reformulan el título (no hay descripción pública): son editables en el
 * panel (Investigación → Proyectos).
 */
export interface ProjectSeed {
  title: string;
  titleEn?: string;
  acronym?: string;
  reference?: string;
  funder: string;
  ip: string;
  scope: "Europeo" | "Internacional" | "Nacional" | "Autonómico" | "Institucional" | "Local";
  amount: string;
  period: string;
  startYear: number;
  endYear: number;
  summary?: string;
  summaryEn?: string;
  /** Web del proyecto o, si no tiene, su ficha en el Portal de Producción Científica. */
  url?: string;
  featured?: boolean;
}

export const projects: ProjectSeed[] = [
  {
    title:
      "EA-DIGIFOLK: An European and Ibero-American approach for the digital collection, analysis and dissemination of folk music",
    titleEn:
      "EA-DIGIFOLK: An European and Ibero-American approach for the digital collection, analysis and dissemination of folk music",
    acronym: "EA-DIGIFOLK",
    reference: "HORIZON-MSCA-2021-SE-01 (Staff Exchanges)",
    funder: "Unión Europea (Horizonte Europa, Acciones Marie Skłodowska-Curie)",
    ip: "Javier Félix Merchán Sánchez-Jara; María Navarro Cáceres",
    scope: "Europeo",
    amount: "437.000,00 €",
    period: "01/01/2023 – 31/12/2026",
    startYear: 2023,
    endYear: 2026,
    summary:
      "Red europea e iberoamericana de intercambio de personal para la recopilación, el análisis y la difusión digital de la música folk. Codirigido por el responsable de DIDEROT; en el equipo participan también Javier Cruz Rodríguez y Concepción Pedrero Muñoz.",
    summaryEn:
      "European and Ibero-American staff-exchange network for the digital collection, analysis and dissemination of folk music. Co-led by DIDEROT's group leader; team members also include Javier Cruz Rodríguez and Concepción Pedrero Muñoz.",
    featured: true,
    url: "https://digifolk.usal.es/#/",
  },
  {
    title: "Teachers' HAVEN: Teachers' Haven Academy for promoting professional Versatility, inner Equilibrium and Networking",
    acronym: "Teachers' HAVEN",
    reference: "101196768",
    funder: "Comisión Europea",
    ip: "Eva Lahuerta Otero",
    scope: "Europeo",
    amount: "127.120,21 €",
    period: "01/04/2025 – 31/03/2028",
    startYear: 2025,
    endYear: 2028,
    summary:
      "Academia europea para el bienestar, la versatilidad profesional y el trabajo en red del profesorado. Participa desde DIDEROT: Bohdan Syroyid Syroyid.",
    summaryEn:
      "European academy for teachers' wellbeing, professional versatility and networking. DIDEROT participant: Bohdan Syroyid Syroyid.",
    url: "https://produccioncientifica.usal.es/proyectos/1336763/detalle",
  },
  {
    title: "PreMedBullying: Preventing Bullying in Primary Schools at the Mediterranean Region",
    acronym: "PreMedBullying",
    reference: "2024-1-EL01-KA220-SCH-000246861",
    funder: "Comisión Europea (Erasmus+ KA220-SCH)",
    ip: "María José Hernández Serrano",
    scope: "Europeo",
    amount: "52.110,00 €",
    period: "01/09/2024 – 31/08/2027",
    startYear: 2024,
    endYear: 2027,
    summary:
      "Prevención del acoso escolar en centros de Educación Primaria de la región mediterránea. Participa desde DIDEROT: Javier Cruz Rodríguez.",
    summaryEn:
      "Bullying prevention in primary schools across the Mediterranean region. DIDEROT participant: Javier Cruz Rodríguez.",
    url: "https://produccioncientifica.usal.es/proyectos/996235/detalle",
  },
  {
    title: "EC2U: European Campus of City-Universities 2023-2027",
    acronym: "EC2U",
    reference: "101124589",
    funder: "Comisión Europea (Universidades Europeas)",
    ip: "Raúl Sánchez Prieto",
    scope: "Europeo",
    amount: "1.436.136,00 €",
    period: "01/11/2023 – 31/10/2027",
    startYear: 2023,
    endYear: 2027,
    summary:
      "Alianza de universidades europeas «European Campus of City-Universities», de la que forma parte la Universidad de Salamanca. Participa desde DIDEROT: Javier Félix Merchán Sánchez-Jara.",
    summaryEn:
      "European University alliance «European Campus of City-Universities», which includes the University of Salamanca. DIDEROT participant: Javier Félix Merchán Sánchez-Jara.",
    url: "https://produccioncientifica.usal.es/proyectos/701590/detalle",
  },
  {
    title:
      "ReligiTour: Enhancement of the competences and possibilities for religious tourism development and for better integration and management of religious sites in the urban environment",
    acronym: "ReligiTour",
    reference: "2023-1-PL01-KA220-HED-000156074",
    funder: "Comisión Europea (Erasmus+ KA220-HED)",
    ip: "Francisco Javier Melgosa Arcos",
    scope: "Europeo",
    amount: "42.925,00 €",
    period: "31/12/2023 – 29/06/2026",
    startYear: 2023,
    endYear: 2026,
    summary:
      "Competencias para el desarrollo del turismo religioso y la gestión de espacios religiosos en entornos urbanos. Participa desde DIDEROT: Bohdan Syroyid Syroyid.",
    summaryEn:
      "Skills for religious tourism development and the management of religious sites in urban settings. DIDEROT participant: Bohdan Syroyid Syroyid.",
    url: "https://produccioncientifica.usal.es/proyectos/751565/detalle",
  },
  {
    title:
      "Cultour Gastronomy: Enhancement of gastronomy tourism potential of small traditional food producers & increasing cultural awareness of EU & national gastronomic heritage",
    acronym: "Cultour Gastronomy",
    reference: "2022-1-FR01-KA220-VET-000086243",
    funder: "Comisión Europea (Erasmus+ KA220-VET)",
    ip: "Eva Lahuerta Otero; Francisco Javier Melgosa Arcos",
    scope: "Europeo",
    amount: "40.900,00 €",
    period: "29/12/2022 – 28/04/2025",
    startYear: 2022,
    endYear: 2025,
    summary:
      "Potencial turístico de los pequeños productores gastronómicos tradicionales y conciencia cultural sobre el patrimonio gastronómico. Participa desde DIDEROT: Bohdan Syroyid Syroyid.",
    summaryEn:
      "Tourism potential of small traditional food producers and cultural awareness of gastronomic heritage. DIDEROT participant: Bohdan Syroyid Syroyid.",
    url: "https://produccioncientifica.usal.es/proyectos/340579/detalle",
  },
  {
    title: "NUBETECA, tercera fase de la investigación",
    titleEn: "NUBETECA, third phase of the research",
    acronym: "NUBETECA",
    funder: "Diputación de Badajoz (contrato)",
    ip: "José Antonio Cordón García",
    scope: "Autonómico",
    amount: "2.950,00 €",
    period: "01/01/2024 – 31/12/2024",
    startYear: 2024,
    endYear: 2024,
    summary:
      "Contrato de investigación con la Diputación de Badajoz (tercera fase). Participa desde DIDEROT: Javier Félix Merchán Sánchez-Jara.",
    summaryEn:
      "Research contract with the Provincial Council of Badajoz (third phase). DIDEROT participant: Javier Félix Merchán Sánchez-Jara.",
    url: "https://produccioncientifica.usal.es/proyectos/782592/detalle",
  },
  {
    title: "Tratados musicales en español",
    titleEn: "Music treatises in Spanish",
    acronym: "TraMusE",
    reference: "PID2019-107523GB-I00",
    funder: "Ministerio de Ciencia e Innovación (Proyectos de I+D+i)",
    ip: "Amaya Sara García Pérez; José Máximo Leza Cruz",
    scope: "Nacional",
    amount: "36.300,00 €",
    period: "01/06/2020 – 28/02/2025",
    startYear: 2020,
    endYear: 2025,
    summary:
      "Estudio de los tratados musicales escritos en español. Participan desde DIDEROT: Javier Félix Merchán Sánchez-Jara y Beatriz Hernández Polo.",
    summaryEn:
      "Study of music treatises written in Spanish. DIDEROT participants: Javier Félix Merchán Sánchez-Jara and Beatriz Hernández Polo.",
    url: "https://produccioncientifica.usal.es/proyectos/47015/detalle",
  },
  {
    title: "Exocanónicos: márgenes y descentramiento en la literatura en español del siglo XXI",
    titleEn: "Exocanonical: margins and decentring in 21st-century literature in Spanish",
    acronym: "EXOCANON",
    reference: "PID2019-104957GA-I00",
    funder: "Ministerio de Ciencia e Innovación (Proyectos de I+D+i)",
    ip: "Daniel Escandell Montiel",
    scope: "Nacional",
    amount: "29.040,00 €",
    period: "01/06/2020 – 13/06/2023",
    startYear: 2020,
    endYear: 2023,
    summary:
      "Literatura en español del siglo XXI situada en los márgenes del canon. Participa desde DIDEROT: Javier Félix Merchán Sánchez-Jara.",
    summaryEn:
      "21st-century literature in Spanish at the margins of the canon. DIDEROT participant: Javier Félix Merchán Sánchez-Jara.",
    url: "https://produccioncientifica.usal.es/proyectos/47051/detalle",
  },
  {
    title: "FolkAI: Preservación y Difusión de la Tradición Musical Europea a través de la Inteligencia Artificial",
    titleEn: "FolkAI: Preserving and disseminating the European musical tradition through Artificial Intelligence",
    acronym: "FolkAI",
    reference: "EIN2020-112348",
    funder: "Ministerio de Ciencia e Innovación (Acciones de Dinamización «Europa Investigación» 2020)",
    ip: "María Navarro Cáceres",
    scope: "Nacional",
    amount: "15.000,00 €",
    period: "01/11/2020 – 31/07/2023",
    startYear: 2020,
    endYear: 2023,
    summary:
      "Inteligencia artificial para preservar y difundir la tradición musical europea. Participa desde DIDEROT: Javier Félix Merchán Sánchez-Jara.",
    summaryEn:
      "Artificial intelligence to preserve and disseminate the European musical tradition. DIDEROT participant: Javier Félix Merchán Sánchez-Jara.",
    url: "https://produccioncientifica.usal.es/proyectos/47151/detalle",
  },
  {
    title: "Co-POEM: Platform for the Collaborative Generation of European Popular Music",
    acronym: "Co-POEM",
    reference: "2019-1-ES01-KA201-064933",
    funder: "Comisión Europea (Erasmus+ KA201, cooperación para la innovación)",
    ip: "María Navarro Cáceres",
    scope: "Europeo",
    amount: "83.195,00 €",
    period: "01/09/2019 – 31/08/2022",
    startYear: 2019,
    endYear: 2022,
    summary:
      "Plataforma para la creación colaborativa de música popular europea en el ámbito educativo. Participan desde DIDEROT: Javier Félix Merchán Sánchez-Jara y Sara González Gutiérrez.",
    summaryEn:
      "Platform for the collaborative creation of European popular music in education. DIDEROT participants: Javier Félix Merchán Sánchez-Jara and Sara González Gutiérrez.",
    featured: true,
    url: "https://produccioncientifica.usal.es/proyectos/46881/detalle",
  },
  {
    title: "IHMAGINE: Intangible Heritage Music and Gender: International Network",
    acronym: "IHMAGINE",
    reference: "SA053G24",
    funder: "Consejería de Educación y Cultura, Junta de Castilla y León",
    ip: "Matilde María Olarte Martínez",
    scope: "Autonómico",
    amount: "12.000,00 €",
    period: "01/01/2025 – 31/12/2027",
    startYear: 2025,
    endYear: 2027,
    summary: "Red internacional sobre patrimonio musical inmaterial y género.",
    summaryEn: "International network on intangible musical heritage and gender.",
  },
  {
    title:
      "La canción popular como fuente de inspiración. Estudio de identidades de género a través de mujeres promotoras de popular (1917-1961)",
    titleEn:
      "Popular song as a source of inspiration. A study of gender identities through women promoters of popular music (1917-1961)",
    reference: "HAR2017-82413-R",
    funder: "Ministerio de Economía y Competitividad",
    ip: "Judith Helvia García Martín; Matilde María Olarte Martínez",
    scope: "Nacional",
    amount: "30.250,00 €",
    period: "01/01/2018 – 31/12/2021",
    startYear: 2018,
    endYear: 2021,
    summary:
      "Estudio de las identidades de género a través de las mujeres que promovieron la canción popular entre 1917 y 1961.",
    summaryEn:
      "A study of gender identities through the women who promoted popular song between 1917 and 1961.",
  },
];
