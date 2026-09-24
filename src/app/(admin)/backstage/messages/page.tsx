import { prisma } from "@/lib/prisma";
import {
  MessagesSection,
  type MessageRow,
} from "@/components/admin/messages-section";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: MessageRow[] = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    body: m.body,
    status: m.status === "REPLIED" ? "REPLIED" : "NEW",
    createdAt: m.createdAt.toISOString(),
  }));

  return <MessagesSection rows={rows} />;
}
