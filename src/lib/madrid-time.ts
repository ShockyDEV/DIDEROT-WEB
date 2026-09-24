/**
 * Fechas y horas «de pared» en Madrid, sea cual sea la zona horaria del
 * navegador o del servidor (en producción suele ser UTC). Sin dependencias:
 * se usa tanto en el panel (componentes de cliente) como en el servidor.
 *
 * Convención de los eventos: sin hora se guardan a las 00:00 de Madrid y la
 * web no muestra hora (antes el panel los guardaba a las 09:00 UTC y la web
 * enseñaba «11:00» en cualquier evento).
 */
export const MADRID_TZ = "Europe/Madrid";

let formatter: Intl.DateTimeFormat | null = null;

function madridFormatter(): Intl.DateTimeFormat {
  formatter ??= new Intl.DateTimeFormat("en-CA", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return formatter;
}

function wallClock(date: Date) {
  const parts = madridFormatter().formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Desfase de Madrid respecto a UTC (ms) en un instante dado. */
function madridOffset(ms: number): number {
  const w = wallClock(new Date(ms));
  const asUtc = Date.UTC(
    Number(w.year),
    Number(w.month) - 1,
    Number(w.day),
    Number(w.hour),
    Number(w.minute),
    Number(w.second),
  );
  return Math.round((asUtc - ms) / 60_000) * 60_000;
}

/** Fecha (AAAA-MM-DD) y hora (hh:mm, o "" si es medianoche) en Madrid. */
export function madridParts(value: string | Date): { date: string; time: string } {
  const w = wallClock(typeof value === "string" ? new Date(value) : value);
  const time = `${w.hour}:${w.minute}`;
  return {
    date: `${w.year}-${w.month}-${w.day}`,
    time: time === "00:00" ? "" : time,
  };
}

/**
 * Instante UTC (ISO) de una fecha (AAAA-MM-DD) y hora (hh:mm, opcional) de
 * pared en Madrid, con el horario de verano de esa fecha. Una hora que no
 * existe (el salto de marzo) se desplaza hacia delante.
 */
export function madridToIso(date: string, time = ""): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = madridOffset(guess);
  let ts = guess - first;
  // Cerca de un cambio de hora el desfase del resultado puede ser otro.
  const second = madridOffset(ts);
  if (second !== first) ts = guess - second;
  return new Date(ts).toISOString();
}
