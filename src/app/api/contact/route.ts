import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  contactAutoReplyEmail,
  contactNotifyEmail,
  emailAttachments,
} from "@/lib/email";

/**
 * Formulario de contacto: valida, registra el mensaje en la BD (bandeja del
 * admin) y lo envía por email a la Secretaría vía Resend, con autorespuesta
 * al remitente. El envío de email es tolerante a fallos: si Resend no está
 * configurado (desarrollo), el mensaje queda registrado igualmente.
 */
export async function POST(request: Request) {
  // Anti-spam: 5 mensajes por IP cada 15 minutos.
  if (!rateLimit(`contact:${clientIp(request)}`, 5, 15 * 60_000)) {
    return NextResponse.json(
      { error: "Demasiados mensajes seguidos. Espera unos minutos." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición no válido" },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos no válidos" },
      { status: 400 },
    );
  }

  const { name, email, subject, message } = parsed.data;

  // 1) Registro en la bandeja del panel de administración
  try {
    await prisma.contactMessage.create({
      data: { name, email, subject, body: message },
    });
  } catch (e) {
    console.error("[contact] Error al guardar el mensaje:", e);
    return NextResponse.json(
      { error: "No se pudo registrar el mensaje. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  // 2) Email a Secretaría + autorespuesta (si Resend está configurado)
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && !apiKey.includes("placeholder")) {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.EMAIL_FROM ?? "IUCE <onboarding@resend.dev>";
      const to = process.env.CONTACT_TO ?? "iuce@usal.es";

      // El SDK de Resend devuelve los errores de API en `error` (no lanza):
      // los registramos para saber si el envío llegó de verdad a salir.
      const notifyMail = contactNotifyEmail({ name, email, subject, message });
      const notify = await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: notifyMail.subject,
        html: notifyMail.html,
        text: notifyMail.text,
        attachments: emailAttachments(),
      });
      if (notify.error) {
        console.error("[contact] Resend rechazó el aviso a Secretaría:", notify.error);
      } else {
        console.log(`[contact] Aviso a Secretaría enviado (id ${notify.data?.id})`);
      }

      const autoMail = contactAutoReplyEmail({ name, subject, message });
      const auto = await resend.emails.send({
        from,
        to: email,
        subject: autoMail.subject,
        html: autoMail.html,
        text: autoMail.text,
        attachments: emailAttachments(),
      });
      if (auto.error) {
        console.error("[contact] Resend rechazó la autorespuesta:", auto.error);
      } else {
        console.log(`[contact] Autorespuesta enviada (id ${auto.data?.id})`);
      }
    } catch (e) {
      // El mensaje ya está registrado: no hacemos fallar la petición.
      console.error("[contact] Error al enviar email:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
