import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { getLocale } from "@/lib/locale-server";
import { ToastProvider } from "@/components/toast-provider";
import { SITE, SITE_URL } from "@/lib/site";

export function generateMetadata(): Metadata {
  const en = getLocale() === "en";
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
      : "DIDEROT es un Grupo de Investigación Reconocido de la Universidad de Salamanca, adscrito al IUCE, que investiga nuevas metodologías y didácticas digitales en la intersección entre la educación musical, el arte y la vanguardia tecnológica.",
    openGraph: {
      type: "website",
      siteName: "DIDEROT",
      locale: en ? "en_GB" : "es_ES",
    },
  };
}

// Datos estructurados del grupo (Google, agregadores académicos).
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ResearchOrganization",
  name: `DIDEROT: ${SITE.name}`,
  alternateName: "DIDEROT",
  url: SITE_URL,
  logo: `${SITE_URL}/images/diderot-logo.png`,
  email: SITE.email,
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-page text-gray-600 antialiased">
        <ThemeScript />
        {children}
        <ToastProvider />
        <script
          type="application/ld+json"
          // Contenido estático definido arriba; no incluye datos de usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
      </body>
    </html>
  );
}
