/**
 * Datos fijos del sitio (fuente única para cabecera, pie, SEO, feed y
 * correos). Lo editable por el personal (textos de páginas, correo de
 * contacto visible, etc.) vive en los bloques del gestor; aquí solo queda lo
 * estructural. Seguro para componentes de cliente (sin imports de servidor).
 */

/** URL pública canónica, sin barra final. En producción: https://diderot.usal.es */
export const SITE_URL = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://diderot.usal.es"
).replace(/\/+$/, "");

export const SITE = {
  /** Acrónimo tal y como se escribe en textos corridos. */
  shortName: "DIDEROT",
  name: "Didácticas Digitales de la Expresión Musical y las Artes Performativas",
  nameEn: "Digital Didactics of Musical Expression and the Performing Arts",
  /** Rótulo institucional corto (antetítulos, pie, metadatos). */
  kind: "Grupo de Investigación Reconocido de la Universidad de Salamanca",
  kindEn: "Recognised Research Group of the University of Salamanca",
  /** Coordinación del grupo. */
  lead: "Javier Félix Merchán Sánchez-Jara",
  /** Correo de contacto público por defecto (editable en el panel). */
  email: "javiermerchan@usal.es",
  /** Sede: el grupo está adscrito al IUCE (Edificio Solís). */
  address: "Instituto Universitario de Ciencias de la Educación (IUCE) · Paseo de Canalejas, 169 · Edificio Solís",
  city: "37008 Salamanca",
  /** Redes y enlaces institucionales. */
  links: {
    usal: "https://www.usal.es",
    iuce: "https://iuce.usal.es",
    doctorado: "https://knowledgesociety.usal.es",
    portal: "https://produccioncientifica.usal.es",
    twitter: "https://x.com/DiderotGir",
  },
} as const;
