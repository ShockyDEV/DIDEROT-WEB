import { SITE } from "@/lib/site";
import type { PageContentModule } from "./types";

/**
 * Contenido editable de «Contacto» (pageSlug "contacto"): datos de contacto,
 * enlace de la política de privacidad del formulario y «Cómo llegar».
 *
 * El destinatario real del formulario no se edita aquí: es la variable de
 * entorno CONTACT_TO (y, si falta, el correo de SITE).
 */
export const content: PageContentModule = {
  blocks: {
    pageSlug: "contacto",
    label: "Contacto",
    blocks: [
      {
        blockKey: "intro",
        title: "Contacto — párrafo de cabecera",
        defaultContent: `<p>Escríbenos para colaborar en investigación, hacer tu tesis doctoral, TFG o TFM con el grupo, plantear un proyecto de transferencia, proponer una actividad o atender una petición de los medios de comunicación.</p>`,
      },
      {
        blockKey: "direccion",
        title: "Contacto — dirección postal",
        defaultContent: `<p>Instituto Universitario de Ciencias de la Educación (IUCE)<br>Edificio Solís · Paseo de Canalejas, 169<br>37008 Salamanca</p>`,
      },
      {
        blockKey: "coordinacion",
        title: "Contacto — coordinación del grupo (vacío = ocultar)",
        defaultContent: `<p>${SITE.lead}</p>`,
      },
      {
        blockKey: "redes",
        title: "Contacto — redes sociales (vacío = ocultar)",
        defaultContent: `<p><a href="${SITE.links.twitter}">@DiderotGir</a> en X (Twitter)</p>`,
      },
      {
        blockKey: "url-privacidad",
        title: "Contacto — URL de la política de privacidad del formulario (RGPD)",
        defaultContent: `<p>/privacidad</p>`,
      },
      {
        blockKey: "como-llegar",
        title: "Contacto — Cómo llegar (transporte; vacío = ocultar)",
        defaultContent: `<p>El grupo tiene su sede en el Instituto Universitario de Ciencias de la Educación (IUCE), en el Edificio Solís, dentro del Campus de Educación (Paseo de Canalejas, 169).</p>
<ul><li><strong>En tren:</strong> la estación Vialia (Paseo de la Estación, s/n) ofrece conexiones directas con Madrid, Ávila y Valladolid. Horarios y billetes en renfe.com.</li>
<li><strong>En autobús:</strong> la Estación de Autobuses (Avda. Filiberto Villalobos, 71-85) conecta Salamanca con las principales ciudades a través de ALSA y Avanza; Avanza ofrece servicio directo con el aeropuerto de Madrid-Barajas.</li>
<li><strong>En coche:</strong> por la A-62 (Valladolid–Portugal) o la A-50 (Ávila–Madrid); el campus está junto al Paseo de Canalejas, con aparcamiento público en la zona.</li>
<li><strong>Bus urbano:</strong> varias líneas paran junto al Campus de Educación; consulta el plano de líneas en la web de transportes de Salamanca.</li></ul>`,
      },
    ],
  },
  lists: [],
  blocksEn: {
    "contacto:intro": `<p>Write to us to collaborate on research, to do your doctoral thesis or your bachelor's or master's thesis with the group, to discuss a knowledge transfer project, to propose an activity or with a media request.</p>`,
    "contacto:direccion": `<p>University Institute of Education Sciences (IUCE)<br>Solís Building · Paseo de Canalejas, 169<br>37008 Salamanca (Spain)</p>`,
    "contacto:redes": `<p><a href="${SITE.links.twitter}">@DiderotGir</a> on X (Twitter)</p>`,
    "contacto:como-llegar": `<p>The group is based at the University Institute of Education Sciences (IUCE), in the Solís Building, within the Education Campus (Paseo de Canalejas, 169).</p>
<ul><li><strong>By train:</strong> Vialia station (Paseo de la Estación, s/n) offers direct connections to Madrid, Ávila and Valladolid. Timetables and tickets at renfe.com.</li>
<li><strong>By coach:</strong> the Bus Station (Avda. Filiberto Villalobos, 71-85) connects Salamanca with the main cities through ALSA and Avanza; Avanza runs a direct service to Madrid-Barajas airport.</li>
<li><strong>By car:</strong> via the A-62 (Valladolid–Portugal) or the A-50 (Ávila–Madrid); the campus is next to Paseo de Canalejas, with public parking in the area.</li>
<li><strong>City buses:</strong> several routes stop next to the Education Campus; see the route map on the Salamanca public transport website.</li></ul>`,
  },
  listsEn: {},
};
