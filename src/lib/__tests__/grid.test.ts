import { describe, expect, it } from "vitest";
import { columnasSinHuecos } from "@/lib/grid";

describe("columnasSinHuecos", () => {
  it("usa filas de cuatro cuando dejan menos huecos", () => {
    expect(columnasSinHuecos(4)).toBe(4);
    expect(columnasSinHuecos(7)).toBe(4);
    expect(columnasSinHuecos(8)).toBe(4);
  });

  it("se queda en tres si cuatro no mejora (o empata)", () => {
    for (const n of [0, 1, 2, 3, 5, 6, 9, 10, 11]) {
      expect(columnasSinHuecos(n)).toBe(3);
    }
  });
});
