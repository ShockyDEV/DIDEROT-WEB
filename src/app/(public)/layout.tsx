import { SiteHeader } from "@/components/layout/site-header";
import { InstitutionalFooter } from "@/components/layout/institutional-footer";
import { getHiddenPaths } from "@/lib/page-visibility";
import { getLocale } from "@/lib/locale-server";
import { pick } from "@/lib/locale";

// El layout consulta en cada petición qué páginas están ocultas; sin esto se
// cachearía y el menú seguiría mostrando una página recién ocultada.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Páginas ocultas desde el panel (Visualización): fuera del menú.
  const hiddenPaths = await getHiddenPaths();
  const locale = getLocale();

  return (
    <>
      <a
        href="#contenido"
        className="sr-only rounded-br-lg bg-ink px-[18px] py-2.5 text-sm text-white focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-[100]"
      >
        {pick(locale, "Saltar al contenido principal", "Skip to main content")}
      </a>
      <SiteHeader hiddenPaths={hiddenPaths} />
      <main id="contenido">{children}</main>
      <InstitutionalFooter />
    </>
  );
}
