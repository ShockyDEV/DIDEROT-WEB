/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy (solo en producción: el modo desarrollo de Next
 * necesita eval para el hot reload). Next inyecta scripts en línea (datos de
 * hidratación, script anti-parpadeo del tema, JSON-LD), de ahí
 * 'unsafe-inline' en script-src; aun así la política cierra lo importante:
 * nada de plugins, formularios solo hacia el propio sitio, la web no se puede
 * embeber fuera y los iframes quedan limitados a YouTube (sin cookies) y
 * Google Maps. Las imágenes admiten https: porque las noticias pueden
 * enlazar imágenes externas.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  // No anunciar el framework en las cabeceras.
  poweredByHeader: false,
  // Imagen de producción autocontenida (Dockerfile): server.js + lo mínimo.
  output: "standalone",
  images: {
    // Las imágenes subidas se acotan a ≤1600px al subirlas (sharp); sin esto
    // next/image genera variantes de hasta 3840px que solo gastan CPU y disco.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    const security = [
      // El navegador no debe adivinar tipos MIME (previene sniffing).
      { key: "X-Content-Type-Options", value: "nosniff" },
      // La web no se puede embeber en iframes de otros sitios
      // (clickjacking); los embeds PROPIOS (PDF) son same-origin.
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      // No filtrar la URL completa a sitios externos.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // La web no usa cámara, micrófono, geolocalización ni pagos.
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ];
    if (isProd) {
      security.push({ key: "Content-Security-Policy", value: CSP });
    }
    return [
      { source: "/:path*", headers: security },
      // El panel y el login no deben quedar en cachés intermedias.
      {
        source: "/backstage/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  async redirects() {
    return [
      // ── Redirecciones de la web antigua (WordPress, 2022-2026) ─────────
      // Las entradas vivían en /AAAA/MM/slug/ y conservan el slug en
      // /noticias/slug cuando se migran; si no existe, /noticias/slug da 404
      // con enlace al listado.
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:slug",
        destination: "/noticias/:slug",
        permanent: true,
      },
      { source: "/novedades", destination: "/noticias", permanent: true },
      { source: "/novedades/:path*", destination: "/noticias", permanent: true },
      { source: "/category/:cat*", destination: "/noticias", permanent: true },
      { source: "/tag/:tag*", destination: "/noticias", permanent: true },
      // El feed RSS de WordPress ahora es /feed.xml
      { source: "/feed", destination: "/feed.xml", permanent: true },
      { source: "/feed/:path*", destination: "/feed.xml", permanent: true },
      // Páginas antiguas → su nueva ubicación
      { source: "/about", destination: "/grupo#equipo", permanent: true },
      { source: "/investigadores", destination: "/grupo#equipo", permanent: true },
      { source: "/proyectos", destination: "/investigacion#proyectos", permanent: true },
      { source: "/contact", destination: "/contacto", permanent: true },
      { source: "/privacy-policy", destination: "/privacidad", permanent: true },
      { source: "/instituto", destination: "/grupo", permanent: true },
    ];
  },
};

module.exports = nextConfig;
