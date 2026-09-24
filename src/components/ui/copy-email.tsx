"use client";

import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/cn";
import { pick, type Locale } from "@/lib/locale";

/**
 * Correo con «copiar al portapapeles» (en vez de abrir el cliente de correo).
 * Al pulsar copia la dirección, cambia el icono a un check y muestra un aviso
 * abajo a la derecha. Pensado para contactar rápido con miembros del IUCE.
 */
export function CopyEmail({
  email,
  locale = "es",
  className,
}: Readonly<{ email: string; locale?: Locale; className?: string }>) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success(pick(locale, "Correo copiado al portapapeles", "Email copied to clipboard"), {
        position: "bottom-right",
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(pick(locale, "No se pudo copiar el correo", "Could not copy the email"), {
        position: "bottom-right",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={pick(locale, `Copiar ${email}`, `Copy ${email}`)}
      aria-label={pick(locale, `Copiar el correo ${email}`, `Copy the email ${email}`)}
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 text-sm text-diderot-violet transition-colors hover:text-diderot-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page rounded",
        className,
      )}
    >
      <Mail className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
      <span className="truncate">{email}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 flex-none text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy
          className="h-3.5 w-3.5 flex-none text-gray-500 transition-colors group-hover:text-diderot-violet"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
