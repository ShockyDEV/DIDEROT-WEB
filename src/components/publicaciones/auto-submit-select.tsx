"use client";

import { useRef, type SelectHTMLAttributes } from "react";

/**
 * <select> que envía su formulario al elegir con ratón o dedo (filtro por
 * año de /publicaciones). Sin JS sigue funcionando con el botón «Buscar».
 *
 * Con teclado NO se envía en cada flecha (en Windows cada pulsación cambia
 * el valor y recargaría la página a mitad de la elección, WCAG 3.2.2): ahí
 * se confirma con Intro o con el botón del formulario.
 */
export function AutoSubmitSelect(
  props: Readonly<SelectHTMLAttributes<HTMLSelectElement>>,
) {
  const viaTeclado = useRef(false);
  return (
    <select
      {...props}
      onPointerDown={() => {
        viaTeclado.current = false;
      }}
      onKeyDown={(e) => {
        viaTeclado.current = true;
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }}
      onChange={(e) => {
        if (!viaTeclado.current) e.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
