/**
 * Noticias iniciales de DIDEROT para la semilla de la BD.
 *
 * Solo recogen hechos verificables: los anuncios de las tres jornadas del
 * Seminario Internacional (datos de sus carteles oficiales) y el estreno de
 * la web. El histórico de la web antigua (WordPress) se migrará cuando se
 * disponga de su copia; las categorías son las de src/lib/content/news.ts.
 * Las portadas son imágenes de marca generadas para la web
 * (public/images/noticias).
 */
export interface NewsSeed {
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  category: string;
  coverImage: string;
  publishedAt: string;
}

const organizan = `<p>El seminario lo organizan el Grupo de Investigación Reconocido <strong>DIDEROT</strong>, el <strong>Instituto Universitario de Ciencias de la Educación (IUCE)</strong> y el <strong>Centro de Formación Permanente</strong> de la Universidad de Salamanca, con la dirección académica de <strong>Javier F. Merchán Sánchez-Jara</strong>.</p>`;
const organizanEn = `<p>The seminar is organised by the Recognised Research Group <strong>DIDEROT</strong>, the <strong>University Institute of Education Sciences (IUCE)</strong> and the <strong>Lifelong Learning Centre</strong> of the University of Salamanca, under the academic direction of <strong>Javier F. Merchán Sánchez-Jara</strong>.</p>`;

const programa = `<ul><li><strong>Jornada I</strong> · Encuentro de investigación predoctoral. Educación musical y artes performativas — 30 de abril, 16:00 h, Aula 12A, Edificio Solís.</li><li><strong>Jornada II</strong> · Mesa de comunicaciones. Investigación y proyectos en educación musical y artes performativas — 4 de junio, 16:00 h, Aula 17A (IUCE), Edificio Solís.</li><li><strong>Jornada III</strong> · Mesa de comunicaciones. Intersecciones entre arte, educación y tecnología — 10 de junio, 16:30 h, Aula de Usos Múltiples (IUCE), Edificio Solís.</li></ul>`;
const programaEn = `<ul><li><strong>Session I</strong> · Predoctoral research meeting. Music education and the performing arts — 30 April, 4 pm, Room 12A, Solís Building.</li><li><strong>Session II</strong> · Paper session. Research and projects in music education and the performing arts — 4 June, 4 pm, Room 17A (IUCE), Solís Building.</li><li><strong>Session III</strong> · Paper session. Intersections between art, education and technology — 10 June, 4.30 pm, Multipurpose Room (IUCE), Solís Building.</li></ul>`;

