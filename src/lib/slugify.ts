/**
 * Convierte un título en un slug de URL: minúsculas, sin acentos ni signos,
 * palabras separadas por guiones. Igual que el patrón de mupes.
 *
 * "XXII Congreso: Tecnología y Sociedad" → "xxii-congreso-tecnologia-y-sociedad"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita diacríticos (á → a)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // solo letras, números, espacios y guiones
    .trim()
    .replace(/[\s_]+/g, "-") // espacios → guiones
    .replace(/-+/g, "-") // colapsa guiones repetidos
    .replace(/^-|-$/g, ""); // sin guiones en los extremos
}
