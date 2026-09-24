import { prisma } from "@/lib/prisma";

/**
 * Comprobación de salud para Docker y la monitorización del servidor:
 * 200 si la app responde y la base de datos contesta; 503 si no. No devuelve
 * detalles internos (versiones, errores) a propósito.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
