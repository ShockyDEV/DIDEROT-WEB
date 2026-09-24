import { z } from "zod";

/**
 * Asuntos del formulario de contacto: los propios de un grupo de
 * investigación. El valor que se envía, se valida y se guarda es siempre el
 * español; en /en solo cambia la etiqueta visible (CONTACT_SUBJECT_EN).
 */
export const CONTACT_SUBJECTS = [
  "Colaboración en investigación",
  "Doctorado y TFG/TFM",
  "Transferencia y empresas",
  "Medios de comunicación",
  "Participación en eventos",
  "Otro",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

/** Etiqueta en inglés de cada asunto (formulario y autorespuesta en EN). */
export const CONTACT_SUBJECT_EN: Record<ContactSubject, string> = {
  "Colaboración en investigación": "Research collaboration",
  "Doctorado y TFG/TFM": "PhD and bachelor's or master's theses",
  "Transferencia y empresas": "Knowledge transfer and companies",
  "Medios de comunicación": "Media enquiries",
  "Participación en eventos": "Taking part in events",
  Otro: "Other",
};

/**
 * Atajos para llegar al formulario con el asunto ya elegido desde otras
 * páginas: /contacto?asunto=doctorado (claves cortas y estables en la URL).
 */
export const CONTACT_SUBJECT_KEYS: Record<string, ContactSubject> = {
  colaboracion: "Colaboración en investigación",
  doctorado: "Doctorado y TFG/TFM",
  transferencia: "Transferencia y empresas",
  medios: "Medios de comunicación",
  eventos: "Participación en eventos",
  otro: "Otro",
};

/**
 * Campo trampa (honeypot) del formulario: invisible para las personas, los
 * robots de spam lo rellenan. La API descarta en silencio lo que lo traiga.
 */
export const HONEYPOT_FIELD = "website";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indica tu nombre y apellidos")
    .max(120, "El nombre es demasiado largo")
    // Una sola línea: el nombre acaba en el asunto del aviso por correo.
    .transform((s) => s.replace(/\s+/g, " ")),
  email: z.string().trim().email("Correo electrónico no válido").max(200),
  subject: z.enum(CONTACT_SUBJECTS, {
    errorMap: () => ({ message: "Selecciona un asunto" }),
  }),
  message: z
    .string()
    .trim()
    .min(10, "Cuéntanos tu consulta (mínimo 10 caracteres)")
    .max(5000, "El mensaje es demasiado largo"),
  gdpr: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
  // Idioma de la página desde la que se escribe (idioma de la autorespuesta).
  locale: z.enum(["es", "en"]).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Enlace apto para un `href` a partir de un valor escrito en el panel (listas
 * editables, web de un evento…): solo http(s), mailto, rutas internas («/…»)
 * y anclas («#…»). Lo demás —javascript:, data:, rutas «//otro-sitio»— se
 * descarta (null), para que una cuenta del panel comprometida no pueda
 * colar scripts en la web pública. Un dominio sin esquema («www.x.es») se
 * completa con https://.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Los navegadores ignoran tabuladores y saltos de línea dentro de una URL
  // («java\nscript:»): se quitan antes de comprobar nada.
  const url = value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!url) return null;
  if (url.startsWith("#")) return url;
  if (url.startsWith("/")) {
    // «//host» y «/\host» serían enlaces a otro sitio.
    return url.startsWith("//") || url.startsWith("/\\") ? null : url;
  }
  if (/^(https?:\/\/|mailto:)/i.test(url)) {
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(?:[/?#]|$)/i.test(url)) {
    return `https://${url}`;
  }
  return null;
}

/** ¿Es una ruta de este mismo sitio («/uploads/…», «/images/…»)? */
export function isLocalPath(value: string): boolean {
  return (
    value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
  );
}
