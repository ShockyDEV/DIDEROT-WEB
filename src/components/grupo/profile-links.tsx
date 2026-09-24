import type { ReactNode } from "react";
import { BarChart3, Globe, GraduationCap, Library } from "lucide-react";
import { pick, type Locale } from "@/lib/locale";
import type { PublicMember } from "@/lib/members-service";

interface ProfileLink {
  href: string;
  label: string;
  /** Nombre accesible: incluye el rótulo visible (WCAG 2.5.3) y la persona. */
  ariaLabel: string;
  mark: ReactNode;
}

const iconClass = "h-3.5 w-3.5 flex-none";

/**
 * Perfiles académicos de un miembro como píldoras con texto (ORCID, Portal
 * de Producción Científica de la USAL, Scopus, Google Scholar y web). Se
 * abren en pestaña nueva; los enlaces ya llegan saneados (solo http/https)
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
      // Distintivo «iD» con el verde de ORCID (logotipo, no texto).
      mark: (
        <span
          aria-hidden="true"
          className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full bg-[#A6CE39] text-[7px] font-bold leading-none text-white"
        >
          iD
        </span>
      ),
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
      mark: <Library className={iconClass} aria-hidden="true" />,
    });
  }
  if (member.scopus) {
    links.push({
      href: member.scopus,
      label: "Scopus",
      ariaLabel: pick(locale, `Scopus de ${name}`, `Scopus profile of ${name}`),
      mark: <BarChart3 className={iconClass} aria-hidden="true" />,
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
      mark: <GraduationCap className={iconClass} aria-hidden="true" />,
    });
  }
  if (member.website) {
    links.push({
      href: member.website,
      label: pick(locale, "Web", "Website"),
      ariaLabel: pick(locale, `Web de ${name}`, `Website of ${name}`),
      mark: <Globe className={iconClass} aria-hidden="true" />,
    });
  }

  if (links.length === 0) return null;

  return (
    <ul
      aria-label={pick(locale, `Perfiles de ${name}`, `${name}'s profiles`)}
      className="flex list-none flex-wrap gap-1.5 p-0"
    >
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.ariaLabel}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-gray-200 bg-surface-card px-2.5 text-[11px] font-semibold text-gray-700 transition-colors hover:border-diderot-violet hover:text-diderot-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
          >
            {l.mark}
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
