"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Registra cada página vista de la web pública en /api/track (analítica
 * propia y sin cookies: ver src/lib/analytics.ts). Se monta una vez en el
 * layout público y se dispara en cada navegación (usePathname).
 *
 * - Respeta Do Not Track y Global Privacy Control: si el navegador los
 *   activa, no se envía nada.
 * - No se ejecuta en el panel ni en el login.
 * - El referente (document.referrer) solo se manda en la primera vista:
 *   en las navegaciones internas de Next sigue valiendo el de la entrada.
 * - sendBeacon no retrasa la navegación; si no existe, fetch keepalive.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const firstView = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/backstage") || pathname.startsWith("/auth")) return;

    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    const win = window as Window & { doNotTrack?: string };
    if (nav.doNotTrack === "1" || win.doNotTrack === "1" || nav.globalPrivacyControl === true) {
      return;
    }

    // Evita el doble envío del modo estricto de React y de re-renderizados.
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const referrer = firstView.current ? document.referrer || undefined : undefined;
    firstView.current = false;
    const payload = JSON.stringify({ path: pathname, referrer });

    try {
      // Cuerpo de texto: sendBeacon lo envía como text/plain, sin preflight.
      if (typeof nav.sendBeacon === "function" && nav.sendBeacon("/api/track", payload)) {
        return;
      }
    } catch {
      // algunos navegadores lanzan si el beacon está bloqueado: se usa fetch
    }
    fetch("/api/track", {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
