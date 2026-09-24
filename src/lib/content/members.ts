/**
 * Contenido semilla del equipo de dirección y miembros del IUCE
 * (de los prototipos del handoff). Lo usan la página Instituto y el seed.
 */
export interface MemberSeed {
  name: string;
  area?: string;
  email?: string;
  /** Cargo de dirección; null/undefined = miembro ordinario. */
  role?: string;
  order: number;
  /** Acrónimo del grupo al que pertenece (si consta). */
  group?: string;
}

export const members: MemberSeed[] = [
  {
    name: "Susana Olmos Migueláñez",
    role: "Directora",
    email: "solmos@usal.es",
    area: "Evaluación educativa",
    order: 1,
  },
  {
    name: "Francisco José García Peñalvo",
    role: "Subdirector",
    email: "fgarcia@usal.es",
    area: "Informática · Director del grupo GRIAL",
    order: 2,
    group: "GRIAL",
  },
  {
    name: "Javier Félix Merchán Sánchez-Jara",
    // OJO: «Secretario Académico», no confundir con la Secretaría
    // Administrativa; la banda de dirección de /instituto busca este cargo.
    role: "Secretario Académico",
    email: "javiermerchan@usal.es",
    area: "Humanidades digitales",
    order: 3,
  },
  {
    name: "María José Rodríguez Conde",
    area: "Métodos de Investigación y Diagnóstico en Educación",
    order: 4,
  },
  {
    name: "Fernando Martínez Abad",
    area: "Evaluación educativa · Grupo GRIAL",
    order: 5,
    group: "GRIAL",
  },
  {
    name: "Erla Mariela Morales Morgado",
    area: "Tecnología educativa · Grupo GRIAL",
    order: 6,
    group: "GRIAL",
  },
];

export const secretariat = {
  name: "Fernando De Castro de Arriba",
  email: "fdecastro@usal.es",
  extension: "4634",
};
