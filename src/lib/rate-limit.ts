/**
 * Limitador de peticiones en memoria (ventana deslizante). Suficiente para
 * un despliegue de una sola instancia como el del IUCE; si algún día la web
 * corre en varias instancias, sustituir por Redis o similar.
 *
 * No persiste entre reinicios (aceptable: protege de ráfagas de abuso, no
 * es un registro de auditoría).
 */
const buckets = new Map<string, number[]>();

const MAX_KEYS = 10_000; // corta el crecimiento si alguien rota claves

/**
 * true si la petición está dentro del límite (y la registra);
 * false si se ha superado `max` peticiones en la ventana.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    // poda de emergencia: elimina las claves sin actividad en la ventana
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

/** IP del cliente detrás del proxy (Apache/nginx) o "local" en desarrollo. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}
