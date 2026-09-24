"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { CopyEmail } from "@/components/ui/copy-email";
import { MemberPhoto } from "@/components/grupo/member-photo";
import { ProfileLinks } from "@/components/grupo/profile-links";
import { cn } from "@/lib/cn";
import { pick, type Locale } from "@/lib/locale";
import type { PublicMember } from "@/lib/members-service";

/** Una categoría del equipo con su rótulo ya localizado. */
export interface MemberGroup {
  /** Valor del enum (COORDINATION, RESEARCHER…). */
  key: string;
  title: string;
  members: PublicMember[];
}

/** Comparación sin tildes ni mayúsculas («gonzalez» encuentra «González»). */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function hasProfiles(m: PublicMember): boolean {
  return Boolean(m.orcid || m.portalUrl || m.scopus || m.scholar || m.website);
}

/** Semblanza en párrafos (texto plano del panel; una línea en blanco separa). */
function BioText({ bio }: Readonly<{ bio: string }>) {
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-gray-600">
      {bio
        .split(/\n\s*\n|\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

/**
 * Semblanza desplegable (<details> nativo: accesible y sin JS). En las
 * tarjetas de coordinación se abre de inicio si es breve.
 */
function Bio({
  bio,
  locale,
  defaultOpen = false,
}: Readonly<{ bio: string; locale: Locale; defaultOpen?: boolean }>) {
  return (
    <details className="group/bio mt-3" open={defaultOpen}>
      <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded text-[13px] font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="h-3.5 w-3.5 flex-none transition-transform group-open/bio:rotate-180"
          aria-hidden="true"
        />
        {pick(locale, "Semblanza", "Biography")}
      </summary>
      <BioText bio={bio} />
    </details>
  );
}

/** Institución/departamento y área de conocimiento, en dos renglones. */
function Affiliation({
  member,
  className,
}: Readonly<{ member: PublicMember; className?: string }>) {
  if (!member.affiliation && !member.area) return null;
  return (
    <p className={cn("leading-relaxed text-gray-500", className)}>
      {member.affiliation}
      {member.affiliation && member.area ? <br /> : null}
      {member.area}
    </p>
  );
}

/** Tarjeta grande (coordinación), como el equipo de dirección del IUCE. */
function CoordinationCard({
  member,
  locale,
}: Readonly<{ member: PublicMember; locale: Locale }>) {
  return (
    <article className="card-lift flex h-full flex-col gap-5 rounded-xl border border-gray-200 border-t-[3px] border-t-diderot-amber bg-surface-card p-6 shadow-sm hover:shadow-md sm:flex-row sm:items-start sm:gap-7 sm:p-7">
      <MemberPhoto
        name={member.name}
        photo={member.photo}
        size={112}
        className="h-28 w-28 text-2xl"
      />
      <div className="min-w-0 flex-1">
        <h4 className="text-lg font-semibold leading-snug text-gray-900">
          {member.name}
        </h4>
        {member.role ? (
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-diderot-amber">
            {member.role}
          </p>
        ) : null}
        <Affiliation member={member} className="mt-2 text-sm" />
        {member.email ? (
          <div className="mt-3">
            <CopyEmail email={member.email} locale={locale} />
          </div>
        ) : null}
        {hasProfiles(member) ? (
          <div className="mt-4">
            <ProfileLinks member={member} locale={locale} />
          </div>
        ) : null}
        {member.bio ? (
          <div className="mt-2 max-w-[75ch]">
            <Bio
              bio={member.bio}
              locale={locale}
              defaultOpen={member.bio.length <= 600}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Tarjeta compacta (resto del equipo), heredera de la rejilla del IUCE. */
function MemberCard({
  member,
  locale,
}: Readonly<{ member: PublicMember; locale: Locale }>) {
  return (
    <article className="card-lift flex h-full flex-col rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm hover:border-brand-400 hover:shadow-md">
      <div className="flex items-start gap-3.5">
        {/* 80px, como en la web del IUCE: retrato presente sin descuadrar. */}
        <MemberPhoto
          name={member.name}
          photo={member.photo}
          size={80}
          className="h-20 w-20 text-xl"
        />
        <div className="min-w-0 flex-1 pt-1">
          <h4 className="text-[15px] font-semibold leading-snug text-gray-900">
            {member.name}
          </h4>
          {member.role ? (
            <p className="mt-0.5 text-[13px] leading-snug text-gray-600">
              {member.role}
            </p>
          ) : null}
        </div>
      </div>
      <Affiliation member={member} className="mt-3 text-xs" />
      {member.email ? (
        <div className="mt-2.5 min-w-0">
          <CopyEmail email={member.email} locale={locale} className="text-[13px]" />
        </div>
      ) : null}
      {member.bio ? <Bio bio={member.bio} locale={locale} /> : null}
      {hasProfiles(member) ? (
        <div className="mt-auto pt-4">
          <ProfileLinks member={member} locale={locale} />
        </div>
      ) : null}
    </article>
  );
}

/**
 * Equipo del grupo por categorías (coordinación → personal investigador →
 * en formación → colaboradores). La coordinación va en tarjetas grandes y
 * el resto en rejilla compacta. Con `searchable`, un buscador filtra a la vez
 * todas las categorías por nombre, puesto, institución o área (sin tildes).
 */
export function MembersGrid({
  groups,
  locale = "es",
  searchable = false,
}: Readonly<{
  groups: MemberGroup[];
  locale?: Locale;
  searchable?: boolean;
}>) {
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());

  const total = groups.reduce((n, g) => n + g.members.length, 0);
  const filtered = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        members: g.members.filter((m) =>
          normalize(
            [m.name, m.role, m.affiliation, m.area].filter(Boolean).join(" "),
          ).includes(q),
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [groups, q]);
  const shown = filtered.reduce((n, g) => n + g.members.length, 0);

  return (
    <div>
      {searchable ? (
        <div className="mb-8 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-11 w-full max-w-[360px] items-center gap-2.5 rounded-md border border-gray-300 bg-surface-card px-3.5 focus-within:border-diderot-violet focus-within:ring-2 focus-within:ring-diderot-violet/25">
            <Search className="h-4 w-4 flex-none text-gray-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pick(
                locale,
                "Buscar por nombre, puesto o área…",
                "Search by name, position or field…",
              )}
              aria-label={pick(
                locale,
                "Buscar en el equipo por nombre, puesto, institución o área",
                "Search the team by name, position, institution or field",
              )}
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
            />
          </div>
          <p className="text-xs text-gray-500" aria-live="polite">
            {shown === total
              ? pick(locale, `${total} miembros`, `${total} members`)
              : pick(
                  locale,
                  `${shown} de ${total} miembros`,
                  `${shown} of ${total} members`,
                )}
          </p>
        </div>
      ) : null}

      {filtered.map((g, gi) => {
        const headingId = `equipo-${g.key.toLowerCase()}`;
        const coordination = g.key === "COORDINATION";
        return (
          <section
            key={g.key}
            aria-labelledby={headingId}
            className={cn(gi > 0 && "mt-12")}
          >
            <div className="mb-5 flex items-baseline gap-3">
              <h3
                id={headingId}
                className="text-xl font-bold tracking-tight text-gray-900"
              >
                {g.title}
              </h3>
              {!coordination ? (
                <span className="rounded-full bg-diderot-pale px-2.5 py-0.5 text-xs font-semibold text-ink">
                  {g.members.length}
                </span>
              ) : null}
            </div>
            {coordination ? (
              <div
                className={cn(
                  "grid grid-cols-1 gap-5",
                  g.members.length > 1 && "lg:grid-cols-2",
                )}
              >
                {g.members.map((m) => (
                  <CoordinationCard key={m.id} member={m} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.members.map((m) => (
                  <MemberCard key={m.id} member={m} locale={locale} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            {pick(
              locale,
              `Nadie del equipo coincide con «${query.trim()}».`,
              `No team member matches “${query.trim()}”.`,
            )}
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 inline-flex min-h-6 items-center rounded text-sm font-medium text-diderot-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2"
          >
            {pick(locale, "Borrar la búsqueda", "Clear the search")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
