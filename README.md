# IUCE — Web institucional

Web pública del **Instituto Universitario de Ciencias de la Educación (IUCE)** de
la **Universidad de Salamanca** (`iuce.usal.es`) + panel de administración para
que personal no técnico gestione todo el contenido.

Mismo stack y convenciones que
[`IUCE-Reservas-TFG`](https://github.com/ShockyDEV/IUCE-Reservas-TFG); el panel
de administración replica el patrón de [`mupes`](https://github.com/ShockyDEV/mupes).

## Stack

- **Next.js 14** (App Router) + **TypeScript 5** (modo estricto)
- **Tailwind CSS 3** (tokens de marca en `tailwind.config.ts` + `globals.css`)
- **PostgreSQL 16** + **Prisma 6**
- **NextAuth.js v5** con Credentials (email + contraseña, hash bcrypt)
- **Resend** para el formulario de contacto
- **Vitest** para tests · **Docker** + Apache (reverse proxy, SSL Let's Encrypt)

## Puesta en marcha

```bash
npm install                 # instala dependencias y genera el cliente Prisma
cp .env.example .env        # rellena DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY…
docker compose up -d        # PostgreSQL local en el puerto 5433
npm run db:push             # crea el esquema en la base de datos
npm run db:seed             # contenido real + cuenta SUPER_ADMIN
npm run dev                 # http://localhost:3000
```

**Panel de administración**: `http://localhost:3000/backstage`. La cuenta inicial
la crea el seed (variables `ADMIN_EMAIL` / `ADMIN_PASSWORD`; por defecto
`iuce@usal.es` / `iuce-admin-2026` — cámbiala en producción). Desde
Configuración, la cuenta SUPER_ADMIN da de alta al resto.

Otros comandos: `npm run build`, `npm run start`, `npm run lint`,
`npm run test`, `npm run db:seed`.

## Modo claro / oscuro

Las páginas públicas soportan tema claro y oscuro. La preferencia se guarda en
`localStorage['iuce-theme']` y se aplica añadiendo la clase `.dark` al `<html>`
(ver `src/components/theme-script.tsx` y `theme-toggle.tsx`). Los tokens de color
son variables CSS en `src/app/globals.css`; Tailwind las consume vía
`tailwind.config.ts`, por lo que basta usar clases normales (`bg-surface-card`,
`text-gray-600`, `text-ink`…) para que el tema cambie solo. El panel de
administración será **solo claro** (como en `mupes`).

## Estructura

```
src/
  app/
    layout.tsx              # layout raíz (html/body, tema, toasts)
    globals.css             # tokens de diseño (variables CSS + modo oscuro)
    (public)/               # sitio público (cabecera + footer institucional)
      layout.tsx
      page.tsx              # Inicio
      instituto/ …          # resto de páginas públicas
  components/
    layout/                 # site-header, institutional-footer, theme-toggle…
    ui/                     # button, card, badge, image-placeholder
    theme-script.tsx        # anti-parpadeo de tema
    toast-provider.tsx
  lib/                      # cn (clases Tailwind)
prisma/schema.prisma        # modelo de datos (News, Member, Event, ContactMessage…)
docs/design/                # paquete de handoff: prototipos + design system
public/images/              # logos IUCE y USAL
```

## Diseño (handoff)

`docs/design/` contiene los **prototipos navegables** (`*.dc.html`), el **design
system** (`_ds/`, fuente de verdad visual) y `HANDOFF.md` con la especificación
página por página. Para verlos, servir esa carpeta con un estático
(`npx serve docs/design`) y abrir los `.dc.html`.

## Estado

- [x] Bootstrap del repo: stack, tokens, layout base, modo claro/oscuro
- [x] **Todas las páginas públicas** recreadas de los prototipos: Inicio,
      Instituto, Investigación, Formación, Eventos, Doctorado, Noticias
      (+ detalle por slug), Contacto — con menú móvil accesible
- [x] **Base de datos** sembrada con el contenido real (noticias, miembros,
      grupos, eventos) y **formulario de contacto** end-to-end
      (validación zod → ContactMessage → email Resend)
- [x] **Autenticación** NextAuth v5 Credentials (bcrypt, roles
      ADMIN/SUPER_ADMIN, middleware sobre `/backstage/**` y `/api/admin/**`)
- [x] **Panel de administración completo** (patrón mupes): dashboard con
      recuentos reales, CRUD de noticias con editor TipTap y slug
      automático, Páginas por bloques (ContentEditor), Equipo y miembros,
      Grupos, Eventos, Archivos (dropzone → `/uploads`), Mensajes y
      Configuración (datos del sitio + cuentas)
- [x] **Web pública conectada al gestor**: noticias, bloques de página y
      miembros salen de la BD (con fallback al contenido semilla)
- [x] SEO (`sitemap.xml`, `robots.txt`, metadata OG), tests Vitest (27) y
      build de producción verificado
- [x] **Histórico migrado desde la web original** (export WordPress
      2010–2026): 212 noticias con sus imágenes (`scripts/
      migrate-wordpress.ts`, idempotente), 72 miembros con foto y los
      9 grupos de investigación oficiales verificados (GRIAL UIC 081,
      OCA UIC 313, VisualMed, GROUSAL, DIDEROT, CaUSAL, MOVERE, EduDIG,
      INDIE) con sus logos. `/noticias` con filtros por categoría y
      paginación reales; buscador de miembros en `/instituto`.
- [x] **Auto-traducción ES→EN al guardar** (patrón mupes): DeepL vía
      `DEEPL_API_KEY` (sin clave se omite); rellena `*En` en noticias y
      bloques `:en`; `/api/admin/translate` bajo demanda
- [x] **Todo el contenido editable desde el panel** sin programar:
      noticias/miembros/grupos/eventos por CRUD (miembros con foto,
      portal de investigación y ORCID; grupos con logo y distintivo) y
      el resto de las 8 páginas por bloques de texto y **listas
      estructuradas** (Contenido → Páginas): 24 bloques + 14 listas con
      añadir/eliminar/reordenar e iconos seleccionables. El editor
      TipTap sube imágenes a Archivos directamente.
- [x] **Versión en inglés completa** (`/en/...`): middleware con reescritura y
      cabecera de idioma, registros ES/EN, histórico de noticias traducido;
      área de miembros (`/miembros`, magic link) y panel en `/backstage`
- [x] Repo en GitHub (`ShockyDEV/IUCE-WEB`) y **documentación del proyecto**
      en [`docs/manuales/`](docs/manuales) (memoria, requisitos, diseño,
      documentación técnica y de usuario)
- [ ] Despliegue (Docker app + Apache + SSL) — pendiente
