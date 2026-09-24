# DIDEROT — Web del grupo de investigación

Web pública del **Grupo de Investigación Reconocido DIDEROT — Didácticas
Digitales de la Expresión Musical y las Artes Performativas** de la
**Universidad de Salamanca** (adscrito al IUCE), en `diderot.usal.es`, con
panel de administración para que el personal gestione todo el contenido sin
programar.

Sustituye a la web anterior (WordPress, comprometida). Está construida con el
**mismo stack, arquitectura y diseño que la web del IUCE** (`IUCE-WEB`),
adaptados a la identidad de DIDEROT.

## Stack

- **Next.js 14** (App Router, salida `standalone`) + **TypeScript 5** estricto
- **Tailwind CSS 3** — tokens de marca en `tailwind.config.ts` + `src/app/globals.css`
- **PostgreSQL 16** + **Prisma 6**
- **NextAuth.js v5** (Credentials, bcrypt, JWT) para el panel
- **Resend** (formulario de contacto) · **DeepL** opcional (traducción ES→EN)
- **Vitest** · **Docker** (app + BD) detrás de Apache/nginx con HTTPS

## Puesta en marcha (desarrollo)

```bash
npm install                 # dependencias + cliente Prisma
cp .env.example .env        # valores de desarrollo listos para usar
docker compose up -d        # PostgreSQL local en 127.0.0.1:5436
npm run db:push             # crea el esquema
npm run db:seed             # contenido real + cuentas SUPER_ADMIN
npm run dev                 # http://localhost:3000
```

Panel: `http://localhost:3000/backstage` — en desarrollo, `diderot@usal.es` /
`diderot-admin-dev` (la semilla se niega a usar esa contraseña en producción).

Otros comandos: `npm run build`, `npm run start`, `npm run lint`,
`npm run test`, `npm run db:backup`.

## Producción

`docker-compose.prod.yml` + `Dockerfile` (imagen mínima, usuario sin
privilegios, FS de solo lectura, BD en red interna sin puertos publicados).
Guía completa, proxy inverso (Apache/nginx), copias de seguridad y lista de
comprobación de seguridad en **[`deploy/DESPLIEGUE.md`](deploy/DESPLIEGUE.md)**.

## Identidad visual

Misma maquetación, componentes y animaciones que la web del IUCE (aparición
al hacer scroll, contadores animados, tarjetas que se elevan, menú con
desplegables, modo claro/oscuro, ES/EN), con la paleta del logotipo de
DIDEROT:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `diderot-indigo` | `#29235C` | `#3A3187` | fondos de botones, bandas, fechas (texto blanco) |
| `ink` | `#29235C` | `#CFC9F7` | titulares |
| `diderot-violet` | `#4A3FB4` | `#B4ACF5` | enlaces y foco |
| `diderot-amber` | `#A15800` | `#F2A541` | acentos de texto (AA) |
| `diderot-gold` | `#DF8602` | `#DF8602` | ámbar del logo, solo decorativo |

Contrastes WCAG AA verificados en ambos temas. Firma visual propia:
`<SoundWave />` (barras de ecualizador animadas) y `.staff-lines`
(pentagrama). La preferencia de tema se guarda en `localStorage['diderot-theme']`.

## Estructura

```
src/
  app/
    (public)/               # web pública: /, /grupo, /investigacion,
                            #   /publicaciones, /transferencia, /formacion,
                            #   /eventos, /noticias, /contacto, legales
    (admin)/backstage/      # panel de administración
    api/                    # API del panel, contacto, analítica, salud
    uploads/[...path]/      # sirve los archivos subidos (fuera de public/)
  components/               # layout, ui, admin, grupo, investigacion…
  lib/
    content/blocks/         # textos y listas editables, un módulo por página
    site.ts                 # datos fijos del sitio
    uploads.ts              # subidas seguras (lista cerrada + firma binaria)
prisma/
  schema.prisma             # modelo de datos
  seed.ts, data/            # contenido real inicial (ver fuentes abajo)
deploy/                     # guía de despliegue, Apache/nginx, copias
```

## Contenido y fuentes

- **Portada y textos del grupo**: captura de la web antigua en Internet
  Archive (abril de 2024), única página recuperable.
- **Equipo, líneas, proyectos, publicaciones y tesis**: Portal de Producción
  Científica de la USAL (grupo 12132, datos a 10-09-2026) — 19 personas,
  13 proyectos, 211 publicaciones.
- **Eventos**: carteles del Seminario Internacional (2026).
- Todo es editable desde el panel; los textos marcados como provisionales
  deben revisarse con el grupo.

## Seguridad (resumen)

Credenciales solo creadas por un SUPER_ADMIN, bcrypt, límite de intentos de
acceso, validación zod en todas las API, comprobación de origen en las
mutaciones del panel, subidas con lista cerrada de tipos y comprobación de
firma (sin SVG/HTML), CSP y cabeceras de seguridad, analítica sin cookies,
contenedores endurecidos y BD sin exposición. Ver `deploy/DESPLIEGUE.md`.
