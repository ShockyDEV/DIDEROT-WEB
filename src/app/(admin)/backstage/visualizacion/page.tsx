import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGES, PUBLIC_SECTIONS } from "@/lib/content/public-pages";
import {
  VisibilitySection,
  type VisibilityRow,
} from "@/components/admin/visibility-section";

export const dynamic = "force-dynamic";

export default async function AdminVisibilidadPage() {
  const saved = await prisma.pageVisibility.findMany();
  const state = new Map(saved.map((r) => [r.slug, r.hidden]));

  const rows: VisibilityRow[] = PUBLIC_PAGES.map((p) => ({
    slug: p.slug,
    label: p.label,
    path: p.path,
    hint: p.hint,
    hidden: state.get(p.slug) ?? false,
  }));

  // Secciones dentro de páginas: sin fila en BD manda su defaultHidden.
  const sections: VisibilityRow[] = PUBLIC_SECTIONS.map((s) => ({
    slug: s.slug,
    label: s.label,
    path: s.path,
    hint: s.hint,
    hidden: state.get(s.slug) ?? s.defaultHidden,
  }));

  return <VisibilitySection rows={rows} sections={sections} />;
}
