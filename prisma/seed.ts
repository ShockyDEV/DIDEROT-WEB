/**
 * Semilla de la base de datos con el contenido real de los prototipos
 * (docs/design). Es idempotente: usa upsert/creación condicional, así que
 * puede ejecutarse varias veces sin duplicar datos.
 *
 * Ejecutar con: npm run db:seed
 *
 * La cuenta SUPER_ADMIN inicial se controla con las variables de entorno
 * ADMIN_EMAIL / ADMIN_PASSWORD (con valores de desarrollo por defecto).
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { news } from "../src/lib/content/news";
import { featuredEvent, pastEvents, upcomingEvents } from "../src/lib/content/events";
import { groups } from "../src/lib/content/groups";
import { members } from "../src/lib/content/members";

const prisma = new PrismaClient();

async function main() {
  // --- Cuenta SUPER_ADMIN inicial -----------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL ?? "iuce@usal.es";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "iuce-admin-2026";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administración IUCE",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✓ Usuario SUPER_ADMIN: ${adminEmail}`);

  // La cuenta técnica del Instituto SIEMPRE está de alta como SUPER_ADMIN.
  // Si ya existe se garantiza el rol sin tocar su contraseña.
  const techEmail = "iuce.tecnico@usal.es";
  const techHash = await bcrypt.hash(
    process.env.TECH_ADMIN_PASSWORD ?? adminPassword,
    10,
  );
  await prisma.user.upsert({
    where: { email: techEmail },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: techEmail,
      name: "Enrique González Gutiérrez (técnico)",
      passwordHash: techHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✓ Usuario SUPER_ADMIN técnico: ${techEmail}`);

  // --- Lista blanca inicial de la intranet ----------------------------------
  const intranetEmails = [
    { email: "iuce@usal.es", name: "Administración IUCE" },
    { email: "iuce.tecnico@usal.es", name: "Enrique González Gutiérrez (técnico)" },
    { email: "enriquemico8@gmail.com", name: "Enrique (técnico)" },
  ];
  for (const u of intranetEmails) {
    await prisma.intranetUser.upsert({
      where: { email: u.email },
      update: { active: true },
      create: { email: u.email, name: u.name, active: true },
    });
  }
  console.log(`✓ ${intranetEmails.length} usuarios autorizados de intranet`);

  // --- Noticias -------------------------------------------------------------
  for (const n of news) {
    await prisma.news.upsert({
      where: { slug: n.slug },
      update: {},
      create: {
        title: n.title,
        slug: n.slug,
        excerpt: n.excerpt,
        content: n.content,
        category: n.category,
        status: "PUBLISHED",
        publishedAt: new Date(n.publishedAt),
      },
    });
  }
  console.log(`✓ ${news.length} noticias`);

  // --- Grupos de investigación ----------------------------------------------
  const groupIds = new Map<string, string>();
  for (const g of groups) {
    const existing = await prisma.researchGroup.findFirst({
      where: { acronym: g.acronym },
    });
    const row = existing
      ? // Refresca la traducción EN en grupos ya sembrados (idempotente).
        await prisma.researchGroup.update({
          where: { id: existing.id },
          data: { nameEn: g.nameEn ?? existing.nameEn },
        })
      : await prisma.researchGroup.create({
          data: {
            acronym: g.acronym,
            name: g.name,
            nameEn: g.nameEn,
            lead: g.lead,
            url: g.url,
            logo: g.logo,
            chip: g.chip,
          },
        });
    groupIds.set(g.acronym, row.id);
  }
  console.log(`✓ ${groups.length} grupos de investigación`);

  // --- Miembros ---------------------------------------------------------------
  for (const m of members) {
    const existing = await prisma.member.findFirst({
      where: { name: m.name },
    });
    if (!existing) {
      await prisma.member.create({
        data: {
          name: m.name,
          area: m.area,
          email: m.email,
          role: m.role,
          order: m.order,
          groupId: m.group ? groupIds.get(m.group) : undefined,
        },
      });
    }
  }
  console.log(`✓ ${members.length} miembros`);

  // --- Eventos ------------------------------------------------------------------
  const allEvents = [
    {
      title: featuredEvent.title,
      titleEn: featuredEvent.titleEn,
      type: featuredEvent.type,
      startsAt: new Date(featuredEvent.startsAt),
      location: featuredEvent.location,
      url: featuredEvent.url,
      status: "UPCOMING" as const,
    },
    ...upcomingEvents.map((e) => ({
      title: e.title,
      titleEn: e.titleEn,
      type: e.type,
      startsAt: new Date(e.startsAt),
      location: e.location,
      url: e.url,
      status: e.status,
    })),
    ...pastEvents.map((e) => ({
      title: e.title,
      titleEn: e.titleEn,
      type: e.type,
      startsAt: new Date(e.startsAt),
      location: e.location,
      url: e.url,
      status: e.status,
    })),
  ];
  for (const e of allEvents) {
    const existing = await prisma.event.findFirst({
      where: { title: e.title },
    });
    if (existing) {
      // Refresca la traducción EN en eventos ya sembrados (idempotente).
      await prisma.event.update({
        where: { id: existing.id },
        data: { titleEn: e.titleEn ?? existing.titleEn },
      });
    } else {
      await prisma.event.create({ data: e });
    }
  }
  console.log(`✓ ${allEvents.length} eventos`);

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
