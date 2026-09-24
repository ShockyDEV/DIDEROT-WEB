/**
 * Utilidades compartidas por la tabla de Publicaciones y el diálogo de
 * importación desde ORCID.
 */

/** Miembro del equipo con ORCID (para elegirlo en la importación). */
export interface OrcidMemberOption {
  id: string;
  name: string;
  /** ORCID iD normalizado (0000-0000-0000-0000). */
  orcid: string;
  active: boolean;
}

/** «Pérez, A.; López, B.; García, C.; Ruiz, D.» → «Pérez, A.; López, B.; García, C. et al.» */
export function abbreviateAuthors(authors: string, max = 3): string {
  const list = authors
    .split(";")
    .map((a) => a.trim())
    .filter(Boolean);
  if (list.length <= max) return list.join("; ");
  return `${list.slice(0, max).join("; ")} et al.`;
}
