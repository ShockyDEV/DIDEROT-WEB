/**
 * Semilla de la base de datos de DIDEROT con contenido REAL:
 *  - equipo (Portal de Producción Científica de la USAL, grupo 12132),
 *  - proyectos (portal + memoria del IUCE),
 *  - publicaciones (portal: producción del grupo + tesis dirigidas),
 *  - eventos (carteles del Seminario Internacional) y noticias iniciales,
 *  - cuentas de administración.
 * Detalle de fuentes en prisma/data/*.
 *
 * Es IDEMPOTENTE y de SOLO RELLENO: crea lo que falta y nunca sobrescribe lo
 * que ya existe (lo editado desde el panel manda). Ejecutar con:
 *   npm run db:seed
 *
 * Cuentas: ADMIN_EMAIL / ADMIN_PASSWORD (SUPER_ADMIN del grupo) y
 * TECH_ADMIN_EMAIL / TECH_ADMIN_PASSWORD (SUPER_ADMIN técnico). En
 * producción es OBLIGATORIO fijar contraseñas propias (≥ 12 caracteres): el
 * seed se niega a crear cuentas con las contraseñas de desarrollo.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient, type PublicationType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import {
  members,
  orcidUrl,
  portalUrl,
  scholarUrl,
  scopusUrl,
} from "./data/members";
import { projects } from "./data/projects";
import { events } from "./data/events";
import { news } from "./data/news";

const prisma = new PrismaClient();

const DEV_ADMIN_PASSWORD = "diderot-admin-dev";

interface PublicationSeed {
  title: string;
  authors: string;
  year: number;
  type: PublicationType;
  venue: string | null;
  details: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  openAccess: boolean;
  featured: boolean;
  published: boolean;
  source: string;
}

function resolvePassword(envName: string, fallback?: string): string {
  const value = process.env[envName] ?? fallback;
  const isProd = process.env.NODE_ENV === "production";
  if (!value) {
    throw new Error(`Falta ${envName}`);
  }
  if (isProd && (value === DEV_ADMIN_PASSWORD || value.length < 12)) {
    throw new Error(
      `${envName}: en producción la contraseña debe ser propia y tener al menos 12 caracteres`,
    );
  }
  return value;
}

async function seedAccounts() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "diderot@usal.es").toLowerCase();
  // La contraseña solo se exige si hay que CREAR la cuenta: así la semilla
  // se puede repetir tras borrar las contraseñas del .env.
  const adminPassword = () =>
    resolvePassword(
      "ADMIN_PASSWORD",
      process.env.NODE_ENV === "production" ? undefined : DEV_ADMIN_PASSWORD,
    );
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administración DIDEROT",
        passwordHash: await bcrypt.hash(adminPassword(), 12),
        role: "SUPER_ADMIN",
      },
    });
    console.log(`✓ Cuenta SUPER_ADMIN creada: ${adminEmail}`);
  } else {
    console.log(`· Cuenta SUPER_ADMIN ya existente: ${adminEmail} (contraseña sin tocar)`);
  }

  // Cuenta técnica: siempre SUPER_ADMIN; si ya existe solo se garantiza el rol.
  const techEmail = process.env.TECH_ADMIN_EMAIL?.toLowerCase();
  if (techEmail && techEmail !== adminEmail) {
    const existingTech = await prisma.user.findUnique({ where: { email: techEmail } });
    if (existingTech) {
      if (existingTech.role !== "SUPER_ADMIN") {
        await prisma.user.update({ where: { email: techEmail }, data: { role: "SUPER_ADMIN" } });
      }
      console.log(`· Cuenta técnica ya existente: ${techEmail}`);
    } else {
      const techPassword = resolvePassword(
        "TECH_ADMIN_PASSWORD",
        process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? undefined : DEV_ADMIN_PASSWORD),
      );
      await prisma.user.create({
        data: {
          email: techEmail,
          name: "Soporte técnico",
          passwordHash: await bcrypt.hash(techPassword, 12),
          role: "SUPER_ADMIN",
        },
      });
      console.log(`✓ Cuenta técnica SUPER_ADMIN creada: ${techEmail}`);
    }
  }
}

async function seedMembers() {
  let created = 0;
  for (const m of members) {
    const exists = await prisma.member.findFirst({ where: { name: m.name } });
    if (exists) continue;
    await prisma.member.create({
      data: {
        name: m.name,
        category: m.category,
        role: m.role,
        roleEn: m.roleEn,
        affiliation: m.affiliation,
        area: m.area,
        email: m.email,
        photo: m.photo,
        portalUrl: portalUrl(m.portalId),
        orcid: m.orcid ? orcidUrl(m.orcid) : undefined,
        scopus: m.scopus ? scopusUrl(m.scopus) : undefined,
        scholar: m.scholar ? scholarUrl(m.scholar) : undefined,
        order: m.order,
        active: true,
      },
    });
    created++;
  }
  console.log(`✓ Equipo: ${created} creados (${members.length} en la semilla)`);
}

async function seedProjects() {
  let created = 0;
  for (const p of projects) {
    const exists = await prisma.project.findFirst({
      where: p.reference
        ? { OR: [{ reference: p.reference }, { title: p.title }] }
        : { title: p.title },
    });
    if (exists) continue;
    await prisma.project.create({ data: { ...p, active: true, featured: p.featured ?? false } });
    created++;
  }
  console.log(`✓ Proyectos: ${created} creados (${projects.length} en la semilla)`);
}

async function seedPublications() {
  const file = path.join(__dirname, "data", "publications.json");
  const pubs = JSON.parse(readFileSync(file, "utf8")) as PublicationSeed[];
  let created = 0;
  for (const p of pubs) {
    const exists = p.doi
      ? await prisma.publication.findUnique({ where: { doi: p.doi } })
      : await prisma.publication.findFirst({ where: { title: p.title, year: p.year } });
    if (exists) continue;
    await prisma.publication.create({ data: p });
    created++;
  }
  console.log(`✓ Publicaciones: ${created} creadas (${pubs.length} en la semilla)`);
}

async function seedEvents() {
  let created = 0;
  for (const e of events) {
    const exists = await prisma.event.findFirst({ where: { title: e.title } });
    if (exists) continue;
    await prisma.event.create({
      data: { ...e, startsAt: new Date(e.startsAt) },
    });
    created++;
  }
  console.log(`✓ Eventos: ${created} creados (${events.length} en la semilla)`);
}

async function seedNews() {
  let created = 0;
  for (const n of news) {
    const exists = await prisma.news.findUnique({ where: { slug: n.slug } });
    if (exists) continue;
    await prisma.news.create({
      data: {
        ...n,
        status: "PUBLISHED",
        publishedAt: new Date(n.publishedAt),
      },
    });
    created++;
  }
  console.log(`✓ Noticias: ${created} creadas (${news.length} en la semilla)`);
}

async function main() {
  await seedAccounts();
  await seedMembers();
  await seedProjects();
  await seedPublications();
  await seedEvents();
  await seedNews();
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
