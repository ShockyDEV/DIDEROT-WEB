import { describe, expect, it } from "vitest";
import {
  dateBlock,
  formatEventDate,
  formatEventTime,
  isPastEvent,
  madridDay,
  splitEvents,
} from "@/lib/events-service";
import { EVENT_TYPES, eventTypeLabel } from "@/lib/content/events";

// Jornada I del Seminario: 30-abr-2026 a las 16:00 en Madrid (14:00 UTC).
const JORNADA_I = new Date("2026-04-30T14:00:00Z");

describe("madridDay", () => {
  it("usa el día de Madrid, no el del servidor (UTC)", () => {
    // 22:30 UTC del 9 de junio = 00:30 del 10 de junio en Madrid (CEST).
    expect(madridDay(new Date("2026-06-09T22:30:00Z"))).toBe("2026-06-10");
  });
});

describe("isPastEvent / splitEvents", () => {
  const ev = (id: string, start: string, end?: string) => ({
    id,
    startsAt: new Date(start),
    endsAt: end ? new Date(end) : null,
  });

  it("el día del propio evento sigue siendo «próximo»", () => {
    const now = new Date("2026-04-30T20:00:00Z"); // 22:00 en Madrid
    expect(isPastEvent({ startsAt: JORNADA_I, endsAt: null }, now)).toBe(false);
    const nextDay = new Date("2026-05-01T08:00:00Z");
    expect(isPastEvent({ startsAt: JORNADA_I, endsAt: null }, nextDay)).toBe(true);
  });

  it("un evento de varios días no pasa hasta que termina", () => {
    const now = new Date("2026-11-13T10:00:00Z");
    const congreso = ev("c", "2026-11-12T08:00:00Z", "2026-11-14T16:00:00Z");
    expect(isPastEvent(congreso, now)).toBe(false);
  });

  it("ordena próximos (ascendente) y celebrados (descendente)", () => {
    const now = new Date("2026-09-24T10:00:00Z");
    const { upcoming, past } = splitEvents(
      [
        ev("jun", "2026-06-04T14:00:00Z"),
        ev("dic", "2026-12-01T09:00:00Z"),
        ev("abr", "2026-04-30T14:00:00Z"),
        ev("oct", "2026-10-15T09:00:00Z"),
      ],
      now,
    );
    expect(upcoming.map((e) => e.id)).toEqual(["oct", "dic"]);
    expect(past.map((e) => e.id)).toEqual(["jun", "abr"]);
  });
});

describe("formato de fechas", () => {
  it("bloque de fecha en español e inglés", () => {
    expect(dateBlock(JORNADA_I, "es")).toEqual({ day: "30", month: "ABR" });
    expect(dateBlock(JORNADA_I, "en")).toEqual({ day: "30", month: "APR" });
  });

  it("fecha corta y rangos", () => {
    expect(formatEventDate(JORNADA_I, null, "es")).toBe("30 abr 2026");
    expect(
      formatEventDate(
        new Date("2026-11-12T08:00:00Z"),
        new Date("2026-11-14T16:00:00Z"),
        "es",
      ),
    ).toBe("12–14 nov 2026");
    // Mismo día con hora de fin: no es un rango.
    expect(
      formatEventDate(JORNADA_I, new Date("2026-04-30T17:00:00Z"), "es"),
    ).toBe("30 abr 2026");
  });

  it("hora en Madrid; medianoche = sin hora", () => {
    expect(formatEventTime(JORNADA_I, "es")).toBe("16:00");
    expect(formatEventTime(new Date("2026-06-10T14:30:00Z"), "en")).toBe("16:30");
    expect(formatEventTime(new Date("2026-06-09T22:00:00Z"), "es")).toBeNull();
  });
});

describe("tipos de evento", () => {
  it("todos tienen etiqueta en inglés y los desconocidos se muestran tal cual", () => {
    for (const type of EVENT_TYPES) {
      expect(eventTypeLabel(type, "en")).not.toBe("");
    }
    expect(eventTypeLabel("Concierto", "en")).toBe("Concert");
    expect(eventTypeLabel("Mesa redonda", "en")).toBe("Mesa redonda");
    expect(eventTypeLabel("Jornada", "es")).toBe("Jornada");
  });
});
