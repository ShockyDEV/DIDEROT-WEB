import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { readJsonBody, withErrorHandling } from "@/lib/admin-http";
import { siteSettingsSchema } from "@/lib/admin-schemas";
import {
  getSiteSettings,
  SITE_SETTINGS_KEYS,
  SITE_SETTINGS_PAGE,
  type SiteSettings,
} from "@/lib/site-settings";

export const GET = withErrorHandling("site-settings:get", async () => {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;
  return NextResponse.json({ settings: await getSiteSettings() });
});

/**
 * PUT: guarda los datos del sitio (Configuración) de una vez y validados
 * (correo real, teléfono con formato de teléfono…), en ContentBlock
 * pageSlug "_site". No se traducen.
 */
export const PUT = withErrorHandling("site-settings:save", async (request: Request) => {
  const guard = await requireAdmin({ request });
  if (guard.response) return guard.response;

  const body = await readJsonBody(request, siteSettingsSchema, 8 * 1024);
  if (body.response) return body.response;

  const values: SiteSettings = {
    name: body.data.name,
    email: body.data.email,
    phone: body.data.phone ?? "",
    seoDescription: body.data.seoDescription,
  };

  await prisma.$transaction(
    (Object.keys(SITE_SETTINGS_KEYS) as Array<keyof SiteSettings>).map((field) =>
      prisma.contentBlock.upsert({
        where: {
          pageSlug_blockKey: {
            pageSlug: SITE_SETTINGS_PAGE,
            blockKey: SITE_SETTINGS_KEYS[field],
          },
        },
        update: { content: values[field] },
        create: {
          pageSlug: SITE_SETTINGS_PAGE,
          blockKey: SITE_SETTINGS_KEYS[field],
          content: values[field],
        },
      }),
    ),
  );

  return NextResponse.json({ settings: values });
});
