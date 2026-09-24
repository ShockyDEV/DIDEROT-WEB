import type {
  EventInput,
  MemberInput,
  ProjectInput,
  PublicationInput,
} from "@/lib/admin-schemas";
import { translatePlainFields } from "@/lib/translate";

/**
 * De los datos ya validados (admin-schemas.ts) a los datos de Prisma, con
 * la auto-traducción ES → EN de los campos cuya versión inglesa llega vacía
 * (solo si hay DEEPL_API_KEY; si no, quedan en null y la web usa el
 * español). Compartido por el alta (POST) y la edición (PUT) de cada tipo.
 */

/** Solo se traduce lo que tiene texto en español y NO trae ya su inglés. */
function pendingTranslation<K extends string>(
  pairs: Record<K, [es: string | null | undefined, en: string | null | undefined]>,
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const key of Object.keys(pairs) as K[]) {
    const [es, en] = pairs[key];
    if (es && !en) out[key] = es;
  }
  return out;
}

export async function memberData(d: MemberInput) {
  const t = await translatePlainFields(
    pendingTranslation({ role: [d.role, d.roleEn], bio: [d.bio, d.bioEn] }),
  );
  return {
    name: d.name,
    category: d.category,
    role: d.role ?? null,
    roleEn: d.roleEn ?? t.roleEn ?? null,
    affiliation: d.affiliation ?? null,
    area: d.area ?? null,
    bio: d.bio ?? null,
    bioEn: d.bioEn ?? t.bioEn ?? null,
    email: d.email ?? null,
    photo: d.photo ?? null,
    portalUrl: d.portalUrl ?? null,
    orcid: d.orcid ?? null,
    scopus: d.scopus ?? null,
    scholar: d.scholar ?? null,
    website: d.website ?? null,
  };
}

export async function projectData(d: ProjectInput) {
  const t = await translatePlainFields(
    pendingTranslation({ title: [d.title, d.titleEn], summary: [d.summary, d.summaryEn] }),
  );
  return {
    title: d.title,
    titleEn: d.titleEn ?? t.titleEn ?? null,
    acronym: d.acronym ?? null,
    reference: d.reference ?? null,
    funder: d.funder ?? null,
    ip: d.ip ?? null,
    scope: d.scope ?? null,
    amount: d.amount ?? null,
    period: d.period ?? null,
    startYear: d.startYear ?? null,
    endYear: d.endYear ?? null,
    summary: d.summary ?? null,
    summaryEn: d.summaryEn ?? t.summaryEn ?? null,
    url: d.url ?? null,
    image: d.image ?? null,
  };
}

export async function eventData(d: EventInput) {
  const t = await translatePlainFields(
    pendingTranslation({
      title: [d.title, d.titleEn],
      description: [d.description, d.descriptionEn],
    }),
  );
  return {
    title: d.title,
    titleEn: d.titleEn ?? t.titleEn ?? null,
    type: d.type,
    description: d.description ?? null,
    descriptionEn: d.descriptionEn ?? t.descriptionEn ?? null,
    startsAt: new Date(d.startsAt),
    endsAt: d.endsAt ? new Date(d.endsAt) : null,
    location: d.location ?? null,
    url: d.url ?? null,
    image: d.image ?? null,
    newsSlug: d.newsSlug ?? null,
    status: d.status,
  };
}

export function publicationData(d: PublicationInput) {
  return {
    title: d.title,
    authors: d.authors,
    year: d.year,
    type: d.type,
    venue: d.venue ?? null,
    details: d.details ?? null,
    doi: d.doi ?? null,
    url: d.url ?? null,
    abstract: d.abstract ?? null,
    openAccess: d.openAccess ?? false,
    featured: d.featured ?? false,
    published: d.published ?? true,
  };
}
