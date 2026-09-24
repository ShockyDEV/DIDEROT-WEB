import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

describe("Button", () => {
  it("renderiza con la variante por defecto (navy)", () => {
    render(<Button>Conoce el Instituto</Button>);
    const btn = screen.getByRole("button", { name: "Conoce el Instituto" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("bg-diderot-indigo");
  });

  it("aplica la variante primary (rojo USAL)", () => {
    render(<Button variant="primary">Nueva noticia</Button>);
    expect(
      screen.getByRole("button", { name: "Nueva noticia" }).className,
    ).toContain("bg-diderot-amber");
  });

  it("es type=button por defecto (no envía formularios)", () => {
    render(<Button>Acción</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

describe("Badge", () => {
  it("renderiza la variante info con fondo pale", () => {
    render(<Badge variant="info">Congresos</Badge>);
    const badge = screen.getByText("Congresos");
    expect(badge.className).toContain("bg-diderot-pale");
  });
});

describe("ImagePlaceholder", () => {
  it("expone la etiqueta como imagen accesible", () => {
    render(<ImagePlaceholder label="Foto del Edificio Solís" />);
    expect(
      screen.getByRole("img", { name: "Foto del Edificio Solís" }),
    ).toBeInTheDocument();
  });
});

describe("InitialsAvatar", () => {
  it("es decorativo (aria-hidden) y muestra las iniciales", () => {
    const { container } = render(<InitialsAvatar initials="SO" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.textContent).toBe("SO");
  });
});
