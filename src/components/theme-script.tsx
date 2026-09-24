/**
 * Script anti-parpadeo del tema. Se ejecuta de forma síncrona antes de pintar
 * para aplicar la clase `.dark` al <html> según la preferencia guardada
 * (`localStorage['diderot-theme']`), evitando el destello de tema claro al cargar
 * en modo oscuro. Se inyecta en el <head> del layout raíz.
 */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('diderot-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (t === 'light') {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
