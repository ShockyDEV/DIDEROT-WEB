# syntax=docker/dockerfile:1
#
# Imagen de producción de la web de DIDEROT (Next.js 14, salida standalone).
#
#   deps     → dependencias (npm ci) con el cliente Prisma generado
#   builder  → compila la app; también sirve para tareas puntuales (esquema
#              de BD y semilla) mediante el servicio «migrate» del compose
#   runner   → imagen final mínima: solo server.js + estáticos, usuario sin
#              privilegios, sin herramientas de compilación
#
# bookworm-slim (glibc) en vez de alpine: sharp y los motores de Prisma
# funcionan sin sorpresas.

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── Dependencias ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ── Compilación (y herramientas de BD) ──────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ── Imagen final ────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOADS_DIR=/app/uploads

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --no-create-home nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Archivos subidos desde el panel (volumen persistente) y caché de imágenes.
RUN mkdir -p /app/uploads /app/.next/cache \
  && chown -R nextjs:nodejs /app/uploads /app/.next/cache

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
