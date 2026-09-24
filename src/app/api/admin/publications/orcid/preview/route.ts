import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { orcidPreviewSchema } from "@/lib/admin-schemas";
import { rateLimit } from "@/lib/rate-limit";
import { fetchOrcidRecords } from "@/lib/orcid";
import {
  buildCandidates,
  classifyCandidates,
  parseOrcidId,
  type OrcidCandidate,
} from "@/lib/orcid-import";

/**
 * POST /api/admin/publications/orcid/preview
 * { memberIds?: string[], orcids?: string[] }
 *
 * Lee las obras públicas de cada ORCID (miembros elegidos y/o iD escritos a
 * mano), las convierte en publicaciones y marca las que ya existen en el
 * panel o se repiten en el lote. No escribe nada en la BD.
 */
export const POST = withErrorHandling(
  "publications:orcid-preview",
  async (request: Request) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    // ORCID es un servicio público compartido: nada de ráfagas desde el panel.
    if (!rateLimit(`orcid:${guard.user.id}`, 30, 10 * 60_000)) {
      return apiError("Demasiadas consultas a ORCID seguidas; espera unos minutos", 429);
    }

    const body = await readJsonBody(request, orcidPreviewSchema, 16 * 1024);
    if (body.response) return body.response;
    const { memberIds, orcids } = body.data;

    // Miembros con ORCID en la ficha (también para poner nombre a los iD
    // escritos a mano que resulten ser de alguien del equipo).
    const members = await prisma.member.findMany({
      where: { orcid: { not: null } },
      select: { id: true, name: true, orcid: true },
    });
    const memberByOrcid = new Map<string, { id: string; name: string }>();
    for (const m of members) {
      const id = parseOrcidId(m.orcid);
      if (id) memberByOrcid.set(id, { id: m.id, name: m.name });
    }

    const sources: Array<{ orcid: string; name: string | null; memberId: string | null }> = [];
    const problems: Array<{ orcid: string | null; name: string | null; error: string }> = [];
    const add = (orcid: string, member: { id: string; name: string } | null) => {
      if (sources.some((s) => s.orcid === orcid)) return; // p. ej. miembro + iD escrito
      sources.push({ orcid, name: member?.name ?? null, memberId: member?.id ?? null });
    };

    for (const memberId of memberIds) {
      const m = members.find((x) => x.id === memberId);
      const id = m ? parseOrcidId(m.orcid) : null;
      if (!m || !id) {
        problems.push({
          orcid: null,
          name: m?.name ?? null,
          error: m ? "Su ficha no tiene un ORCID válido" : "Miembro no encontrado",
        });
        continue;
      }
      add(id, { id: m.id, name: m.name });
    }
    for (const id of orcids) add(id, memberByOrcid.get(id) ?? null);

    if (sources.length > 30) {
      return apiError("Demasiados ORCID a la vez (máximo 30)", 400);
    }

    const fetched = await fetchOrcidRecords(sources);

    const candidates: OrcidCandidate[] = [];
    const sourceInfo = sources.map((s, i) => {
      const r = fetched[i];
      const list = r.record
        ? buildCandidates(s.orcid, r.record.works, r.record.details, r.record.owner)
        : [];
      candidates.push(...list);
      const owner = r.record?.owner;
      const orcidName = owner ? [owner.given, owner.family].filter(Boolean).join(" ") : "";
      return {
        orcid: s.orcid,
        memberId: s.memberId,
        name: s.name ?? (orcidName || null),
        total: list.length,
        truncated: r.record?.truncated ?? false,
        error: r.error,
      };
    });

    const existing = await prisma.publication.findMany({
      select: { id: true, title: true, year: true, doi: true, orcidPutCode: true },
    });
    const items = classifyCandidates(candidates, existing);

    const count = (status: string) => items.filter((i) => i.status === status).length;
    return NextResponse.json({
      sources: sourceInfo,
      problems,
      // Sin el resumen (abstract): la vista previa no lo necesita.
      items: items.map((i) => ({
        key: i.key,
        orcid: i.orcid,
        putCode: i.putCode,
        title: i.title,
        authors: i.authors,
        year: i.year,
        type: i.type,
        orcidType: i.orcidType,
        venue: i.venue,
        doi: i.doi,
        url: i.url,
        status: i.status,
        reason: i.reason,
        match: i.match,
        importable: i.importable,
        selected: i.selected,
      })),
      summary: {
        total: items.length,
        new: count("new"),
        exists: count("exists"),
        possibleDuplicates: count("possible-duplicate"),
        batchDuplicates: count("batch-duplicate"),
        incomplete: count("incomplete"),
      },
    });
  },
);
