/**
 * Columnas de una rejilla en pantallas anchas (3 o 4): las que dejen menos
 * huecos en la última fila; a igualdad, 3. Así no quedan fichas huérfanas
 * con 4, 7 u 8 elementos. Tailwind necesita las clases literales, así que
 * quien llama elige entre `…:grid-cols-3` y `…:grid-cols-4` con el resultado.
 */
export function columnasSinHuecos(n: number): 3 | 4 {
  const huecos = (c: number) => (c - (n % c)) % c;
  return n > 1 && huecos(4) < huecos(3) ? 4 : 3;
}
