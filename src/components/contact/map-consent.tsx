"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, MapPin } from "lucide-react";
import { MapEmbed } from "@/components/ui/map-embed";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/locale";

const T = {
  es: {
    verMapa: "Ver el mapa",
    aviso:
      "El mapa se carga desde Google Maps, que puede usar sus propias cookies.",
    abrir: "Abrir en Google Maps",
    nuevaVentana: "(se abre en una ventana nueva)",
    foto: "Patio del Edificio Solís (IUCE), en Salamanca",
  },
  en: {
    verMapa: "Show the map",
    aviso: "The map is loaded from Google Maps, which may use its own cookies.",
    abrir: "Open in Google Maps",
    nuevaVentana: "(opens in a new window)",
    foto: "Courtyard of the Solís Building (IUCE), Salamanca",
  },
} as const;

/**
 * Mapa de la sede con carga bajo demanda («dos clics»). Google Maps puede
 * instalar sus propias cookies en cuanto se carga el iframe; como la web no
 * usa cookies de terceros ni banner de consentimiento, el mapa solo se pide
 * a Google cuando la persona pulsa «Ver el mapa». Mientras tanto se muestra
 * una foto del Edificio Solís y un enlace directo a Google Maps.
 */
export function MapConsent({
  query,
  title,
  locale = "es",
  className,
}: Readonly<{
  /** Búsqueda de Google Maps (dirección de la sede). */
  query: string;
  /** Título accesible del iframe. */
  title: string;
  locale?: Locale;
  className?: string;
}>) {
  const t = T[locale];
  const [show, setShow] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // El botón desaparece al cargar el mapa: el foco pasa al mapa para que el
  // teclado no vuelva al principio de la página.
  useEffect(() => {
    if (show) mapRef.current?.focus();
  }, [show]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (show) {
    return (
      <div
        ref={mapRef}
        tabIndex={-1}
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet"
      >
        <MapEmbed query={query} title={title} className={className} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-end overflow-hidden rounded-xl border border-gray-200 bg-gray-100",
        className,
      )}
    >
      <Image
        src="/images/edificio-solis.jpg"
        alt={t.foto}
        fill
        sizes="(max-width: 1024px) 100vw, 480px"
        className="object-cover"
      />
      {/* Degradado para que el texto blanco se lea sobre la foto (AA). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/5"
      />
      <div className="relative flex flex-col items-start gap-2.5 p-5">
        <button
          type="button"
          onClick={() => setShow(true)}
          className={cn(buttonClassName(), "gap-1.5")}
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {t.verMapa}
        </button>
        <p className="text-xs leading-relaxed text-white/90">
          {t.aviso}{" "}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-white underline underline-offset-2 hover:no-underline"
          >
            {t.abrir}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">{t.nuevaVentana}</span>
          </a>
        </p>
      </div>
    </div>
  );
}
