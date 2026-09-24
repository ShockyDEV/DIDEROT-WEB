import { prisma } from "@/lib/prisma";
import {
  EventsSection,
  type EventRow,
} from "@/components/admin/events-section";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const [events, news] = await Promise.all([
    prisma.event.findMany({ orderBy: { startsAt: "desc" } }),
    // Para el selector de crónica: noticias publicadas, recientes primero.
    prisma.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
      take: 300,
    }),
  ]);

  const rows: EventRow[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
    location: e.location,
    url: e.url,
    image: e.image,
    newsSlug: e.newsSlug,
    status: e.status,
  }));

  return <EventsSection rows={rows} newsOptions={news} />;
}
