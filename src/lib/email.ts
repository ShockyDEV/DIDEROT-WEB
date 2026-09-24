/**
 * Plantillas de correo de DIDEROT (misma estética que las del IUCE, con la
 * identidad del grupo): fina barra ámbar, cabecera índigo con el logo en una
 * caja blanca, cuerpo blanco y pie institucional DIDEROT · IUCE · USAL.
 * Pensadas para clientes de correo reales: maquetación con tablas, estilos
 * en línea y color sólido de respaldo (Outlook no entiende gradientes ni CSS
 * externo).
 *
 * El logo se INCRUSTA en el propio correo (adjunto inline con `cid:`), así se
 * ve siempre, sin depender de que el servidor sea accesible desde la bandeja
 * del destinatario. Los routers deben añadir `attachments: emailAttachments()`.
 *
 * Cada builder devuelve { subject, html, text } — siempre se envían ambas
 * versiones (HTML + texto plano de respaldo).
 */
import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/lib/locale";
import { SITE, SITE_URL } from "@/lib/site";
import { CONTACT_SUBJECT_EN, type ContactSubject } from "@/lib/validations";

const LOGO_FILE = "diderot-logo.png";
const LOGO_CID = "diderot-logo";

/** Logo en base64 (leído una vez). null si no se encuentra el fichero. */
let logoCache: string | null | undefined;
function logoBase64(): string | null {
  if (logoCache !== undefined) return logoCache;
  try {
    const p = path.join(process.cwd(), "public", "images", LOGO_FILE);
    logoCache = fs.readFileSync(p).toString("base64");
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/**
 * Adjunto inline del logo para incluir en `resend.emails.send({ attachments })`.
 * Vacío si no se pudo leer el logo (el correo se envía igualmente).
 */
export function emailAttachments(): Array<{
  filename: string;
  content: string;
  inlineContentId: string;
}> {
  const b64 = logoBase64();
  return b64
    ? [{ filename: LOGO_FILE, content: b64, inlineContentId: LOGO_CID }]
    : [];
}

/** Paleta del logo (valores de tema claro: el correo no tiene modo oscuro). */
const C = {
  indigo: "#29235c",
  indigoDeep: "#1f1a47",
  violet: "#4a3fb4",
  // Ámbar puro del logo: solo decorativo (barra superior).
  gold: "#df8602",
  lavender: "#cfc9f7",
  ink: "#29235c",
  text: "#374151",
  soft: "#6b7280",
  line: "#e5e7eb",
  page: "#f3f4f6",
  card: "#f9fafb",
};

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Ficha de datos: filas etiqueta/valor sobre fondo claro. */
function infoCard(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .map(
      (r) => `<tr>
        <td style="padding:11px 0 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:.4px; text-transform:uppercase; color:${C.soft};">${r.label}</td>
      </tr>
      <tr>
        <td style="padding:2px 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:15px; color:${C.ink};">${r.value}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px; background:${C.card}; border:1px solid ${C.line}; border-radius:10px;">
    <tr><td style="padding:6px 20px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table></td></tr>
  </table>`;
}

/** Bloque de mensaje citado (para el cuerpo del contacto). */
function quote(text: string): string {
  const html = escapeHtml(text).replace(/\n/g, "<br>");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px;">
    <tr><td style="padding:14px 18px; background:${C.card}; border-left:3px solid ${C.violet}; border-radius:6px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:${C.text};">${html}</td></tr>
  </table>`;
}

/** Rótulo pequeño en mayúsculas (sobre la cita del mensaje). */
function label(text: string): string {
  return `<p style="margin:12px 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:.4px; text-transform:uppercase; color:${C.soft};">${text}</p>`;
}

interface LayoutOpts {
  lang: Locale;
  preheader: string;
  section: string;
  heading: string;
  bodyHtml: string;
  footerNote: string;
}

/** Envoltorio común: barra ámbar + cabecera índigo + cuerpo + pie. */
function layout({
  lang,
  preheader,
  section,
  heading,
  bodyHtml,
  footerNote,
}: LayoutOpts): string {
  const en = lang === "en";
  // Logo incrustado (cid:) si se pudo leer el fichero; si no, por URL absoluta.
  const logoSrc = logoBase64()
    ? `cid:${LOGO_CID}`
    : `${SITE_URL}/images/${LOGO_FILE}`;
  const kind = en ? SITE.kindEn : SITE.kind;
  const usal = en ? "University of Salamanca" : "Universidad de Salamanca";
  const building = en ? "Solís Building" : "Edificio Solís";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0; padding:0; background:${C.page};">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(16,24,40,.08);">

        <!-- Barra ámbar (acento del logo) -->
        <tr><td height="4" bgcolor="${C.gold}" style="height:4px; line-height:4px; font-size:0; background:${C.gold};">&nbsp;</td></tr>

        <!-- Cabecera índigo -->
        <tr>
          <td align="center" bgcolor="${C.indigo}" style="background-color:${C.indigo}; background-image:linear-gradient(135deg,${C.indigoDeep} 0%,${C.indigo} 50%,${C.violet} 135%); padding:28px 24px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" bgcolor="#ffffff" style="background:#ffffff; border-radius:10px; padding:12px 18px;">
                <img src="${logoSrc}" width="176" alt="DIDEROT" style="display:block; border:0; width:176px; height:auto;">
              </td></tr>
            </table>
            <div style="font-family:Arial,Helvetica,sans-serif; font-size:20px; font-weight:bold; color:#ffffff; padding-top:16px;">${escapeHtml(section)}</div>
            <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:${C.lavender}; padding-top:4px;">${escapeHtml(kind)}</div>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:30px 34px 8px;">
            <h1 style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:21px; line-height:1.3; color:${C.ink};">${escapeHtml(heading)}</h1>
            ${bodyHtml}
          </td>
        </tr>

        <!-- Pie -->
        <tr>
          <td style="padding:20px 34px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="border-top:1px solid ${C.line}; padding-top:16px; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:${C.soft};">
                <strong style="color:${C.ink};">DIDEROT</strong> · IUCE · ${usal}<br>
                Paseo de Canalejas, 169 · ${building} · 37008 Salamanca<br>
                <span style="color:#9ca3af;">${escapeHtml(footerNote)}</span>
              </td></tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const P = (t: string) =>
  `<p style="margin:0 0 14px; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.65; color:${C.text};">${t}</p>`;

// ─── Builders ────────────────────────────────────────────────────────────

/**
 * Aviso al grupo de un mensaje recibido por el formulario de contacto.
 * Siempre en español (lo lee el equipo); indica si se escribió desde /en.
 */
export function contactNotifyEmail(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale?: Locale;
}): EmailContent {
  const idioma = opts.locale === "en" ? "Inglés (web en inglés)" : "Español";
  const bodyHtml = `
    ${P("Se ha recibido un nuevo mensaje a través del formulario de contacto de la web:")}
    ${infoCard([
      { label: "Nombre", value: escapeHtml(opts.name) },
      {
        label: "Correo",
        value: `<a href="mailto:${escapeHtml(opts.email)}" style="color:${C.violet};">${escapeHtml(opts.email)}</a>`,
      },
      { label: "Asunto", value: escapeHtml(opts.subject) },
      { label: "Idioma", value: idioma },
    ])}
    ${label("Mensaje")}
    ${quote(opts.message)}
  `;
  return {
    subject: `[Web DIDEROT] ${opts.subject} — ${opts.name}`,
    html: layout({
      lang: "es",
      preheader: `Mensaje de ${opts.name}: ${opts.subject}`,
      section: "Web · Contacto",
      heading: "Nuevo mensaje desde la web",
      bodyHtml,
      footerNote: `Responde directamente a este correo para contestar a ${opts.name}.`,
    }),
    text: `Nuevo mensaje desde el formulario de contacto de la web de DIDEROT:

Nombre: ${opts.name}
Correo: ${opts.email}
Asunto: ${opts.subject}
Idioma: ${idioma}

${opts.message}

—
Responde directamente a este correo para contestar a ${opts.name}.`,
  };
}

/**
 * Autorespuesta al remitente del formulario de contacto, en el idioma de la
 * página desde la que escribió.
 */
export function contactAutoReplyEmail(opts: {
  name: string;
  subject: string;
  message: string;
  locale?: Locale;
  /** Correo de contacto del grupo (panel → Configuración). */
  contactEmail?: string;
}): EmailContent {
  const en = opts.locale === "en";
  const subjectLabel = en
    ? (CONTACT_SUBJECT_EN[opts.subject as ContactSubject] ?? opts.subject)
    : opts.subject;
  const email = opts.contactEmail ?? SITE.email;

  if (en) {
    const bodyHtml = `
      ${P(`Hello ${escapeHtml(opts.name)},`)}
      ${P("We have received your enquiry and will get back to you as soon as possible. Thank you for writing to us.")}
      ${label(`Copy of your message — ${escapeHtml(subjectLabel)}`)}
      ${quote(opts.message)}
    `;
    return {
      subject: "We have received your message — DIDEROT",
      html: layout({
        lang: "en",
        preheader: "We have received your enquiry and will reply as soon as possible.",
        section: "Contact",
        heading: "We have received your message",
        bodyHtml,
        footerNote: `Automatic message — please do not reply to this address. Write to us at ${email}.`,
      }),
      text: `Hello ${opts.name},

We have received your enquiry («${subjectLabel}») and will get back to you as soon as possible.

Copy of your message:
${opts.message}

DIDEROT - ${SITE.nameEn}
IUCE · University of Salamanca · ${email}`,
    };
  }

  const bodyHtml = `
    ${P(`Hola ${escapeHtml(opts.name)}:`)}
    ${P("Hemos recibido tu consulta y te responderemos lo antes posible. Gracias por escribirnos.")}
    ${label(`Copia de tu mensaje — ${escapeHtml(subjectLabel)}`)}
    ${quote(opts.message)}
  `;
  return {
    subject: "Hemos recibido tu mensaje — DIDEROT",
    html: layout({
      lang: "es",
      preheader: "Hemos recibido tu consulta; te responderemos lo antes posible.",
      section: "Contacto",
      heading: "Hemos recibido tu mensaje",
      bodyHtml,
      footerNote: `Correo automático — no respondas a esta dirección. Escríbenos a ${email}.`,
    }),
    text: `Hola ${opts.name}:

Hemos recibido tu consulta («${subjectLabel}») y te responderemos lo antes posible.

Copia de tu mensaje:
${opts.message}

DIDEROT - ${SITE.name}
IUCE · Universidad de Salamanca · ${email}`,
  };
}
