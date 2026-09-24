import { SITE } from "@/lib/site";
import type { PageContentModule } from "./types";

/**
 * Contenido editable de las páginas legales (pageSlug "legal"): aviso legal,
 * política de privacidad, política de cookies y declaración de
 * accesibilidad. Textos adaptados de los de la web del IUCE.
 *
 * PROVISIONAL: la política de privacidad y la de cookies describen el
 * funcionamiento real de esta web, pero conviene que las revise el servicio
 * de protección de datos de la Universidad de Salamanca antes de publicar.
 */

// Enlaces que se repiten en varios textos.
const USAL_DATOS = "https://www.usal.es/proteccion-de-datos";
const USAL_ACCESIBILIDAD = "https://www.usal.es/accesibilidad";
const AEPD = "https://www.aepd.es";
const MAIL = `<a href="mailto:${SITE.email}">${SITE.email}</a>`;

export const content: PageContentModule = {
  blocks: {
    pageSlug: "legal",
    label: "Páginas legales (aviso legal, privacidad, cookies y accesibilidad)",
    blocks: [
      {
        blockKey: "aviso-legal",
        title: "Aviso legal — texto completo",
        defaultContent: `<p>Este sitio web es la página del <strong>Grupo de Investigación Reconocido DIDEROT</strong> («Didácticas Digitales de la Expresión Musical y las Artes Performativas») de la Universidad de Salamanca, adscrito al Instituto Universitario de Ciencias de la Educación (IUCE), con sede en el Edificio Solís, Paseo de Canalejas, 169, 37008 Salamanca. Contacto: ${MAIL}.</p>
<h2>Titularidad y condiciones de uso</h2>
<p>La titularidad del sitio corresponde a la Universidad de Salamanca (CIF Q3718001E, Patio de Escuelas 1, 37008 Salamanca). El acceso al sitio atribuye la condición de persona usuaria e implica la aceptación de estas condiciones. Los contenidos se ofrecen con finalidad informativa; el grupo procura su exactitud y actualización, sin que el contenido de esta web constituya, por sí mismo, fuente de efectos jurídicos vinculantes.</p>
<h2>Propiedad intelectual</h2>
<p>Salvo indicación expresa, los contenidos propios de este sitio (textos, imágenes y logotipos) pertenecen a la Universidad de Salamanca o a los miembros del grupo, o se publican con autorización de sus titulares. Se permite la cita y el enlace con mención de la fuente; cualquier otro uso requiere autorización previa.</p>
<h2>Protección de datos</h2>
<p>Los datos personales que nos facilites al escribirnos se tratan conforme al Reglamento General de Protección de Datos (RGPD) y a la LOPDGDD, tal como se explica en la <a href="/privacidad">política de privacidad</a>. La política general de la Universidad está en su <a href="${USAL_DATOS}">página de protección de datos</a>.</p>
<h2>Enlaces externos</h2>
<p>Este sitio enlaza a páginas de terceros (revistas, portales de investigación, proyectos y entidades colaboradoras) sobre cuyos contenidos el grupo no tiene responsabilidad.</p>`,
      },
      {
        blockKey: "privacidad",
        title: "Política de privacidad — texto completo",
        defaultContent: `<p>Esta política explica cómo se tratan los datos personales en la web del Grupo de Investigación Reconocido DIDEROT. Para navegar por la web no es necesario facilitar ningún dato personal, y la web no tiene formularios que los recojan.</p>
<h2>Responsable del tratamiento</h2>
<p>Universidad de Salamanca (CIF Q3718001E), Patio de Escuelas 1, 37008 Salamanca. La web la gestiona el grupo DIDEROT, adscrito al Instituto Universitario de Ciencias de la Educación (IUCE). Contacto del grupo: ${MAIL}.</p>
<h2>Delegado de Protección de Datos</h2>
<p>La Universidad de Salamanca cuenta con un Delegado de Protección de Datos, al que puedes dirigirte para cualquier cuestión sobre el tratamiento de tus datos. Sus datos de contacto están publicados en la <a href="${USAL_DATOS}">página de protección de datos de la Universidad</a>.</p>
<h2>Si nos escribes por correo electrónico</h2>
<p>Si escribes a la dirección de contacto del grupo, tratamos tu nombre, tu dirección de correo y lo que nos cuentes con la única finalidad de responder a tu consulta y hacer su seguimiento. El correo se gestiona con los servicios de correo de la Universidad de Salamanca. No se utiliza para enviarte comunicaciones comerciales ni para elaborar perfiles.</p>
<h2>Base jurídica</h2>
<p>El consentimiento que prestas al escribirnos (artículo 6.1.a del RGPD). Puedes retirarlo en cualquier momento, sin que ello afecte a la licitud del tratamiento anterior.</p>
<h2>Destinatarios</h2>
<p>Los correos llegan a las personas del grupo que atienden la dirección de contacto. No se ceden datos a terceros, salvo obligación legal.</p>
<h2>Plazo de conservación</h2>
<p>Los datos se conservan durante el tiempo necesario para atender tu consulta y después se suprimen, salvo que deban conservarse para cumplir una obligación legal.</p>
<h2>Tus derechos</h2>
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar tu consentimiento, ante la Universidad de Salamanca por los cauces indicados en su <a href="${USAL_DATOS}">página de protección de datos</a>, o escribiendo al grupo a ${MAIL}. Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar una reclamación ante la <a href="${AEPD}">Agencia Española de Protección de Datos</a>.</p>
<h2>Seguridad</h2>
<p>La web se sirve cifrada (HTTPS). El panel de administración, desde el que se gestionan los contenidos, solo es accesible para las cuentas del grupo.</p>
<h2>Estadísticas de visitas</h2>
<p>La web cuenta sus visitas de forma agregada y sin cookies: no guarda la dirección IP ni los datos del navegador, solo un identificador anónimo que cambia cada día y no permite identificarte. Se respetan las opciones «No rastrear» y Global Privacy Control del navegador.</p>
<h2>Cookies</h2>
<p>La información sobre cookies y almacenamiento en el navegador está en la <a href="/politica-de-cookies">política de cookies</a>.</p>`,
      },
      {
        blockKey: "cookies",
        title: "Política de cookies — texto completo",
        defaultContent: `<p>Una cookie es un pequeño archivo que un sitio web guarda en tu navegador para recordar información entre visitas. Esta web no utiliza cookies publicitarias ni de analítica de terceros.</p>
<h2>Qué utiliza esta web</h2>
<ul><li><strong>Cookies técnicas de sesión del panel de administración</strong> (<code>authjs.*</code>): solo se instalan cuando una persona del equipo inicia sesión en el panel de gestión de la web, para mantener la sesión abierta de forma segura, y caducan como máximo a las 24 horas. Quienes visitan la web no las reciben.</li>
<li><strong>Preferencia de tema</strong> (almacenamiento local del navegador, clave <code>diderot-theme</code>): si eliges el modo claro u oscuro, la elección se guarda en tu propio navegador para mantenerla en las siguientes visitas. No es una cookie, no se envía al servidor y no sirve para identificarte.</li>
<li><strong>Estadísticas de visitas propias, sin cookies</strong>: para conocer de forma agregada qué páginas se consultan, la web registra en su propio servidor la página visitada y el sitio de procedencia, sin instalar cookies ni guardar nada en tu navegador y sin compartir los datos con terceros. No se almacenan la dirección IP ni los datos del navegador, solo un identificador anónimo que cambia cada día. Si tu navegador tiene activada la opción «No rastrear» (Do Not Track) o Global Privacy Control, la visita no se registra.</li></ul>
<h2>Contenidos de terceros</h2>
<p>El mapa de la página de contacto (Google Maps) solo se carga si pulsas «Ver el mapa»; a partir de ese momento, Google puede utilizar sus propias cookies. Los vídeos incrustados usan el modo de privacidad mejorada de YouTube (youtube-nocookie.com); al reproducirlos, YouTube puede guardar información en tu navegador conforme a su propia política.</p>
<h2>Cómo gestionar las cookies</h2>
<p>Puedes bloquear o borrar las cookies y el almacenamiento local desde la configuración de tu navegador. Si bloqueas las cookies necesarias, el panel de administración dejará de funcionar; el resto de la web se puede consultar con normalidad:</p>
<ul><li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies.</li>
<li><strong>Firefox:</strong> Ajustes → Privacidad y seguridad → Cookies y datos del sitio.</li>
<li><strong>Safari:</strong> Ajustes → Privacidad.</li>
<li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio.</li></ul>
<p>Más información sobre el tratamiento de datos personales en la <a href="/privacidad">política de privacidad</a>.</p>`,
      },
      {
        blockKey: "accesibilidad",
        title: "Declaración de accesibilidad — texto completo",
        defaultContent: `<p>La Universidad de Salamanca se ha comprometido a hacer accesible el sitio web del Grupo de Investigación Reconocido DIDEROT de conformidad con el <strong>Real Decreto 1112/2018</strong>, de 7 de septiembre, sobre accesibilidad de los sitios web y aplicaciones para dispositivos móviles del sector público.</p>
<p>La presente declaración de accesibilidad se aplica al sitio web <strong>diderot.usal.es</strong>.</p>
<h2>Situación de cumplimiento</h2>
<p>Este sitio web es <strong>parcialmente conforme</strong> con el RD 1112/2018 debido a las excepciones y a la falta de conformidad de los aspectos que se indican a continuación.</p>
<h2>Contenido no accesible</h2>
<p>El contenido que se recoge a continuación no es accesible por lo siguiente:</p>
<ul><li>Los carteles de los eventos son imágenes con texto. La información esencial de cada evento (título, fecha, hora y lugar) se ofrece también como texto en la página de Eventos.</li>
<li>Algunos documentos PDF y contenidos de terceros incrustados (vídeos, mapas) pueden no cumplir todos los requisitos de accesibilidad.</li></ul>
<h2>Preparación de la declaración</h2>
<p>Esta declaración se preparó en 2026 mediante una autoevaluación llevada a cabo por el propio grupo. La web se ha diseñado siguiendo las pautas WCAG 2.1 de nivel AA: contraste suficiente en los modos claro y oscuro, navegación completa con teclado, foco visible, textos alternativos y respeto de la preferencia de movimiento reducido.</p>
<h2>Observaciones y datos de contacto</h2>
<p>Puedes comunicar cualquier problema de accesibilidad o solicitar información sobre contenidos excluidos escribiendo a ${MAIL}. También puedes presentar una queja o solicitud a través del <a href="${USAL_ACCESIBILIDAD}">canal de accesibilidad de la Universidad de Salamanca</a>.</p>
<h2>Procedimiento de aplicación</h2>
<p>Si una vez realizada una solicitud de información accesible o queja, esta hubiera sido desestimada o no se estuviera de acuerdo con la decisión, puede iniciarse una reclamación conforme al artículo 13 del RD 1112/2018 ante la unidad responsable de accesibilidad de la Universidad de Salamanca.</p>`,
      },
    ],
  },
  lists: [],
  blocksEn: {
    "legal:aviso-legal": `<p>This website is the site of the <strong>DIDEROT Recognised Research Group</strong> («Digital Didactics of Musical Expression and the Performing Arts») of the University of Salamanca, attached to the University Institute of Education Sciences (IUCE), based at the Solís Building, Paseo de Canalejas, 169, 37008 Salamanca. Contact: ${MAIL}.</p>
<h2>Ownership and terms of use</h2>
<p>The site is owned by the University of Salamanca (CIF Q3718001E, Patio de Escuelas 1, 37008 Salamanca). Accessing the site confers the status of user and implies acceptance of these terms. The contents are provided for information purposes; the group strives to keep them accurate and up to date, although the content of this website does not, in itself, constitute a source of binding legal effects.</p>
<h2>Intellectual property</h2>
<p>Unless expressly indicated otherwise, the site's own content (texts, images and logos) belongs to the University of Salamanca or to the members of the group, or is published with the permission of its owners. Quotation and linking are permitted provided the source is acknowledged; any other use requires prior authorisation.</p>
<h2>Data protection</h2>
<p>Personal data you provide when writing to us are processed in accordance with the General Data Protection Regulation (GDPR) and the Spanish Data Protection Act (LOPDGDD), as explained in the <a href="/en/privacidad">privacy policy</a>. The University's general policy is available on its <a href="${USAL_DATOS}">data protection page</a>.</p>
<h2>External links</h2>
<p>This site links to third-party pages (journals, research portals, projects and partner organisations) for whose content the group bears no responsibility.</p>`,
    "legal:privacidad": `<p>This policy explains how personal data are processed on the website of the DIDEROT Recognised Research Group. You do not need to provide any personal data to browse the website, and the website has no forms that collect them.</p>
<h2>Data controller</h2>
<p>University of Salamanca (CIF Q3718001E), Patio de Escuelas 1, 37008 Salamanca. The website is managed by the DIDEROT group, attached to the University Institute of Education Sciences (IUCE). Group contact: ${MAIL}.</p>
<h2>Data Protection Officer</h2>
<p>The University of Salamanca has a Data Protection Officer, whom you can contact about any matter relating to the processing of your data. Their contact details are published on the <a href="${USAL_DATOS}">University's data protection page</a>.</p>
<h2>If you write to us by email</h2>
<p>If you write to the group's contact address, we process your name, your email address and whatever you tell us for the sole purpose of answering your enquiry and following it up. Email is handled through the University of Salamanca's email services. It is not used to send you marketing communications or to build profiles.</p>
<h2>Legal basis</h2>
<p>The consent you give by writing to us (Article 6(1)(a) GDPR). You may withdraw it at any time, without affecting the lawfulness of prior processing.</p>
<h2>Recipients</h2>
<p>Emails reach the members of the group who handle the contact address. No data are disclosed to third parties unless required by law.</p>
<h2>Retention period</h2>
<p>Data are kept for as long as necessary to deal with your enquiry and are then deleted, unless they must be kept to comply with a legal obligation.</p>
<h2>Your rights</h2>
<p>You may exercise your rights of access, rectification, erasure, objection, restriction of processing and portability, and withdraw your consent, before the University of Salamanca through the channels set out on its <a href="${USAL_DATOS}">data protection page</a>, or by writing to the group at ${MAIL}. If you consider that the processing does not comply with the regulations, you may lodge a complaint with the <a href="${AEPD}">Spanish Data Protection Agency (AEPD)</a>.</p>
<h2>Security</h2>
<p>The website is served encrypted (HTTPS). The administration panel, from which the content is managed, is only accessible to the group's accounts.</p>
<h2>Visit statistics</h2>
<p>The website counts its visits in aggregate and without cookies: it does not store your IP address or browser details, only an anonymous identifier that changes every day and cannot identify you. The browser's «Do Not Track» and Global Privacy Control settings are respected.</p>
<h2>Cookies</h2>
<p>Information on cookies and browser storage is available in the <a href="/en/politica-de-cookies">cookie policy</a>.</p>`,
    "legal:cookies": `<p>A cookie is a small file that a website stores in your browser to remember information between visits. This website does not use advertising cookies or third-party analytics cookies.</p>
<h2>What this website uses</h2>
<ul><li><strong>Technical session cookies for the administration panel</strong> (<code>authjs.*</code>): they are only set when a member of the team signs in to the website's management panel, to keep the session open securely, and they expire after 24 hours at most. Visitors to the website do not receive them.</li>
<li><strong>Theme preference</strong> (browser local storage, key <code>diderot-theme</code>): if you choose light or dark mode, your choice is stored in your own browser so that it is kept on later visits. It is not a cookie, it is not sent to the server and it cannot identify you.</li>
<li><strong>First-party visit statistics, without cookies</strong>: to find out, in aggregate, which pages are viewed, the website records on its own server the page visited and the referring site, without setting cookies or storing anything in your browser and without sharing the data with third parties. Neither your IP address nor your browser details are stored, only an anonymous identifier that changes every day. If your browser has «Do Not Track» or Global Privacy Control enabled, the visit is not recorded.</li></ul>
<h2>Third-party content</h2>
<p>The map on the contact page (Google Maps) is only loaded if you click «Show the map»; from that moment on, Google may use its own cookies. Embedded videos use YouTube's privacy-enhanced mode (youtube-nocookie.com); when you play them, YouTube may store information in your browser in accordance with its own policy.</p>
<h2>How to manage cookies</h2>
<p>You can block or delete cookies and local storage in your browser settings. If you block the necessary cookies, the administration panel will stop working; the rest of the website can be browsed as usual:</p>
<ul><li><strong>Chrome:</strong> Settings → Privacy and security → Cookies.</li>
<li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data.</li>
<li><strong>Safari:</strong> Settings → Privacy.</li>
<li><strong>Edge:</strong> Settings → Cookies and site permissions.</li></ul>
<p>More information on the processing of personal data is available in the <a href="/en/privacidad">privacy policy</a>.</p>`,
    "legal:accesibilidad": `<p>The University of Salamanca is committed to making the website of the DIDEROT Recognised Research Group accessible in accordance with <strong>Royal Decree 1112/2018</strong> of 7 September on the accessibility of public sector websites and mobile applications.</p>
<p>This accessibility statement applies to the website <strong>diderot.usal.es</strong>.</p>
<h2>Compliance status</h2>
<p>This website is <strong>partially compliant</strong> with Royal Decree 1112/2018 owing to the exceptions and the non-compliant aspects listed below.</p>
<h2>Non-accessible content</h2>
<p>The content listed below is not accessible for the following reasons:</p>
<ul><li>Event posters are images containing text. The essential information about each event (title, date, time and venue) is also provided as text on the Events page.</li>
<li>Some PDF documents and embedded third-party content (videos, maps) may not meet every accessibility requirement.</li></ul>
<h2>Preparation of this statement</h2>
<p>This statement was prepared in 2026 by means of a self-assessment carried out by the group itself. The website has been designed following the WCAG 2.1 level AA guidelines: sufficient contrast in light and dark modes, full keyboard navigation, visible focus, text alternatives and support for the reduced-motion preference.</p>
<h2>Feedback and contact details</h2>
<p>You can report any accessibility problem or request information about excluded content by writing to ${MAIL}. You can also submit a complaint or request through the <a href="${USAL_ACCESIBILIDAD}">accessibility channel of the University of Salamanca</a>.</p>
<h2>Enforcement procedure</h2>
<p>If a request for accessible information or a complaint has been rejected, or if you disagree with the decision taken, you may lodge a claim under Article 13 of Royal Decree 1112/2018 with the unit responsible for accessibility at the University of Salamanca.</p>`,
  },
  listsEn: {},
};
