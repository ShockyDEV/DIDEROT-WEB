import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { getBlock } from "@/lib/content-blocks-service";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

export function generateMetadata(): Metadata {
  const en = getLocale() === "en";
  return {
    title: en ? "Cookie policy" : "Política de cookies",
    description: en
      ? "Cookie policy for the DIDEROT website: only technical cookies for the administration panel and first-party statistics without cookies."
      : "Política de cookies del sitio web de DIDEROT: solo cookies técnicas del panel de administración y estadísticas propias sin cookies.",
    robots: { index: false },
  };
}

export const dynamic = "force-dynamic";

// Textos fijos en ambos idiomas (el contenido largo llega ya traducido
// desde el servicio de bloques: Contenido → Páginas → Páginas legales).
const T = {
  es: { inicio: "Inicio", titulo: "Política de cookies" },
  en: { inicio: "Home", titulo: "Cookie policy" },
} as const;

export default async function PoliticaCookiesPage() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  const cookies = await getBlock("legal", "cookies");

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
        <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
          {t.titulo}
        </h1>
        <div
          className="page-block text-base leading-relaxed text-gray-600 [&_a]:text-diderot-violet [&_a]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:text-[0.9em] [&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_li]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: cookies }}
        />
      </div>
    </section>
  );
}
