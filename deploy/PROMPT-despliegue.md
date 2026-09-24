# Despliegue de la web nueva de DIDEROT en su VM (diderot.usal.es)

Soy Enrique (técnico del IUCE). Quiero dejar desplegada en esta máquina la
**web nueva del grupo de investigación DIDEROT** (`diderot.usal.es`, que ya
apunta aquí por DNS). Sigue `deploy/DESPLIEGUE.md` del repositorio; este
texto fija el orden, los puntos de control y las reglas.

Contexto que debes respetar:

- La web anterior era un **WordPress hackeado**. Si encuentras restos de él
  en esta máquina (Apache con vhosts de WordPress, `/var/www/...`, MySQL…),
  **no los borres ni los reutilices**: infórmame y espera instrucciones.
- Stack: Next.js 14 + Prisma + PostgreSQL 16 en Docker (`Dockerfile` y
  `docker-compose.prod.yml` ya incluidos), detrás de Apache o nginx con HTTPS.
- La app solo escucha en `127.0.0.1:3000`; la BD no publica puertos.

## Fase 0 — Inventario (INFORMA Y ESPERA MI OK)

1. SO y versión, `free -h`, `df -h`, `nproc`, `uptime`.
2. ¿Hay Docker Engine + `docker compose` v2? ¿Apache o nginx instalados y en
   marcha? ¿certbot? `ss -tlnp` para ver puertos ocupados (80/443/3000).
3. Cortafuegos (ufw/iptables/nftables): qué está abierto. **No cambies
   nada todavía**; propón los cambios (solo 22 restringido, 80 y 443).
4. Resume y propón: proxy a usar (Apache o nginx), puerto de la app y si
   hace falta instalar algo. Espera mi ok.

## Fase 1 — Código y `.env`

- Clona el repositorio en `/opt/diderot-web` (te daré acceso si es privado).
- `cp .env.production.example .env && chmod 600 .env` y rellénalo: genera tú
  `POSTGRES_PASSWORD` (`openssl rand -hex 24`), `NEXTAUTH_SECRET`
  (`openssl rand -base64 32`), `ADMIN_PASSWORD` y `TECH_ADMIN_PASSWORD`
  (≥ 16 caracteres). Las credenciales de Resend te las paso yo. **No
  muestres secretos en el chat** salvo las dos contraseñas del panel al final.

## Fase 2 — Contenedores y datos

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d db
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml up -d app
curl -fsS http://127.0.0.1:3000/api/health
```

Si el `build` se queda sin memoria, propón swap temporal antes de seguir.

## Fase 3 — Proxy y HTTPS (CON MI OK EXPLÍCITO)

Usa `deploy/apache/diderot.usal.es.conf` o `deploy/nginx/diderot.usal.es.conf`
y certbot (o el certificado de la USAL si te lo indico). Enséñame el diff de
configuración antes de recargar el servidor web.

## Fase 4 — Verificación

- `https://diderot.usal.es`, `/en`, `/publicaciones`, `/grupo`, `/eventos`.
- `http://` redirige a `https://`; `/wp-login.php` responde 410.
- Cabeceras: `curl -sI https://diderot.usal.es` muestra HSTS y CSP.
- Login del panel `/backstage` con la contraseña nueva; subir una imagen en
  Archivos y verla en su URL pública; enviar el formulario de contacto (llega
  el correo a `CONTACT_TO` y aparece en Mensajes).
- Desde fuera de la máquina, los puertos 3000 y 5432 NO responden.

## Fase 5 — Copias de seguridad

Ejecuta `sh deploy/backup-prod.sh` una vez, comprueba los ficheros en
`backups/` y programa el cron diario (ver `deploy/DESPLIEGUE.md`).

## Informe final

URL, consumo (`docker stats --no-stream`), disco libre, las dos contraseñas
del panel, cambios hechos fuera de `/opt/diderot-web` (proxy, cortafuegos,
cron) y cualquier decisión tomada sobre la marcha.

## Reglas duras

- Nada destructivo sin mi ok. No tocar otros servicios de la máquina.
- Si algo no cuadra con lo descrito, **para y pregúntame**.
