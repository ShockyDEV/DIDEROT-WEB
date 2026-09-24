"use client";

import { Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";
import { pick, type Locale } from "@/lib/locale";

const btnClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-surface-card text-gray-600 transition-colors hover:border-brand-400 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page";

/**
 * Fila «Compartir» del detalle de noticia: X, LinkedIn y copiar enlace.
 */
export function ShareRow({
  title,
  locale = "es",
}: Readonly<{ title: string; locale?: Locale }>) {
  function shareUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  function openShare(base: string) {
    const url = `${base}${encodeURIComponent(shareUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success(pick(locale, "Enlace copiado", "Link copied"));
    } catch {
      toast.error(
        pick(locale, "No se pudo copiar el enlace", "Could not copy the link"),
      );
    }
  }

  return (
    <div className="my-0 flex items-center gap-2.5 border-y border-gray-100 py-5">
      <span className="mr-1 text-sm font-medium text-gray-600">
        {pick(locale, "Compartir", "Share")}
      </span>
      <button
        type="button"
        aria-label={pick(locale, "Compartir en X", "Share on X")}
        onClick={() =>
          openShare(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=`,
          )
        }
        className={btnClass}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={pick(locale, "Compartir en LinkedIn", "Share on LinkedIn")}
        onClick={() =>
          openShare("https://www.linkedin.com/sharing/share-offsite/?url=")
        }
        className={btnClass}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125M7.119 20.452H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={pick(locale, "Copiar enlace", "Copy link")}
        onClick={copyLink}
        className={btnClass}
      >
        <LinkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
