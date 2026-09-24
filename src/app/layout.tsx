import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { getLocale } from "@/lib/locale-server";
import { ToastProvider } from "@/components/toast-provider";
import { SITE, SITE_URL } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const en = getLocale() === "en";
  // Descripción SEO en español editable en el panel (Configuración).
  const { seoDescription } = await getSiteSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: en
        ? `DIDEROT - ${SITE.nameEn}`
        : `DIDEROT - ${SITE.name}`,
      template: "%s | DIDEROT",
    },
    description: en
      ? "DIDEROT is a Recognised Research Group of the University of Salamanca, attached to the IUCE, working on new methodologies and digital didactics at the intersection of music education, the arts and technology."
      : seoDescription,
    openGraph: {
      type: "website",
      siteName: "DIDEROT",
      locale: en ? "en_GB" : "es_ES",
    },
  };
}

// Datos estructurados del grupo (Google, agregadores académicos). El correo
// sale de Configuración (panel), como el resto de datos de contacto.
const organizationJsonLd = (email: string) => ({
  "@context": "https://schema.org",
  "@type": "ResearchOrganization",
  name: `DIDEROT: ${SITE.name}`,
  alternateName: "DIDEROT",
  url: SITE_URL,
  logo: `${SITE_URL}/images/diderot-logo.png`,
  email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Paseo de Canalejas, 169. Edificio Solís (IUCE)",
    addressLocality: "Salamanca",
    postalCode: "37008",
    addressCountry: "ES",
  },
  parentOrganization: {
    "@type": "ResearchOrganization",
    name: "Instituto Universitario de Ciencias de la Educación (IUCE)",
    url: SITE.links.iuce,
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Universidad de Salamanca",
      url: SITE.links.usal,
    },
  },
  sameAs: [SITE.links.twitter],
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { email } = await getSiteSettings();
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-page text-gray-600 antialiased">
        <ThemeScript />
        {children}
        <ToastProvider />
        <script
          type="application/ld+json"
          // JSON-LD; «<» escapado para que un dato editado en el panel no pueda
          // cerrar la etiqueta <script>.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd(email)).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
