/**
 * Plantillas de correo del IUCE (misma estética que la web de reservas):
 * cabecera azul con el logo en una caja blanca, cuerpo blanco, botón rojo y
 * pie institucional. Pensadas para clientes de correo reales: maquetación con
 * tablas, estilos en línea y color sólido de respaldo (Outlook no entiende
 * gradientes ni CSS externo).
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

const LOGO_CID = "iuce-logo";

/** Logo en base64 (leído una vez). null si no se encuentra el fichero. */
let logoCache: string | null | undefined;
function logoBase64(): string | null {
  if (logoCache !== undefined) return logoCache;
  try {
    const p = path.join(process.cwd(), "public", "images", "iuce-logo.png");
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
    ? [{ filename: "iuce-logo.png", content: b64, inlineContentId: LOGO_CID }]
    : [];
}

const C = {
  blueDark: "#1b3a5c",
  blue: "#3b7dd8",
  red: "#c8102e",
  redDark: "#a00d24",
  ink: "#1b3a5c",
  text: "#374151",
  soft: "#6b7280",
  pale: "#eff4fb",
  line: "#e5e7eb",
  page: "#f3f4f6",
  card: "#f9fafb",
};

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** URL pública de la app (para el logo y los enlaces absolutos del correo). */
function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Botón «a prueba de balas»: enlace con relleno y color de fondo. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0;">
    <tr><td align="center" bgcolor="${C.red}" style="border-radius:8px;">
      <a href="${href}" target="_blank" style="display:inline-block; padding:13px 30px; font-family:Arial,Helvetica,sans-serif; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">${label}</a>
    </td></tr>
  </table>`;
}

/** Ficha de datos: filas etiqueta/valor sobre fondo claro (como reservas). */
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
    <tr><td style="padding:14px 18px; background:${C.card}; border-left:3px solid ${C.blue}; border-radius:6px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:${C.text};">${html}</td></tr>
  </table>`;
}

interface LayoutOpts {
  preheader: string;
  section: string;
  heading: string;
  bodyHtml: string;
  footerNote: string;
}

/** Envoltorio común: cabecera + cuerpo + pie. */
function layout({
  preheader,
  section,
  heading,
  bodyHtml,
  footerNote,
}: LayoutOpts): string {
  const base = appBaseUrl();
  // Logo incrustado (cid:) si se pudo leer el fichero; si no, por URL absoluta.
  const logoSrc = logoBase64()
    ? `cid:${LOGO_CID}`
    : `${base}/images/iuce-logo.png`;
  return `<!doctype html>
<html lang="es">
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

        <!-- Cabecera azul -->
        <tr>
          <td align="center" bgcolor="${C.blueDark}" style="background-color:${C.blueDark}; background-image:linear-gradient(135deg,#13293f 0%,${C.blueDark} 45%,${C.blue} 130%); padding:30px 24px 26px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" bgcolor="#ffffff" style="background:#ffffff; border-radius:10px; padding:12px 16px;">
                <img src="${logoSrc}" width="132" alt="IUCE" style="display:block; border:0; width:132px; height:auto;">
              </td></tr>
            </table>
            <div style="font-family:Arial,Helvetica,sans-serif; font-size:20px; font-weight:bold; color:#ffffff; padding-top:16px;">${escapeHtml(section)}</div>
            <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#cdddf1; padding-top:4px;">Instituto Universitario de Ciencias de la Educación</div>
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
                <strong style="color:${C.ink};">IUCE</strong> · Universidad de Salamanca<br>
                Paseo de Canalejas 169 · Edificio Solís · 37008 Salamanca<br>
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

/** Aviso a Secretaría de un mensaje recibido por el formulario de contacto. */
export function contactNotifyEmail(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): EmailContent {
  const bodyHtml = `
    ${P("Se ha recibido un nuevo mensaje a través del formulario de contacto de la web:")}
    ${infoCard([
      { label: "Nombre", value: escapeHtml(opts.name) },
      {
        label: "Correo",
        value: `<a href="mailto:${escapeHtml(opts.email)}" style="color:${C.blue};">${escapeHtml(opts.email)}</a>`,
      },
      { label: "Asunto", value: escapeHtml(opts.subject) },
    ])}
    <p style="margin:12px 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:.4px; text-transform:uppercase; color:${C.soft};">Mensaje</p>
    ${quote(opts.message)}
  `;
  return {
    subject: `[Web IUCE] ${opts.subject} — ${opts.name}`,
    html: layout({
      preheader: `Mensaje de ${opts.name}: ${opts.subject}`,
      section: "Web · Contacto",
      heading: "Nuevo mensaje desde la web",
      bodyHtml,
      footerNote: `Responde directamente a este correo para contestar a ${opts.name}.`,
    }),
    text: `Nuevo mensaje desde el formulario de contacto de la web:

Nombre: ${opts.name}
Correo: ${opts.email}
Asunto: ${opts.subject}

${opts.message}

—
Responde directamente a este correo para contestar a ${opts.name}.`,
  };
}

/** Autorespuesta al remitente del formulario de contacto. */
export function contactAutoReplyEmail(opts: {
  name: string;
  subject: string;
  message: string;
}): EmailContent {
  const bodyHtml = `
    ${P(`Hola ${escapeHtml(opts.name)}:`)}
    ${P("Hemos recibido tu consulta y te responderemos en un plazo de 2–3 días hábiles. Gracias por escribirnos.")}
    <p style="margin:12px 0 4px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:.4px; text-transform:uppercase; color:${C.soft};">Copia de tu mensaje — ${escapeHtml(opts.subject)}</p>
    ${quote(opts.message)}
  `;
  return {
    subject: "Hemos recibido tu mensaje — IUCE",
    html: layout({
      preheader: "Hemos recibido tu consulta; te responderemos en 2–3 días hábiles.",
      section: "Contacto",
      heading: "Hemos recibido tu mensaje",
      bodyHtml,
      footerNote:
        "Correo automático — no respondas a esta dirección. Escríbenos a iuce@usal.es o al +34 923 294 634.",
    }),
    text: `Hola ${opts.name}:

Hemos recibido tu consulta («${opts.subject}») y te responderemos en un plazo de 2–3 días hábiles.

Copia de tu mensaje:
${opts.message}

IUCE - Instituto Universitario de Ciencias de la Educación
Universidad de Salamanca · +34 923 294 634 · iuce@usal.es`,
  };
}
