/**
 * Tipos de evento de DIDEROT. El valor guardado en Event.type es siempre el
 * español (también el del filtro ?tipo= de /eventos); en inglés solo cambia
 * la etiqueta visible. Los eventos en sí viven en la base de datos (panel →
 * Eventos): aquí ya no hay contenido semilla.
 *
 * Seguro para componentes de cliente: el panel puede usar EVENT_TYPES para
 * su selector y para validar (z.enum(EVENT_TYPES)).
 */
export const EVENT_TYPES = [
  "Seminario",
  "Jornada",
  "Congreso",
  "Concierto",
  "Taller",
  "Conferencia",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_EN: Record<string, string> = {
  Seminario: "Seminar",
  Jornada: "Study day",
  Congreso: "Conference",
  Concierto: "Concert",
  Taller: "Workshop",
  // «Conferencia» en español es una charla, no un congreso.
  Conferencia: "Lecture",
};

/** Etiqueta del tipo de evento según idioma (tipos desconocidos, tal cual). */
export function eventTypeLabel(type: string, locale: "es" | "en"): string {
  return locale === "en" ? (EVENT_TYPE_EN[type] ?? type) : type;
}
