import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { getBlock } from "@/lib/content-blocks-service";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

export function generateMetadata(): Metadata {
  const en = getLocale() === "en";
  return {
    title: en ? "Legal notice" : "Aviso legal",
    description: en
      ? "Legal notice for the IUCE website, University of Salamanca."
      : "Aviso legal del sitio web del IUCE, Universidad de Salamanca.",
    robots: { index: false },
  };
}

export const dynamic = "force-dynamic";

// Textos fijos en ambos idiomas (el contenido largo llega ya traducido
// desde el servicio de bloques).
const T = {
  es: { inicio: "Inicio", titulo: "Aviso legal" },
  en: { inicio: "Home", titulo: "Legal notice" },
} as const;

export default async function AvisoLegalPage() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  const contenido = await getBlock("legal", "aviso-legal");

  return (
    <section>
      <div className="mx-auto max-w-[800px] px-6 pb-16 pt-12">
        <div className="mb-5">
          <Breadcrumb
            items={[
              { label: t.inicio, href: href("/") },
              { label: t.titulo },
            ]}
          />
        </div>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-ink">
          {t.titulo}
        </h1>
        <div
          className="page-block text-base leading-relaxed text-gray-600 [&_a]:text-diderot-violet [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_li]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: contenido }}
        />
      </div>
    </section>
  );
}
