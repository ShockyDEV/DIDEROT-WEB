import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { apiError, readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { orcidImportSchema } from "@/lib/admin-schemas";
import { rateLimit } from "@/lib/rate-limit";
import { fetchOrcidRecords } from "@/lib/orcid";
import {
  buildCandidates,
  classifyCandidates,
  parseOrcidId,
  toPublicationData,
  type OrcidCandidate,
} from "@/lib/orcid-import";

/**
 * POST /api/admin/publications/orcid/import
 * { items: [{ orcid, putCode }] }  (las marcadas en la vista previa)
 *
 * El cliente solo dice QUÉ importar: los datos se vuelven a leer de ORCID
 * en el servidor (normalmente de la caché de 10 min de la vista previa) y
 * se vuelve a comprobar contra la BD, por si algo cambió entretanto. Se
 * guardan con source "orcid", orcidPutCode "<orcid>:<put-code>" y visibles.
 */
export const POST = withErrorHandling(
  "publications:orcid-import",
  async (request: Request) => {
    const guard = await requireAdmin({ request });
    if (guard.response) return guard.response;

    if (!rateLimit(`orcid:${guard.user.id}`, 30, 10 * 60_000)) {
      return apiError("Demasiadas consultas a ORCID seguidas; espera unos minutos", 429);
    }

    const body = await readJsonBody(request, orcidImportSchema, 128 * 1024);
    if (body.response) return body.response;
    const { items } = body.data;

    const wanted = new Set(items.map((i) => `${i.orcid}:${i.putCode}`));
    const orcids = [...new Set(items.map((i) => i.orcid))];
    if (orcids.length > 30) {
      return apiError("Demasiados ORCID a la vez (máximo 30)", 400);
    }

    // Nombre del miembro (autoría cuando la obra no trae contribuidores).
    const members = await prisma.member.findMany({
      where: { orcid: { not: null } },
      select: { name: true, orcid: true },
    });
    const nameByOrcid = new Map<string, string>();
    for (const m of members) {
      const id = parseOrcidId(m.orcid);
      if (id) nameByOrcid.set(id, m.name);
    }

    const fetched = await fetchOrcidRecords(
      orcids.map((orcid) => ({ orcid, name: nameByOrcid.get(orcid) ?? null })),
    );

    const byKey = new Map<string, OrcidCandidate>();
    const errors: Array<{ orcid: string; error: string }> = [];
    for (const r of fetched) {
      if (!r.record) {
        errors.push({ orcid: r.orcid, error: r.error ?? "No se pudo consultar ORCID" });
        continue;
      }
      for (const c of buildCandidates(r.orcid, r.record.works, r.record.details, r.record.owner)) {
        if (wanted.has(c.key)) byKey.set(c.key, c);
      }
    }

    // En el orden en que se marcaron (decide cuál cuenta si hay repetidas).
    const selected = items
      .map((i) => byKey.get(`${i.orcid}:${i.putCode}`))
      .filter((c): c is OrcidCandidate => Boolean(c));
    const failedOrcids = new Set(errors.map((e) => e.orcid));
    const missing = items
      .filter((i) => !byKey.has(`${i.orcid}:${i.putCode}`) && !failedOrcids.has(i.orcid))
      .map((i) => ({
        key: `${i.orcid}:${i.putCode}`,
        title: null as string | null,
        reason: "Ya no está en ORCID (o ha cambiado): vuelve a generar la vista previa",
      }));

    const existing = await prisma.publication.findMany({
      select: { id: true, title: true, year: true, doi: true, orcidPutCode: true },
    });
    const classified = classifyCandidates(selected, existing);
    const toCreate = classified.filter((c) => c.importable);
    const skipped = [
      ...classified
        .filter((c) => !c.importable)
        .map((c) => ({ key: c.key, title: c.title as string | null, reason: c.reason ?? "" })),
      ...missing,
    ];

    // skipDuplicates: si entre la vista previa y ahora alguien dio de alta el
    // mismo DOI o put-code, la BD lo salta en vez de fallar todo el lote.
    const result =
      toCreate.length > 0
        ? await prisma.publication.createMany({
            data: toCreate.map(toPublicationData),
            skipDuplicates: true,
          })
        : { count: 0 };

    return NextResponse.json({
      imported: result.count,
      conflicts: toCreate.length - result.count,
      skipped,
      errors,
    });
  },
);
