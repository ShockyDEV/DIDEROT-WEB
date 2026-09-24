/**
 * Equipo de DIDEROT para la semilla de la BD.
 *
 * FUENTE: Portal de Producción Científica de la USAL, ficha del grupo 12132
 * (https://produccioncientifica.usal.es/grupos/12132/detalle), datos
 * actualizados a 10-09-2026: 9 investigadores/as (incluido el responsable) y
 * 10 colaboradores/as. Puesto, departamento, área, correo, ORCID, Scopus y
 * Google Scholar salen de la ficha pública de cada persona en el portal; las
 * fotos, de la web del IUCE. Todo es editable después desde el panel
 * (Investigación → Equipo).
 *
 * Categorías: el portal distingue «Investigadores» y «Colaboradores»; entre
 * estos últimos, quien figura como personal investigador predoctoral va a
 * PREDOCTORAL («Personal investigador en formación»).
 * Los correos de estudiantes y los identificadores internos no se publican.
 */
import type { MemberCategory } from "@prisma/client";

export interface MemberSeed {
  name: string;
  category: MemberCategory;
  role?: string;
  roleEn?: string;
  affiliation?: string;
  area?: string;
  email?: string;
  photo?: string;
  /** Id del portal de producción científica (…/investigadores/<id>/detalle) */
  portalId: number;
  orcid?: string;
  scopus?: string;
  scholar?: string;
  order: number;
}

const USAL = "Universidad de Salamanca";
const DPTO =
  "Universidad de Salamanca · Dpto. de Didáctica de la Expresión Musical, Plástica y Corporal";

