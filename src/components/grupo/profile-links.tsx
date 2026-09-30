import { pick, type Locale } from "@/lib/locale";
import type { PublicMember } from "@/lib/members-service";

interface ProfileLink {
  href: string;
  label: string;
  /** Nombre accesible: incluye el rótulo visible (WCAG 2.5.3) y la persona. */
  ariaLabel: string;
}

/**
 * Perfiles académicos de un miembro como enlaces de texto subrayados (ORCID,
 * Portal de Producción Científica de la USAL, Scopus, Google Scholar y web).
 * Se abren en pestaña nueva; los enlaces ya llegan saneados (solo http/https)
 * desde members-service. Si no tiene ninguno, no pinta nada.
 */
export function ProfileLinks({
  member,
  locale,
}: Readonly<{ member: PublicMember; locale: Locale }>) {
  const name = member.name;
  const links: ProfileLink[] = [];

  if (member.orcid) {
    links.push({
      href: member.orcid,
      label: "ORCID",
      ariaLabel: pick(locale, `ORCID de ${name}`, `ORCID profile of ${name}`),
    });
  }
  if (member.portalUrl) {
    links.push({
      href: member.portalUrl,
      label: pick(locale, "Portal USAL", "USAL Portal"),
      ariaLabel: pick(
        locale,
        `Portal USAL: producción científica de ${name}`,
        `USAL Portal: research output of ${name}`,
      ),
    });
  }
  if (member.scopus) {
    links.push({
      href: member.scopus,
      label: "Scopus",
      ariaLabel: pick(locale, `Scopus de ${name}`, `Scopus profile of ${name}`),
    });
  }
  if (member.scholar) {
    links.push({
      href: member.scholar,
      label: "Google Scholar",
      ariaLabel: pick(
        locale,
        `Google Scholar de ${name}`,
        `Google Scholar profile of ${name}`,
      ),
    });
  }
  if (member.website) {
    links.push({
      href: member.website,
      label: pick(locale, "Web", "Website"),
      ariaLabel: pick(locale, `Web de ${name}`, `Website of ${name}`),
    });
  }

  if (links.length === 0) return null;

  return (
    <ul
      aria-label={pick(locale, `Perfiles de ${name}`, `${name}'s profiles`)}
      className="flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px] font-medium"
    >
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.ariaLabel}
            className="link-sub rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
