"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { CopyEmail } from "@/components/ui/copy-email";
import { GroupBadge, type MemberGroup } from "@/components/grupo/group-badge";
import { pick, type Locale } from "@/lib/locale";

export interface PublicMember {
  name: string;
  area: string;
  /** Correo (copiable al portapapeles). */
  email: string | null;
  /** Perfil de Scopus (si consta; se edita desde el panel). */
  scopus: string | null;
  photo: string | null;
  /** Perfil en el Portal de Investigación de la USAL (si consta). */
  portalUrl: string | null;
  /** URL del ORCID (si consta; se edita desde el panel). */
  orcid: string | null;
  /** Grupo de investigación al que pertenece (si consta). */
  group: MemberGroup | null;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Rejilla pública de miembros del IUCE: buscador + tarjetas compactas con
 * foto (o iniciales si no hay). Los datos salen del gestor. Con
 * `searchable={false}` se omiten buscador y contador (p. ej. el consejo
 * asesor, que son un puñado de tarjetas).
 */
export function MembersGrid({
  members,
  locale = "es",
  searchable = true,
}: Readonly<{
  members: PublicMember[];
  locale?: Locale;
  searchable?: boolean;
}>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.area.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <div>
      {searchable ? (
        <>
          <div className="mb-6 flex h-11 w-full max-w-[360px] items-center gap-2.5 rounded-md border border-gray-300 bg-surface-card px-3.5">
            <Search
              className="h-4 w-4 flex-none text-gray-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pick(
                locale,
                "Buscar por nombre o área…",
                "Search by name or area…",
              )}
              aria-label={pick(
                locale,
                "Buscar miembros por nombre o área",
                "Search members by name or area",
              )}
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
            />
          </div>

          <p className="mb-4 text-xs text-gray-500" aria-live="polite">
            {filtered.length === members.length
              ? pick(
                  locale,
                  `${members.length} miembros`,
                  `${members.length} members`,
                )
              : pick(
                  locale,
                  `${filtered.length} de ${members.length} miembros`,
                  `${filtered.length} of ${members.length} members`,
                )}
          </p>
        </>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => {
          // 80px: retrato más presente sin descuadrar la tarjeta (el bloque
          // de nombre + área + badge mide algo más que eso).
          const avatar = m.photo ? (
            <Image
              src={m.photo}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 flex-none rounded-full object-cover"
            />
          ) : (
            <InitialsAvatar
              initials={initialsOf(m.name)}
              className="h-20 w-20 flex-none text-xl"
            />
          );
          const nombreArea = (
            <>
              <p className="text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover/persona:text-diderot-violet">
                {m.name}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-gray-500">
                {m.area}
              </p>
            </>
          );
          return (
            <div
              key={m.name}
              className="card-lift flex items-start gap-3 rounded-xl border border-gray-200 bg-surface-card p-5 shadow-sm hover:border-brand-400 hover:shadow-md"
            >
              {avatar}
              <div className="min-w-0 flex-1">
                {/* Nombre + área enlazan al perfil del Portal de Investigación
                    (como en la web original) */}
                {m.portalUrl ? (
                  <a
                    href={m.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={pick(
                      locale,
                      `Producción científica de ${m.name} (Portal de Investigación USAL)`,
                      `${m.name}'s scientific output (USAL Research Portal)`,
                    )}
                    className="group/persona block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diderot-violet focus-visible:ring-offset-2"
                  >
                    {nombreArea}
                  </a>
                ) : (
                  <div>{nombreArea}</div>
                )}
                {m.group ? (
                  <div className="mt-2">
                    <GroupBadge group={m.group} />
                  </div>
                ) : null}
                {m.email ? (
                  <div className="mt-1.5">
                    <CopyEmail email={m.email} locale={locale} />
                  </div>
                ) : null}
              </div>
              {/* Identificadores del investigador: ORCID y Scopus. */}
              {m.orcid || m.scopus ? (
                <div className="flex flex-none flex-col gap-1.5">
                  {m.orcid ? (
                    <a
                      href={m.orcid}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={pick(
                        locale,
                        `ORCID de ${m.name}`,
                        `${m.name}'s ORCID`,
                      )}
                      title="ORCID"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-[10px] font-bold text-[#A6CE39] transition-colors hover:border-[#A6CE39] hover:bg-[#A6CE39]/10"
                    >
                      iD
                    </a>
                  ) : null}
                  {m.scopus ? (
                    <a
                      href={m.scopus}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={pick(
                        locale,
                        `Scopus de ${m.name}`,
                        `${m.name}'s Scopus`,
                      )}
                      title="Scopus"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-[9px] font-bold text-[#E9711C] transition-colors hover:border-[#E9711C] hover:bg-[#E9711C]/10"
                    >
                      Sc
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="col-span-full py-8 text-center text-sm text-gray-500">
            {pick(
              locale,
              `Sin resultados para «${query}».`,
              `No results for “${query}”.`,
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
