# Despliegue de la web de DIDEROT (diderot.usal.es)

Guía paso a paso para la VM nueva (DNS `diderot.usal.es` → `212.128.132.41`).
Arquitectura:

```
Internet ──HTTPS 443──▶ Apache/nginx (proxy inverso, certificado)
                              │  http://127.0.0.1:3000
                              ▼
                    diderot-web-app  (Docker, Next.js, usuario sin privilegios,
                              │        FS de solo lectura)
                              │  red interna «backend» (sin salida a Internet)
                              ▼
                    diderot-web-db   (Docker, PostgreSQL 16, sin puertos publicados)

Volúmenes: diderot-web_pgdata (BD) · diderot-web_uploads (archivos del panel)
```

> La web antigua era un WordPress comprometido. **No reutilices nada de
> aquella instalación** (ni ficheros, ni base de datos, ni usuarios, ni
> contraseñas). El contenido antiguo se migra a mano/por script a partir de
> una copia, nunca ejecutando código de ella.

## 0. Requisitos de la máquina

- Linux actualizado (Ubuntu 22.04/24.04 o Debian 12) con actualizaciones de
  seguridad automáticas (`unattended-upgrades`).
- Docker Engine + plugin `docker compose` (v2), `git`.
- Apache 2.4 **o** nginx, y `certbot` (o el certificado institucional).
- Cortafuegos: solo 22 (SSH, idealmente restringido a la red USAL/VPN), 80 y
  443. Ni el 3000 ni el 5432 deben estar abiertos (el compose ya los liga a
  localhost / red interna, pero mejor doble barrera).
- SSH solo con clave, sin login de root por contraseña; `fail2ban`
  recomendado.
- Recursos orientativos: 2 vCPU, 2–4 GB de RAM (el `next build` es el pico:
  1–2 GB), ~5 GB de disco para imágenes, BD y archivos.

## 1. Código

```bash
sudo mkdir -p /opt/diderot-web && sudo chown "$USER" /opt/diderot-web
git clone <URL-del-repositorio> /opt/diderot-web
cd /opt/diderot-web
```

## 2. Variables de entorno

```bash
cp .env.production.example .env
chmod 600 .env
nano .env
```

Rellena como mínimo: `POSTGRES_PASSWORD` (`openssl rand -hex 24`),
`NEXTAUTH_SECRET` (`openssl rand -base64 32`), `ADMIN_EMAIL` /
`ADMIN_PASSWORD` y `TECH_ADMIN_PASSWORD` (propias, ≥ 12 caracteres: la
semilla se niega a usar las de desarrollo). La web no envía correos (no hay
formulario de contacto), así que no hace falta configurar ningún servicio de
correo.

## 3. Construir y arrancar

```bash
# Construye la app y la imagen de herramientas (migrate) a la vez:
docker compose -f docker-compose.prod.yml --profile tools build
docker compose -f docker-compose.prod.yml up -d db
# Esquema + contenido inicial (idempotente; se puede repetir sin duplicar):
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml up -d app
curl -fsS http://127.0.0.1:3000/api/health     # → {"status":"ok"}
```

## 4. Proxy inverso y HTTPS

**Apache** (`deploy/apache/diderot.usal.es.conf`):

```bash
sudo a2enmod proxy proxy_http ssl headers rewrite http2
sudo cp deploy/apache/diderot.usal.es.conf /etc/apache2/sites-available/
sudo certbot certonly --apache -d diderot.usal.es      # o certificado USAL
sudo a2ensite diderot.usal.es && sudo apachectl configtest && sudo systemctl reload apache2
```

**nginx**: ídem con `deploy/nginx/diderot.usal.es.conf`.

Comprobación: `https://diderot.usal.es` carga, `/en` también, y
`https://diderot.usal.es/wp-login.php` responde **410**.

## 5. Primer acceso al panel

`https://diderot.usal.es/backstage` con la cuenta `ADMIN_EMAIL`. Desde
**Configuración**: cambia la contraseña y da de alta al resto de cuentas
(solo un SUPER_ADMIN puede crearlas). Después puedes borrar las contraseñas
del `.env` (la semilla solo las usa al crear las cuentas).

## 6. Copias de seguridad

```bash
sh deploy/backup-prod.sh            # BD + archivos → backups/ (retención 30)
crontab -e                          # diaria a las 03:15:
15 3 * * * cd /opt/diderot-web && sh deploy/backup-prod.sh >> backups/backup.log 2>&1
```

Copia `backups/` periódicamente **fuera** de la VM. Restauración: ver la
cabecera de `deploy/backup-prod.sh`.

## 7. Actualizar la web

```bash
cd /opt/diderot-web
sh deploy/backup-prod.sh                                   # siempre antes
git pull
# «--profile tools» reconstruye también la imagen de migrate: sin él, run
# usaría la imagen anterior (esquema viejo) y la BD no se actualizaría.
docker compose -f docker-compose.prod.yml --profile tools build
# solo si cambió prisma/schema.prisma o los datos de la semilla:
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml up -d app
docker image prune -f
```

## 8. Operación

- Logs: `docker compose -f docker-compose.prod.yml logs -f app`
- Estado: `docker compose -f docker-compose.prod.yml ps` (ambos `healthy`)
- Reinicio: `docker compose -f docker-compose.prod.yml restart app`

## Lista de comprobación de seguridad

- [ ] `.env` con permisos 600 y secretos propios (nada de valores de ejemplo).
- [ ] Solo 22/80/443 abiertos; 3000 y 5432 inaccesibles desde fuera.
- [ ] HTTPS con HSTS; HTTP redirige a HTTPS.
- [ ] Contraseñas del panel cambiadas tras el primer acceso; cuentas mínimas.
- [ ] Copias diarias funcionando y copiadas fuera de la VM.
- [ ] Actualizaciones de seguridad del sistema automáticas; `docker compose
      build --pull` periódico para actualizar las imágenes base.
- [ ] Ningún resto del WordPress antiguo en la máquina.
