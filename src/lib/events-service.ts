import { prisma } from "@/lib/prisma";
import { eventTypeLabel } from "@/lib/content/events";
import type { Locale } from "@/lib/locale";
import { isLocalPath, safeHref } from "@/lib/validations";

/**
 * Servicio de eventos para las páginas públicas (Eventos y, si la portada lo
 * necesita, Inicio). Lee la tabla Event del panel y devuelve los eventos ya
 * localizados y separados en próximos y celebrados. Sin BD devuelve listas
 * vacías: las páginas pintan su estado vacío en vez de romper.
 *
 * Todas las fechas se interpretan en hora de Madrid, con independencia de la
 * zona horaria del servidor (en producción suele ser UTC).
 */
const TZ = "Europe/Madrid";

export interface PublicEvent {
  id: string;
  /** Título en el idioma de la página (titleEn con respaldo al español). */
  title: string;
  /** Entradilla en el idioma de la página ("" si no hay). */
  description: string;
  /** Valor guardado (español): sirve para filtrar. */
  type: string;
  /** Tipo en el idioma de la página. */
  typeLabel: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  /** Web del evento, ya saneada (solo http/https o ruta interna). */
  url: string | null;
  /** Cartel o imagen, ya saneado (ruta local o https). */
  image: string | null;
  /** Programa en PDF, ya saneado (solo http/https o ruta interna). */
  programUrl: string | null;
  /** Slug de la crónica, solo si la noticia existe y está publicada. */
  newsSlug: string | null;
  cancelled: boolean;
}

export interface PublicEvents {
  /** Próximos, del más cercano al más lejano. */
  upcoming: PublicEvent[];
  /** Celebrados, del más reciente al más antiguo. */
  past: PublicEvent[];
}

function dtf(locale: Locale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
    ...options,
    timeZone: TZ,
  });
}

/** Día de calendario en Madrid, en formato ISO (AAAA-MM-DD). */
export function madridDay(date: Date): string {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(date);
}

/**
 * ¿Evento ya celebrado? Se deriva de las fechas (nadie tiene que cambiar el
 * estado a mano): cuenta como pasado cuando su fin —o su inicio, si no tiene
 * fin— es anterior a hoy. El día del propio evento sigue entre los próximos.
 */
export function isPastEvent(
  e: { startsAt: Date; endsAt: Date | null },
  now: Date = new Date(),
): boolean {
  return madridDay(e.endsAt ?? e.startsAt) < madridDay(now);
}

/** Separa y ordena: próximos (ascendente) y celebrados (descendente). */
export function splitEvents<T extends { startsAt: Date; endsAt: Date | null }>(
  rows: T[],
  now: Date = new Date(),
): { upcoming: T[]; past: T[] } {
  const upcoming = rows
    .filter((e) => !isPastEvent(e, now))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = rows
    .filter((e) => isPastEvent(e, now))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  return { upcoming, past };
}

/** Bloque de fecha: día («30») y mes corto en mayúsculas («ABR» / «APR»). */
export function dateBlock(
  date: Date,
  locale: Locale,
): { day: string; month: string } {
  return {
    day: dtf(locale, { day: "numeric" }).format(date),
    month: dtf(locale, { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase(),
  };
}

/**
 * Fecha corta o rango: «30 abr 2026», «12–14 nov 2026»,
 * «30 abr – 2 may 2026» (en inglés, «30 Apr 2026»…).
 */
export function formatEventDate(
  start: Date,
  end: Date | null,
  locale: Locale,
): string {
  const f = dtf(locale, { day: "numeric", month: "short", year: "numeric" });
  const out =
    end && madridDay(end) !== madridDay(start)
      ? f.formatRange(start, end)
      : f.format(start);
  return out.replace(/\./g, "");
}

/** Fecha larga con el día de la semana: «jueves, 30 de abril de 2026». */
export function formatEventDateLong(
  start: Date,
  end: Date | null,
  locale: Locale,
): string {
  const f = dtf(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const out =
    end && madridDay(end) !== madridDay(start)
      ? f.formatRange(start, end)
      : f.format(start);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * Hora de inicio («16:00»). Un evento guardado a medianoche se considera sin
 * hora concreta (jornada completa) y devuelve null.
 */
export function formatEventTime(date: Date, locale: Locale): string | null {
  const time = dtf(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return time === "00:00" ? null : time;
}

/** Imagen utilizable: ruta local («/uploads/…», «/images/…») o https. */
function safeImage(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (isLocalPath(v)) return v;
  return /^https:\/\//i.test(v) ? safeHref(v) : null;
}

/** Web del evento: solo http(s) o rutas internas (nunca anclas ni mailto). */
function safeEventUrl(value: string | null): string | null {
  const href = safeHref(value);
  if (!href) return null;
  return /^https?:\/\//i.test(href) || isLocalPath(href) ? href : null;
}

/**
 * Eventos publicados en la web, localizados y separados en próximos y
 * celebrados. Los cancelados se incluyen marcados (`cancelled`), para que
 * quien tuviera la fecha apuntada vea que ya no se celebra.
 */
export async function getPublicEvents(locale: Locale): Promise<PublicEvents> {
  try {
    const rows = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });

    // «Leer la crónica» solo si la noticia enlazada existe y está publicada:
    // un slug mal escrito en el panel no debe llevar a un 404.
    const slugs = [
      ...new Set(
        rows
          .map((r) => r.newsSlug?.trim())
          .filter((s): s is string => Boolean(s)),
      ),
    ];
    let published = new Set<string>();
    if (slugs.length > 0) {
      const news = await prisma.news.findMany({
        where: { slug: { in: slugs }, status: "PUBLISHED" },
        select: { slug: true },
      });
      published = new Set(news.map((n) => n.slug));
    }

    const en = locale === "en";
    const items: PublicEvent[] = rows.map((r) => {
      const slug = r.newsSlug?.trim() ?? "";
      return {
        id: r.id,
        title: (en ? r.titleEn?.trim() : null) || r.title,
        description:
          ((en ? r.descriptionEn?.trim() : null) || r.description?.trim()) ??
          "",
        type: r.type,
        typeLabel: eventTypeLabel(r.type, locale),
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        location: r.location?.trim() || null,
        url: safeEventUrl(r.url),
        image: safeImage(r.image),
        programUrl: safeEventUrl(r.programUrl),
        newsSlug: published.has(slug) ? slug : null,
        cancelled: r.status === "CANCELLED",
      };
    });
    return splitEvents(items);
  } catch {
    // BD no disponible: la página enseña su estado vacío.
    return { upcoming: [], past: [] };
  }
}
