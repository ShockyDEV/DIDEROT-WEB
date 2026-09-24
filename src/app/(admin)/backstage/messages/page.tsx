import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { MessagesSection, type MessageRow } from "@/components/admin/messages-section";

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

  // Aviso honesto de a dónde llegan (o no) los mensajes por correo.
  const key = process.env.RESEND_API_KEY?.trim();
  const emailEnabled = Boolean(key && !key.includes("placeholder"));
  const forwardTo = process.env.CONTACT_TO?.trim() || SITE.email;

  return <MessagesSection rows={rows} emailEnabled={emailEnabled} forwardTo={forwardTo} />;
}