export const members: MemberSeed[] = [
  // ── Coordinación ─────────────────────────────────────────────────────────
  {
    name: "Javier Félix Merchán Sánchez-Jara",
    category: "COORDINATION",
    role: "Responsable del grupo · Profesor Titular de Universidad",
    roleEn: "Group leader · Associate Professor",
    affiliation: `${DPTO} · IUCE`,
    area: "Didáctica de la Expresión Musical",
    email: "javiermerchan@usal.es",
    photo: "/images/equipo/javier-felix-merchan-sanchez-jara.jpg",
    portalId: 107696,
    orcid: "0000-0003-1828-5182",
    scopus: "57193549570",
    scholar: "pULlm40AAAAJ",
    order: 0,
  },

  // ── Personal investigador ────────────────────────────────────────────────
  {
    name: "Luis Ignacio Barrero Pérez",
    category: "RESEARCHER",
    affiliation: USAL,
    area: "Didáctica de la Expresión Plástica",
    photo: "/images/equipo/luis-ignacio-barrero-perez.jpg",
    portalId: 1036090,
    orcid: "0009-0004-7118-0480",
    scopus: "59656159300",
    scholar: "IMN4nNAAAAAJ",
    order: 10,
  },
  {
    name: "Elena Berrón Ruiz",
    category: "RESEARCHER",
    role: "Profesora Asociada",
    roleEn: "Adjunct Lecturer",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Musical",
    email: "eberron@usal.es",
    photo: "/images/equipo/elena-berron-ruiz.jpg",
    portalId: 57263,
    orcid: "0000-0002-1678-5231",
    scopus: "57215609435",
    order: 11,
  },
  {
    name: "Javier Cruz Rodríguez",
    category: "RESEARCHER",
    role: "Profesor Titular de Universidad",
    roleEn: "Associate Professor",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Musical",
    email: "javiercruz@usal.es",
    photo: "/images/equipo/javier-cruz-rodriguez.jpg",
    portalId: 57278,
    orcid: "0000-0003-3622-6530",
    scopus: "57209176483",
    scholar: "GDhmMx0AAAAJ",
    order: 12,
  },
  {
    name: "Beatriz Escribano Belmar",
    category: "RESEARCHER",
    role: "Profesora Permanente Laboral",
    roleEn: "Permanent Lecturer",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Plástica",
    email: "Beatriz.Escribano@usal.es",
    photo: "/images/equipo/beatriz-escribano-belmar.jpg",
    portalId: 107805,
    orcid: "0000-0001-8580-7548",
    scopus: "57202265363",
    scholar: "35MnpWUAAAAJ",
    order: 13,
  },
  {
    name: "Concepción Pedrero Muñoz",
    category: "RESEARCHER",
    role: "Profesora Permanente Laboral",
    roleEn: "Permanent Lecturer",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Musical",
    email: "cpedrero@usal.es",
    photo: "/images/equipo/concepcion-pedrero-munoz.jpg",
    portalId: 56236,
    orcid: "0000-0002-9151-7296",
    scopus: "56014286800",
    scholar: "SWhR45UAAAAJ",
    order: 14,
  },
  {
    name: "Mariano Pérez Prieto",
    category: "RESEARCHER",
    affiliation: USAL,
    area: "Didáctica de la Expresión Musical",
    portalId: 2296581,
    order: 15,
  },
  {
    name: "Sonsoles Ramos Ahijado",
    category: "RESEARCHER",
    affiliation: `${USAL} · IUCE`,
    area: "Didáctica de la Expresión Musical",
    photo: "/images/equipo/sonsoles-ramos-ahijado.jpg",
    portalId: 56054,
    orcid: "0000-0002-8109-332X",
    scopus: "57188583419",
    scholar: "LoQGH-oAAAAJ",
    order: 16,
  },
  {
    name: "Bohdan Syroyid Syroyid",
    category: "RESEARCHER",
    role: "Profesor Permanente Laboral",
    roleEn: "Permanent Lecturer",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Musical",
    email: "syroyid@usal.es",
    photo: "/images/equipo/bohdan-syroyid-syroyid.jpg",
    portalId: 157291,
    orcid: "0000-0002-2281-9207",
    scopus: "57292175900",
    scholar: "K_HRm1IAAAAJ",
    order: 17,
  },

  // ── Personal investigador en formación ───────────────────────────────────
  {
    name: "Patricia García Iasci",
    category: "PREDOCTORAL",
    role: "Investigadora predoctoral en formación",
    roleEn: "Predoctoral researcher",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Musical",
    email: "garcia.iasci@usal.es",
    photo: "/images/equipo/patricia-garcia-iasci.jpg",
    portalId: 818980,
    orcid: "0000-0002-6959-9504",
    scopus: "58238307400",
    order: 20,
  },
  {
    name: "Andrea Martín Ferrero",
    category: "PREDOCTORAL",
    role: "Investigadora predoctoral",
    roleEn: "Predoctoral researcher",
    affiliation: USAL,
    photo: "/images/equipo/andrea-martin-ferrero.jpg",
    portalId: 2299366,
    order: 21,
  },
  {
    name: "Beatriz Luisa Martín Lobato",
    category: "PREDOCTORAL",
    role: "Investigadora predoctoral",
    roleEn: "Predoctoral researcher",
    affiliation: USAL,
    photo: "/images/equipo/beatriz-luisa-martin-lobato.jpg",
    portalId: 2300742,
    order: 22,
  },

  // ── Colaboradores y colaboradoras ────────────────────────────────────────
  {
    name: "Juan Manuel Cantos Ruiz",
    category: "COLLABORATOR",
    affiliation: USAL,
    photo: "/images/equipo/juan-manuel-cantos-ruiz.jpg",
    portalId: 821059,
    orcid: "0000-0002-5001-3753",
    order: 30,
  },
  {
    name: "Natalia Castellanos Camacho",
    category: "COLLABORATOR",
    affiliation: USAL,
    portalId: 873536,
    order: 31,
  },
  {
    name: "Sara González Gutiérrez",
    category: "COLLABORATOR",
    role: "Profesora Ayudante Doctora",
    roleEn: "Assistant Professor",
    affiliation: `${DPTO} · IUCE`,
    area: "Didáctica de la Expresión Musical",
    email: "saragnzlz@usal.es",
    photo: "/images/equipo/sara-gonzalez-gutierrez.jpg",
    portalId: 148115,
    orcid: "0000-0002-5706-4705",
    scopus: "57226273232",
    scholar: "qQJy0WsAAAAJ",
    order: 32,
  },
  {
    name: "Beatriz Hernández Polo",
    category: "COLLABORATOR",
    role: "Profesora Permanente Laboral",
    roleEn: "Permanent Lecturer",
    affiliation: DPTO,
    area: "Didáctica de la Expresión Musical",
    email: "beahp@usal.es",
    portalId: 57501,
    orcid: "0000-0003-0423-0113",
    order: 33,
  },
  {
    name: "Almudena Mangas Vega",
    category: "COLLABORATOR",
    affiliation: `${USAL} · Instituto de Estudios Medievales y Renacentistas`,
    area: "Biblioteconomía y Documentación",
    email: "almumvega@usal.es",
    photo: "/images/equipo/almudena-mangas-vega.jpg",
    portalId: 132041,
    orcid: "0000-0002-3464-3624",
    scopus: "57192430871",
    scholar: "_2HWKEgAAAAJ",
    order: 34,
  },
  {
    name: "Carlos Sánchez García",
    category: "COLLABORATOR",
    affiliation: USAL,
    photo: "/images/equipo/carlos-sanchez-garcia.jpg",
    portalId: 820322,
    order: 35,
  },
  {
    name: "María Suárez Martín",
    category: "COLLABORATOR",
    role: "Personal investigador",
    roleEn: "Research staff",
    affiliation: USAL,
    portalId: 2299898,
    order: 36,
  },
];

export const portalUrl = (id: number) =>
  `https://produccioncientifica.usal.es/investigadores/${id}/detalle`;
export const orcidUrl = (id: string) => `https://orcid.org/${id}`;
export const scopusUrl = (id: string) =>
  `https://www.scopus.com/authid/detail.uri?authorId=${id}`;
export const scholarUrl = (id: string) =>
  `https://scholar.google.com/citations?user=${id}`;
