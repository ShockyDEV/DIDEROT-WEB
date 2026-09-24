import { metadataBilingue } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Building2, Share2, UserRound } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { buttonClassName } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Reveal } from "@/components/ui/reveal";
import { ChartCard } from "@/components/stats/chart-card";
import { BarsChart, DonutChart, type Datum } from "@/components/stats/stat-charts";
import { GroupBadge, type MemberGroup } from "@/components/grupo/group-badge";
import { groups } from "@/lib/content/groups";
import { getBlock, getBlockText, getListBlock } from "@/lib/content-blocks-service";
import { iconFor } from "@/lib/icon-map";
import { prisma } from "@/lib/prisma";
import { withLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";

import { assertVisible, getHiddenPages } from "@/lib/page-visibility";

export const dynamic = "force-dynamic";

export const generateMetadata = metadataBilingue(
  {
    title: "Transferencia de conocimiento",
    description:
      "La transferencia de conocimiento es uno de los objetivos principales del IUCE: contratos y convenios (art. 60), formación a demanda, propiedad industrial y divulgación.",
  },
  {
    title: "Knowledge transfer",
    description:
      "Knowledge transfer is one of the IUCE’s main objectives: contracts and agreements (art. 60), tailor-made training, industrial property and outreach.",
  },
);

// Textos fijos de la página en ambos idiomas (el contenido editable llega ya
// traducido desde el servicio de bloques).
const T = {
  es: {
    inicio: "Inicio",
    transferencia: "Transferencia",
    eyebrow: "Investigación al servicio de la sociedad",
    titulo: "Transferencia de conocimiento",
    comoTransferimos: "Cómo transferimos",
    gtcConvocatoria: "Convocatoria GTC 2024/2025",
    gtcTitulo: "Grupos de Transferencia del Conocimiento",
    gtcAdscritos: "Adscritos al IUCE",
    gtcColaboracion: "Con participación de miembros del IUCE",
    gtcDireccion: "Dirección",
    gtcVinculado: "Vinculado a",
    datosTitulo: "La transferencia, en datos",
    verEstadisticas: "Ver todas las estadísticas",
    importeTitulo: "Importe contratado por año",
    importeInsight: "Contratos y convenios de transferencia (art. 60 LOSU)",
    importeSerie: "Importe",
    implicacionTitulo: "Grado de implicación del IUCE",
    implicacionInsight:
      "En 2 de cada 3 contratos, el trabajo es 100% del Instituto",
    contratosSerie: "Contratos",
    contratosCentro: "contratos",
    otcNombre: "Oficina de Transferencia de Conocimiento de la USAL",
    contactar: "Contactar con el IUCE",
  },
  en: {
    inicio: "Home",
    transferencia: "Knowledge transfer",
    eyebrow: "Research at the service of society",
    titulo: "Knowledge transfer",
    comoTransferimos: "How we transfer knowledge",
    gtcConvocatoria: "GTC 2024/2025 call",
    gtcTitulo: "Knowledge Transfer Groups",
    gtcAdscritos: "Attached to the IUCE",
    gtcColaboracion: "With participation of IUCE members",
    gtcDireccion: "Head",
    gtcVinculado: "Linked to",
    datosTitulo: "Knowledge transfer in figures",
    verEstadisticas: "See all the statistics",
    importeTitulo: "Contracted amount per year",
    importeInsight: "Knowledge transfer contracts and agreements (art. 60 LOSU)",
    importeSerie: "Amount",
    implicacionTitulo: "IUCE's degree of involvement",
    implicacionInsight:
      "In 2 out of 3 contracts, 100% of the work is the Institute's",
    contratosSerie: "Contracts",
    contratosCentro: "contracts",
    otcNombre: "Knowledge Transfer Office (OTC) of the USAL",
    contactar: "Contact the IUCE",
  },
} as const;

function num(v: unknown): number {
  const n = Number(String(v ?? "").trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toData(rows: Array<Record<string, unknown>>): Datum[] {
  return rows
    .filter((r) => String(r.etiqueta ?? "").trim() !== "")
    .map((r) => ({ label: String(r.etiqueta), value: num(r.valor) }));
}

export default async function TransferenciaPage() {
  await assertVisible("transferencia");

  const locale = getLocale();
  const t = T[locale];
  const href = (path: string) => withLocale(path, locale);
  // Si /estadisticas está oculta desde el panel, su enlace de entrada
  // desaparece (las gráficas propias de esta página se quedan).
  const estadisticasOculta = (await getHiddenPages()).has("estadisticas");
  // Textos editables (Contenido → Páginas → Transferencia). Las gráficas
  // leen las MISMAS listas que /estadisticas: un solo lugar que actualizar.
  const [
    intro,
    mision,
    gtcIntro,
    urlOtc,
    otcDescripcion,
    datosDescripcion,
    cta,
    vias,
    gtc,
    importe,
    implicacion,
  ] = await Promise.all([
    getBlock("transferencia", "intro"),
    getBlock("transferencia", "mision"),
    getBlock("transferencia", "gtc-intro"),
    getBlockText("transferencia", "url-otc"),
    getBlock("transferencia", "otc-descripcion"),
    getBlock("transferencia", "datos-descripcion"),
    getBlock("transferencia", "cta"),
    getListBlock("transferencia", "list:vias"),
    getListBlock("transferencia", "list:gtc"),
    getListBlock("estadisticas", "list:contratos-importe"),
    getListBlock("estadisticas", "list:contratos-implicacion"),
  ]);

  // Vínculo de cada GTC a su grupo de investigación (badge con logo). Si el
  // grupo no está en la web (p. ej. IDEA), se muestra el acrónimo a secas.
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
  const grupoPorAcronimo = (acr: string): MemberGroup | null => {
    const g = groups.find((gr) => norm(gr.acronym) === norm(acr));
    return g
      ? { acronym: g.acronym, name: g.name, logo: g.logo ?? null, url: g.url ?? null }
      : null;
  };
  const esAdscrito = (g: (typeof gtc)[number]) =>
    g.adscrito === true || g.adscrito === "true";
  const gtcAdscritos = gtc.filter(esAdscrito);
  const gtcColaboracion = gtc.filter((g) => !esAdscrito(g));

  // Retrato de la dirección de cada GTC: son miembros del IUCE, así que el
  // nombre se empareja con su ficha para usar su foto. Sin BD (o sin match
  // inequívoco), la tarjeta cae al icono genérico.
  let miembros: Array<{ name: string; photo: string | null }> = [];
  try {
    miembros = await prisma.member.findMany({
      where: { active: true },
      select: { name: true, photo: true },
    });
  } catch {
    // BD no disponible.
  }
  const sinTildes = (x: string) =>
    x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const fichaDirector = (nombre: string) => {
    const a = sinTildes(nombre).split(/[\s-]+/).filter(Boolean);
    const hits = miembros.filter((m) => {
      const b = sinTildes(m.name).split(/[\s-]+/).filter(Boolean);
      // Un nombre contiene al otro (la ficha puede omitir el segundo nombre).
      return a.every((x) => b.includes(x)) || b.every((x) => a.includes(x));
    });
    // Ante ambigüedad, mejor el icono que la foto de otra persona.
    return hits.length === 1 ? hits[0] : null;
  };
  const iniciales = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  const tarjetaGtc = (v: (typeof gtc)[number], i: number) => {
    const acr = String(v.acronimo ?? "").trim();
    const nombre = String(v.nombre ?? "").trim();
    const director = String(v.director ?? "").trim();
    const grupoAcr = String(v.grupo ?? "").trim();
    const grupo = grupoPorAcronimo(grupoAcr);
    const ficha = director ? fichaDirector(director) : null;
    const retrato = ficha?.photo ? (
      <Image
        src={ficha.photo}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 flex-none rounded-full object-cover"
      />
    ) : ficha ? (
      <InitialsAvatar
        initials={iniciales(ficha.name)}
        className="h-7 w-7 flex-none text-[10px]"
      />
    ) : (
      <UserRound
        className="h-4 w-4 flex-none text-gray-400"
        aria-hidden="true"
      />
    );
    return (
      <Reveal key={i} delay={i * 70} className="h-full">
        <article className="card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm hover:shadow-md">
          {acr ? (
            <span className="inline-flex w-fit items-center rounded-md bg-diderot-pale px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-diderot-indigo">
              {acr}
            </span>
          ) : null}
          <h4 className="text-base font-semibold leading-snug text-gray-900">
            {nombre}
          </h4>
          {director ? (
            <p className="flex items-center gap-2 text-sm text-gray-600">
              {retrato}
              <span>
                <span className="text-gray-500">{t.gtcDireccion}: </span>
                <span className="font-medium text-gray-800">{director}</span>
              </span>
            </p>
          ) : null}
          {grupoAcr ? (
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-500">{t.gtcVinculado}</span>
              {grupo ? (
                <GroupBadge group={grupo} />
              ) : (
                <span className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {grupoAcr}
                </span>
              )}
            </div>
          ) : null}
        </article>
      </Reveal>
    );
  };

  return (
    <>
      {/* Cabecera */}
      <section className="border-b border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 pb-11 pt-12">
          <div className="mb-3.5">
            <Breadcrumb
              items={[
                { label: t.inicio, href: href("/") },
                { label: t.transferencia },
              ]}
            />
          </div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {t.eyebrow}
          </p>
          <h1 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight text-ink">
            {t.titulo}
          </h1>
          <div
            className="page-block max-w-[80ch] text-base leading-relaxed text-gray-600"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        </div>
      </section>

      {/* Misión */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pt-14">
          <Reveal from="scale">
            <div className="rounded-xl border border-gray-200 border-l-[3px] border-l-diderot-amber bg-surface-tinted p-7">
              <div
                className="page-block max-w-[95ch] text-base leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: mision }}
              />
            </div>
          </Reveal>
        </div>

        {/* Vías de transferencia */}
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
            {t.comoTransferimos}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vias.map((v, i) => {
              const Icon = iconFor(v.icon);
              return (
                <Reveal key={i} delay={i * 90} className="h-full">
                  <article className="card-lift flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-surface-card p-6 shadow-sm hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-diderot-pale text-ink">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">
                      {String(v.titulo)}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {String(v.texto)}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Grupos de Transferencia del Conocimiento (GTC) */}
      {gtc.length > 0 ? (
        <section className="border-t border-gray-200 bg-surface-tinted">
          <div id="gtc" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-14">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-diderot-amber/10 text-diderot-amber">
                <Share2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-diderot-amber">
                {t.gtcConvocatoria}
              </p>
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">
              {t.gtcTitulo}
            </h2>
            <div
              className="page-block mb-9 max-w-[80ch] text-base leading-relaxed text-gray-600"
              dangerouslySetInnerHTML={{ __html: gtcIntro }}
            />

            {/* Subtítulos solo si conviven adscritos y colaboraciones; hoy
                todos los GTC están adscritos al IUCE → una sola rejilla. */}
            {gtcAdscritos.length > 0 && gtcColaboracion.length > 0 ? (
              <>
                <div className="mb-10">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {t.gtcAdscritos}
                  </h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {gtcAdscritos.map(tarjetaGtc)}
                  </div>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    {t.gtcColaboracion}
                  </h3>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {gtcColaboracion.map(tarjetaGtc)}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gtc.map(tarjetaGtc)}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* La transferencia, en datos */}
      <section className="border-y border-gray-200 bg-surface-card">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-gray-900">
                {t.datosTitulo}
              </h2>
              <div
                className="page-block max-w-[75ch] text-sm text-gray-500"
                dangerouslySetInnerHTML={{ __html: datosDescripcion }}
              />
            </div>
            {estadisticasOculta ? null : (
              <Link
                href={href("/estadisticas#transferencia")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-diderot-violet hover:underline"
              >
                {t.verEstadisticas}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title={t.importeTitulo} insight={t.importeInsight}>
              <BarsChart
                data={toData(importe)}
                name={t.importeSerie}
                format="euro"
                accent
              />
            </ChartCard>
            <ChartCard
              title={t.implicacionTitulo}
              insight={t.implicacionInsight}
              delay={90}
            >
              <DonutChart
                data={toData(implicacion)}
                name={t.contratosSerie}
                centerLabel={t.contratosCentro}
              />
            </ChartCard>
          </div>
        </div>
      </section>

      {/* OTC USAL */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-xl border border-gray-200 bg-surface-card p-7 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5 sm:items-center">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-diderot-indigo text-white">
                  <Building2 className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-semibold text-gray-900">
                    {t.otcNombre}
                  </p>
                  <div
                    className="page-block mt-0.5 max-w-[70ch] text-sm leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: otcDescripcion }}
                  />
                </div>
              </div>
              {urlOtc ? (
                <a
                  href={urlOtc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName({ variant: "outline" }) + " flex-none gap-1.5"}
                >
                  transferencia.usal.es
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-200 bg-surface-tinted">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div
            className="page-block text-sm text-gray-600 [&_strong]:text-base [&_strong]:font-semibold [&_strong]:text-gray-900"
            dangerouslySetInnerHTML={{ __html: cta }}
          />
          <a href="mailto:iuce@usal.es" className={buttonClassName() + " flex-none"}>
            {t.contactar}
          </a>
        </div>
      </section>
    </>
  );
}
