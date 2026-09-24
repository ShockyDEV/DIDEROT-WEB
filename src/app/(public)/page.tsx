import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { CoverImage } from "@/components/news/cover-image";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { getPublishedNews } from "@/lib/news-service";
import { categoryLabel } from "@/lib/content/news";
import {
  getBlock,
  getBlockText,
  getListBlock,
} from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { getHiddenPaths } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde los servicios de bloques/noticias).
const T = {
  es: {
    conoceInstituto: "Conoce el Instituto",
    planFormacion: "Plan de Formación Docente",
    altEdificio: "Fachada del Edificio Solís, sede del IUCE",
    estadisticasTitulo: "Estadísticas del IUCE",
    explorarEstadisticas: "Explorar las estadísticas",
    actualidad: "Actualidad",
    verTodas: "Ver todas las noticias →",
    visitarRevista: "Visitar la revista",
  },
  en: {
    conoceInstituto: "Discover the Institute",
    planFormacion: "Teaching Training Plan",
    altEdificio: "Façade of the Solís Building, home of the IUCE",
    estadisticasTitulo: "IUCE in figures",
    explorarEstadisticas: "Explore the statistics",
    actualidad: "Latest news",
    verTodas: "See all news →",
    visitarRevista: "Visit the journal",
  },
} as const;

