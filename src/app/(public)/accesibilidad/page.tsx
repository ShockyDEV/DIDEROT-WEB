import { metadataBilingue } from "@/lib/metadata";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { getBlock } from "@/lib/content-blocks-service";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

export const generateMetadata = metadataBilingue(
  {
    title: "Declaración de accesibilidad",
    description:
      "Declaración de accesibilidad del sitio web de DIDEROT, Grupo de Investigación Reconocido de la Universidad de Salamanca, conforme al RD 1112/2018.",
  },
  {
    title: "Accessibility statement",
    description:
      "Accessibility statement for the website of DIDEROT, a Recognised Research Group of the University of Salamanca, in accordance with Royal Decree 1112/2018.",
  },
);

export const dynamic = "force-dynamic";

// Textos fijos en ambos idiomas (el contenido largo llega ya traducido
// desde el servicio de bloques: Contenido → Páginas → Páginas legales).
const T = {
  es: {
    inicio: "Inicio",
    breadcrumb: "Accesibilidad",
    titulo: "Declaración de accesibilidad",
  },
  en: {
    inicio: "Home",
    breadcrumb: "Accessibility",
    titulo: "Accessibility statement",
  },
} as const;

export default async function AccesibilidadPage() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  const contenido = await getBlock("legal", "accesibilidad");

  return (
    <section>
      <div className="mx-auto max-w-[800px] px-6 pb-16 pt-12">
        <div className="mb-5">
          <Breadcrumb
            items={[
              { label: t.inicio, href: href("/") },
              { label: t.breadcrumb },
            ]}
          />
        </div>
        <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-ink">
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
