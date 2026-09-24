import { describe, expect, it } from "vitest";
import { madridParts, madridToIso } from "@/lib/madrid-time";

describe("madridToIso", () => {
  it("convierte la hora de pared de Madrid a UTC en invierno y en verano", () => {
    expect(madridToIso("2026-01-15", "10:30")).toBe("2026-01-15T09:30:00.000Z");
    expect(madridToIso("2026-04-30", "16:00")).toBe("2026-04-30T14:00:00.000Z");
  });

  it("sin hora guarda las 00:00 de Madrid", () => {
    expect(madridToIso("2026-07-01")).toBe("2026-06-30T22:00:00.000Z");
    expect(madridToIso("2026-12-01", "")).toBe("2026-11-30T23:00:00.000Z");
  });

  it("acierta junto a los cambios de hora", () => {
    // 29-mar-2026: a las 02:00 pasan a ser las 03:00
    expect(madridToIso("2026-03-29", "01:30")).toBe("2026-03-29T00:30:00.000Z");
    expect(madridToIso("2026-03-29", "03:30")).toBe("2026-03-29T01:30:00.000Z");
    // Hora inexistente: se desplaza hacia delante (03:30)
    expect(madridToIso("2026-03-29", "02:30")).toBe("2026-03-29T01:30:00.000Z");
    // 25-oct-2026: a las 03:00 vuelven a ser las 02:00
    expect(madridToIso("2026-10-25", "01:30")).toBe("2026-10-24T23:30:00.000Z");
    expect(madridToIso("2026-10-25", "12:00")).toBe("2026-10-25T11:00:00.000Z");
  });
});

describe("madridParts", () => {
  it("devuelve fecha y hora en Madrid, sin hora si es medianoche", () => {
    expect(madridParts("2026-06-30T22:00:00.000Z")).toEqual({ date: "2026-07-01", time: "" });
    expect(madridParts("2026-04-30T14:00:00.000Z")).toEqual({ date: "2026-04-30", time: "16:00" });
    expect(madridParts(new Date("2026-01-15T23:30:00.000Z"))).toEqual({
      date: "2026-01-16",
      time: "00:30",
    });
  });

  it("ida y vuelta con el formulario del panel", () => {
    for (const date of ["2026-01-10", "2026-03-29", "2026-06-04", "2026-10-25", "2026-12-31"]) {
      for (const time of ["", "09:15", "16:30", "23:45"]) {
        expect(madridParts(madridToIso(date, time))).toEqual({ date, time });
      }
    }
  });
});
