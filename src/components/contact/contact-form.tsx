"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CONTACT_SUBJECTS } from "@/lib/validations";
import { withLocale, type Locale } from "@/lib/locale";

const inputClass =
  "h-[42px] rounded-md border border-gray-300 bg-surface-card px-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25";

const labelClass = "text-sm font-medium text-gray-700";

function Required() {
  return (
    <span className="text-diderot-amber" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

// Textos fijos del formulario en ambos idiomas. Los valores del select se
// envían siempre en español (son los que valida la API); solo cambia la
// etiqueta visible.
const SUBJECT_LABELS_EN: Record<(typeof CONTACT_SUBJECTS)[number], string> = {
  "Formación del profesorado": "Teacher training",
  "Investigación y grupos": "Research and groups",
  Doctorado: "PhD programme",
  "Reserva de espacios": "Room booking",
  "Revista EKS": "EKS journal",
  Otro: "Other",
};

const T = {
  es: {
    ariaForm: "Formulario de contacto",
    escribenos: "Escríbenos",
    plazo: "Te responderemos en un plazo de 2–3 días hábiles.",
    nombre: "Nombre y apellidos",
    correo: "Correo electrónico",
    asunto: "Asunto",
    mensaje: "Mensaje",
    gdprAcepto: "He leído y acepto la",
    gdprPolitica: "política de privacidad",
    gdprResto:
      ". Los datos se tratarán únicamente para responder a esta consulta, conforme al RGPD y a la normativa de protección de datos de la Universidad de Salamanca.",
    enviar: "Enviar mensaje",
    enviando: "Enviando…",
    copia: "Recibirás copia en tu correo",
    exitoToast: "Mensaje enviado. Te responderemos en 2–3 días hábiles.",
    errorGenerico: "No se pudo enviar el mensaje",
    enviadoTitulo: "Mensaje enviado",
    enviadoTexto:
      "Gracias por escribirnos. La Secretaría del IUCE te responderá en un plazo de 2–3 días hábiles. Recibirás una copia en tu correo.",
    otroMensaje: "Enviar otro mensaje",
  },
  en: {
    ariaForm: "Contact form",
    escribenos: "Write to us",
    plazo: "We will reply within 2–3 working days.",
    nombre: "Full name",
    correo: "Email",
    asunto: "Subject",
    mensaje: "Message",
    gdprAcepto: "I have read and accept the",
    gdprPolitica: "privacy policy",
    gdprResto:
      ". Your data will be processed solely to answer this enquiry, in accordance with the GDPR and the University of Salamanca's data protection regulations.",
    enviar: "Send message",
    enviando: "Sending…",
    copia: "You will receive a copy by email",
    exitoToast: "Message sent. We will reply within 2–3 working days.",
    errorGenerico: "The message could not be sent",
    enviadoTitulo: "Message sent",
    enviadoTexto:
      "Thank you for writing to us. The IUCE Secretariat will reply within 2–3 working days. You will receive a copy by email.",
    otroMensaje: "Send another message",
  },
} as const;

/**
 * Formulario «Escríbenos» de la página de contacto. Envía a /api/contact,
 * que registra el mensaje y lo remite a la Secretaría por email.
 */
export function ContactForm({
  privacyUrl = "https://www.usal.es/proteccion-de-datos",
  locale = "es",
}: Readonly<{ privacyUrl?: string; locale?: Locale }>) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const t = T[locale];
  // Enlace del aviso de privacidad: las rutas internas (p. ej. /aviso-legal)
  // llevan el prefijo de idioma; las URL externas se dejan tal cual.
  const rawPrivacyUrl = privacyUrl || "https://www.usal.es/proteccion-de-datos";
  const privacyHref = rawPrivacyUrl.startsWith("/")
    ? withLocale(rawPrivacyUrl, locale)
    : rawPrivacyUrl;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
          gdpr: data.get("gdpr") === "on",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? t.errorGenerico);
      }
      setSent(true);
      form.reset();
      toast.success(t.exitoToast);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.errorGenerico);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        className="flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-surface-card p-8 shadow-sm"
        role="status"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 text-success-700">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-gray-900">{t.enviadoTitulo}</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {t.enviadoTexto}
        </p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          {t.otroMensaje}
        </Button>
      </div>
    );
  }

  return (
    <form
      aria-label={t.ariaForm}
      onSubmit={handleSubmit}
      className="flex flex-col gap-[18px] rounded-xl border border-gray-200 bg-surface-card p-8 shadow-sm"
    >
      <div>
        <h2 className="mb-1 text-xl font-bold text-gray-900">
          {t.escribenos}
        </h2>
        <p className="text-sm text-gray-500">{t.plazo}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="c-nombre" className={labelClass}>
            {t.nombre}
            <Required />
          </label>
          <input
            id="c-nombre"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="c-email" className={labelClass}>
            {t.correo}
            <Required />
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-asunto" className={labelClass}>
          {t.asunto}
          <Required />
        </label>
        <select id="c-asunto" name="subject" required className={inputClass}>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {locale === "en" ? SUBJECT_LABELS_EN[s] : s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="c-mensaje" className={labelClass}>
          {t.mensaje}
          <Required />
        </label>
        <textarea
          id="c-mensaje"
          name="message"
          rows={6}
          required
          minLength={10}
          className="resize-y rounded-md border border-gray-300 bg-surface-card p-3 text-sm text-gray-900 outline-none transition-colors focus:border-diderot-violet focus:ring-2 focus:ring-diderot-violet/25"
        />
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id="c-rgpd"
          name="gdpr"
          type="checkbox"
          required
          className="mt-[3px] h-4 w-4 accent-diderot-indigo"
        />
        <label
          htmlFor="c-rgpd"
          className="text-xs leading-relaxed text-gray-500"
        >
          {t.gdprAcepto}{" "}
          <a
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-diderot-violet hover:underline"
          >
            {t.gdprPolitica}
          </a>
          {t.gdprResto}
          <Required />
        </label>
      </div>

      <div className="flex items-center gap-3.5 pt-1.5">
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? t.enviando : t.enviar}
        </Button>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t.copia}
        </span>
      </div>
    </form>
  );
}