export const news: NewsSeed[] = [
  {
    slug: "nueva-web-del-grupo-diderot",
    title: "DIDEROT estrena web",
    titleEn: "DIDEROT launches its new website",
    excerpt:
      "La nueva web del grupo reúne en un mismo sitio su equipo, sus líneas de investigación, sus proyectos, su producción científica y su actividad.",
    excerptEn:
      "The group's new website brings together its team, research lines, projects, scientific output and activities in one place.",
    content: `<p>El Grupo de Investigación Reconocido <strong>DIDEROT — Didácticas Digitales de la Expresión Musical y las Artes Performativas</strong> de la Universidad de Salamanca estrena web.</p>
<p>El nuevo sitio reúne la presentación del grupo y de su <a href="/grupo#equipo">equipo</a>, sus <a href="/investigacion#lineas">líneas de investigación</a>, los <a href="/investigacion#proyectos">proyectos</a> en los que participa, su <a href="/publicaciones">producción científica</a> —con buscador y filtros por tipo y año— y la actualidad de sus <a href="/eventos">eventos</a> y actividades de transferencia y formación.</p>
<p>La web está disponible también en inglés y se irá completando con el histórico de noticias del grupo.</p>`,
    contentEn: `<p>The Recognised Research Group <strong>DIDEROT — Digital Didactics of Musical Expression and the Performing Arts</strong> of the University of Salamanca launches its new website.</p>
<p>The new site brings together the presentation of the group and its <a href="/en/grupo#equipo">team</a>, its <a href="/en/investigacion#lineas">research lines</a>, the <a href="/en/investigacion#proyectos">projects</a> it takes part in, its <a href="/en/publicaciones">scientific output</a> —searchable and filterable by type and year— and news about its <a href="/en/eventos">events</a>, knowledge transfer and training activities.</p>
<p>The website is also available in Spanish and will be completed with the group's news archive.</p>`,
    category: "Divulgación",
    coverImage: "/images/noticias/nueva-web.jpg",
    publishedAt: "2026-09-24T09:00:00+02:00",
  },
  {
    slug: "seminario-internacional-didacticas-digitales-jornada-iii",
    title: "Jornada III del Seminario Internacional: intersecciones entre arte, educación y tecnología",
    titleEn: "Session III of the International Seminar: intersections between art, education and technology",
    excerpt:
      "El 10 de junio, a las 16:30 h, el Aula de Usos Múltiples del IUCE acoge la tercera jornada del Seminario Internacional de Didácticas Digitales de la Expresión Musical y las Artes Performativas.",
    excerptEn:
      "On 10 June at 4.30 pm, the IUCE Multipurpose Room hosts the third session of the International Seminar on Digital Didactics of Musical Expression and the Performing Arts.",
    content: `<p>La tercera jornada del Seminario Internacional <strong>«Didácticas digitales de la expresión musical y las artes performativas: tecnologías inteligentes y creatividad en entornos virtuales»</strong> se celebra el <strong>10 de junio de 2026, a las 16:30 h</strong>, en el <strong>Aula de Usos Múltiples del IUCE</strong> (Edificio Solís).</p>
<p>La sesión adopta formato de mesa de comunicaciones bajo el título <em>Intersecciones entre arte, educación y tecnología</em>.</p>
${organizan}
<p>Programa de la 1.ª edición:</p>
${programa}`,
    contentEn: `<p>The third session of the International Seminar <strong>“Digital didactics of musical expression and the performing arts: intelligent technologies and creativity in virtual environments”</strong> takes place on <strong>10 June 2026 at 4.30 pm</strong> in the <strong>IUCE Multipurpose Room</strong> (Solís Building).</p>
<p>The session is a paper session entitled <em>Intersections between art, education and technology</em>.</p>
${organizanEn}
<p>Programme of the 1st edition:</p>
${programaEn}`,
    category: "Eventos",
    coverImage: "/images/noticias/seminario-jornada-iii.jpg",
    publishedAt: "2026-06-03T10:00:00+02:00",
  },
  {
    slug: "seminario-internacional-didacticas-digitales-jornada-ii",
    title:
      "Jornada II del Seminario Internacional: investigación y proyectos en educación musical y artes performativas",
    titleEn:
      "Session II of the International Seminar: research and projects in music education and the performing arts",
    excerpt:
      "El 4 de junio, a las 16:00 h, el Aula 17A del IUCE acoge una mesa de comunicaciones sobre investigación y proyectos en educación musical y artes performativas.",
    excerptEn:
      "On 4 June at 4 pm, IUCE Room 17A hosts a paper session on research and projects in music education and the performing arts.",
    content: `<p>La segunda jornada del Seminario Internacional <strong>«Didácticas digitales de la expresión musical y las artes performativas: tecnologías inteligentes y creatividad en entornos virtuales»</strong> se celebra el <strong>4 de junio de 2026, a las 16:00 h</strong>, en el <strong>Aula 17A del IUCE</strong> (Edificio Solís).</p>
<p>La sesión es una mesa de comunicaciones dedicada a la <em>investigación y los proyectos en educación musical y artes performativas</em>.</p>
${organizan}
<p>Programa de la 1.ª edición:</p>
${programa}`,
    contentEn: `<p>The second session of the International Seminar <strong>“Digital didactics of musical expression and the performing arts: intelligent technologies and creativity in virtual environments”</strong> takes place on <strong>4 June 2026 at 4 pm</strong> in <strong>IUCE Room 17A</strong> (Solís Building).</p>
<p>The session is a paper session devoted to <em>research and projects in music education and the performing arts</em>.</p>
${organizanEn}
<p>Programme of the 1st edition:</p>
${programaEn}`,
    category: "Eventos",
    coverImage: "/images/noticias/seminario-jornada-ii.jpg",
    publishedAt: "2026-05-28T10:00:00+02:00",
  },
  {
    slug: "seminario-internacional-didacticas-digitales-jornada-i",
    title:
      "Arranca el Seminario Internacional de Didácticas Digitales con un encuentro de investigación predoctoral",
    titleEn:
      "The International Seminar on Digital Didactics opens with a predoctoral research meeting",
    excerpt:
      "La 1.ª edición del seminario, organizada por DIDEROT, el IUCE y el Centro de Formación Permanente de la USAL, comienza el 30 de abril con un encuentro de investigación predoctoral en educación musical y artes performativas.",
    excerptEn:
      "The 1st edition of the seminar, organised by DIDEROT, the IUCE and the USAL Lifelong Learning Centre, opens on 30 April with a predoctoral research meeting on music education and the performing arts.",
    content: `<p>El <strong>30 de abril de 2026, a las 16:00 h</strong>, el <strong>Aula 12A del Edificio Solís</strong> acoge la primera jornada del Seminario Internacional <strong>«Didácticas digitales de la expresión musical y las artes performativas: tecnologías inteligentes y creatividad en entornos virtuales»</strong>, en su 1.ª edición.</p>
<p>La jornada inaugural es un <em>encuentro de investigación predoctoral</em> en educación musical y artes performativas.</p>
${organizan}
<p>Programa de la 1.ª edición:</p>
${programa}`,
    contentEn: `<p>On <strong>30 April 2026 at 4 pm</strong>, <strong>Room 12A of the Solís Building</strong> hosts the first session of the International Seminar <strong>“Digital didactics of musical expression and the performing arts: intelligent technologies and creativity in virtual environments”</strong>, in its 1st edition.</p>
<p>The opening session is a <em>predoctoral research meeting</em> on music education and the performing arts.</p>
${organizanEn}
<p>Programme of the 1st edition:</p>
${programaEn}`,
    category: "Eventos",
    coverImage: "/images/noticias/seminario-jornada-i.jpg",
    publishedAt: "2026-04-23T10:00:00+02:00",
  },
];