export default async function HomePage() {
  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Últimas 3 noticias + hero editable desde el panel (Contenido → Páginas).
  const [
    latestNews,
    heroEyebrow,
    heroTitulo,
    heroParrafo,
    hitosHero,
    quickAccess,
    eksDescripcion,
    cifras,
    memoriaEyebrow,
    estadisticasTeaser,
  ] = await Promise.all([
    getPublishedNews().then((n) => n.slice(0, 3)),
    getBlockText("inicio", "hero-eyebrow"),
    getBlockText("inicio", "hero-titulo"),
    getBlock("inicio", "hero-parrafo"),
    getListBlock("inicio", "list:hitos-hero"),
    getListBlock("inicio", "list:accesos-rapidos"),
    getBlock("inicio", "eks-descripcion"),
    // Mismos contadores y periodo que la página de estadísticas (una fuente)
    getListBlock("estadisticas", "list:kpis"),
    getBlockText("estadisticas", "hero-eyebrow"),
    getBlock("inicio", "estadisticas-teaser"),
  ]);

  // Una página oculta (panel → Visualización) tampoco se ofrece como acceso
  // rápido: llevaría a un 404.
  const hiddenPaths = await getHiddenPaths();
  const accesos = quickAccess.filter(
    (item) => !hiddenPaths.includes(String(item.enlace ?? "")),
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-surface-card">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-[68px] pt-16 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <p className="mb-3.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                {heroEyebrow}
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mb-[18px] text-balance text-4xl font-bold leading-tight tracking-tight text-ink sm:text-[44px]">
                {heroTitulo}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <div
                className="page-block mb-7 max-w-[52ch] text-base leading-relaxed text-gray-600"
                // Bloque editable desde el gestor (inicio:hero-parrafo)
                dangerouslySetInnerHTML={{ __html: heroParrafo }}
              />
            </Reveal>
            <Reveal delay={300} className="flex flex-wrap items-center gap-3">
              <Link
                href={href("/instituto")}
                className={buttonClassName({ size: "lg" })}
              >
                {t.conoceInstituto}
              </Link>
              <Link
                href={href("/formacion")}
                className={buttonClassName({ variant: "outline", size: "lg" })}
              >
                {t.planFormacion}
              </Link>
            </Reveal>
            <Reveal
              delay={420}
              className="mt-8 flex flex-wrap gap-6 border-t border-gray-100 pt-5 text-xs text-gray-500"
            >
              {hitosHero.map((h) => {
                const Icon = iconFor(h.icon);
                return (
                  <span
                    key={String(h.texto)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-diderot-amber"
                      aria-hidden="true"
                    />
                    {String(h.texto)}
                  </span>
                );
              })}
            </Reveal>
          </div>

          <Reveal from="right" delay={250} className="relative">
            <div className="relative h-[380px] w-full overflow-hidden rounded-xl">
              <Image
                src="/images/edificio-solis.jpg"
                alt={t.altEdificio}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="pointer-events-none absolute bottom-[22px] left-0 rounded-r-md bg-diderot-indigo px-3.5 py-2 text-xs text-white">
              Paseo de Canalejas 169 · Edificio Solís, 1.ª planta
            </div>
          </Reveal>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="border-y border-gray-200 bg-surface-page">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
          {accesos.map((item, i) => {
            const Icon = iconFor(item.icon);
            const enlace = String(item.enlace ?? "#");
            const external = enlace.startsWith("http");
            return (
              <Reveal key={enlace + i} delay={i * 80} className="h-full">
                <Link
                  href={external ? enlace : href(enlace)}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="card-lift flex h-full flex-col gap-2.5 rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm hover:border-brand-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
                >
                  <span className="flex h-[38px] w-[38px] items-center justify-center rounded-md bg-diderot-pale">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        item.destacado ? "text-diderot-amber" : "text-ink",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-base font-semibold text-gray-900">
                    {String(item.titulo)}
                  </span>
                  <span className="text-xs leading-snug text-gray-500">
                    {String(item.descripcion)}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Estadísticas del IUCE (teaser hacia /estadisticas). Si esa página
          está oculta desde el panel, el teaser entero desaparece con ella:
          son las mismas cifras y su botón llevaría a un 404. */}
      {hiddenPaths.includes("/estadisticas") ? null : (
        <section className="border-b border-gray-200 bg-surface-tinted">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-7 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[38ch]">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
                {memoriaEyebrow}
              </p>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                {t.estadisticasTitulo}
              </h2>
              <div
                className="page-block mb-4 text-sm leading-relaxed text-gray-600"
                dangerouslySetInnerHTML={{ __html: estadisticasTeaser }}
              />
              <Link
                href={href("/estadisticas")}
                className={buttonClassName() + " gap-1.5"}
              >
                {t.explorarEstadisticas}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid w-full grid-cols-3 gap-3.5 lg:w-auto">
              {cifras.slice(0, 3).map((k, i) => (
                <Reveal key={i} from="right" delay={i * 110}>
                  <div className="rounded-xl border border-gray-200 bg-surface-card p-5 text-center shadow-sm lg:w-[168px]">
                    <p className="text-[26px] font-bold leading-tight text-ink">
                      <CountUp value={String(k.cifra)} />
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-gray-500">
                      {String(k.texto)}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Actualidad */}
      <section className="bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-14">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {t.actualidad}
            </h2>
            <Link
              href={href("/noticias")}
              className="text-sm font-medium text-diderot-violet hover:underline"
            >
              {t.verTodas}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((item, i) => (
              <Reveal key={item.slug} delay={i * 90} className="h-full">
              <Link href={href(`/noticias/${item.slug}`)} className="group block h-full">
                <article className="card-lift flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface-card shadow-sm hover:border-brand-400 hover:shadow-md">
                  <CoverImage
                    src={item.coverImage}
                    alt={item.photoLabel}
                    zoom
                    className="h-[150px] w-full"
                  />
                  <div className="flex flex-col gap-2 px-5 pb-5 pt-[18px]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 font-medium text-ink">
                        {categoryLabel(item.category, locale)}
                      </span>
                      <span className="text-gray-500">{item.dateDisplay}</span>
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-normal text-gray-600">
                      {item.excerpt}
                    </p>
                  </div>
                </article>
              </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Banda EKS */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <Reveal from="scale" className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-[18px]">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-md bg-diderot-indigo text-sm font-bold text-white">
              EKS
            </span>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Education in the Knowledge Society
              </p>
              <div
                className="page-block mt-0.5 text-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: eksDescripcion }}
              />
            </div>
          </div>
          <a
            href="https://revistas.usal.es/index.php/eks"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonClassName({ variant: "outline" }),
              "flex-none gap-1.5",
            )}
          >
            {t.visitarRevista}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </Reveal>
      </section>
    </>
  );
}
