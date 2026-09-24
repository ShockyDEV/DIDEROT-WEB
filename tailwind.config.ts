import type { Config } from "tailwindcss";

/**
 * Tokens de diseño de DIDEROT (misma arquitectura que la web del IUCE).
 *
 * La capa semántica (grises, marca, superficies, sombras) se respalda con
 * variables CSS definidas en `src/app/globals.css`, con overrides bajo la
 * clase `.dark`. Así el modo oscuro funciona escribiendo clases normales de
 * Tailwind (`bg-surface-card`, `text-gray-600`, `border-gray-200`…), sin
 * duplicar `dark:` por todo el markup.
 *
 * Paleta sacada del logotipo: índigo #29235C (titulares, botones, bandas) y
 * ámbar #DF8602 (acento). El ámbar del logo no llega a 4,5:1 sobre blanco,
 * así que como TEXTO se usa `diderot-amber` (ámbar tostado, AA en ambos
 * temas) y el ámbar puro (`diderot-gold`) queda para lo decorativo.
 *
 * Se mantienen estáticas las escalas `brand`, `success`, `warning` y `danger`
 * porque se usan con modificadores de opacidad (p. ej. `hover:bg-brand-700/90`),
 * que requieren color literal.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutros: respaldados por variables → cambian con el tema
        gray: {
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          200: "var(--gray-200)",
          300: "var(--gray-300)",
          400: "var(--gray-400)",
          500: "var(--gray-500)",
          600: "var(--gray-600)",
          700: "var(--gray-700)",
          800: "var(--gray-800)",
          900: "var(--gray-900)",
          950: "var(--gray-950)",
        },
        // Marca DIDEROT (cambian de tono en oscuro)
        diderot: {
          // Índigo del logo: botones, bandas oscuras, titulares
          indigo: "var(--diderot-indigo)",
          // Violeta de interacción: enlaces, foco, acentos interactivos
          violet: "var(--diderot-violet)",
          // Tinte suave para chips, iconos y bandas claras
          pale: "var(--diderot-pale)",
          // Ámbar para TEXTO de acento (antetítulos, iconos, ítem activo)
          amber: "var(--diderot-amber)",
          "amber-dark": "var(--diderot-amber-dark)",
          // Ámbar puro del logo: solo decorativo (barra superior, ondas…)
          gold: "var(--diderot-gold)",
        },
        // Rampa índigo de marca (estática, admite opacidad)
        brand: {
          50: "#F4F3FB",
          100: "#E8E6F6",
          400: "#9D95E3",
          500: "#5A4FC4",
          700: "#29235C",
          800: "#1F1A47",
        },
        success: { 50: "#ECFDF3", 500: "#12B76A", 700: "#027A48" },
        warning: { 50: "#FFFAEB", 500: "#F79009", 700: "#B54708" },
        danger: { 50: "#FEF3F2", 500: "#D92D20", 700: "#B42318" },
        // Superficies semánticas (valores propios en oscuro)
        surface: {
          page: "var(--surface-page)",
          card: "var(--surface-card)",
          tinted: "var(--surface-tinted)",
          inverse: "var(--surface-inverse)",
        },
        // Tinta de titulares/logo (índigo en claro → lavanda suave en oscuro)
        ink: "var(--brand-ink)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        "6xl": "72rem",
      },
      letterSpacing: {
        tight: "-0.02em",
        wider: "0.05em",
      },
    },
  },
  plugins: [],
};

export default config;
