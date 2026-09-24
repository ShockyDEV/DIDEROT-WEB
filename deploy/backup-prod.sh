#!/usr/bin/env sh
# Copia de seguridad de PRODUCCIÓN: volcado de la BD + archivos subidos.
#
#   sh deploy/backup-prod.sh
#
# Deja en backups/ (fuera de git) diderot_web-AAAAMMDD-HHMM.sql.gz y
# uploads-AAAAMMDD-HHMM.tar.gz y conserva los 30 más recientes de cada uno.
# Programarlo a diario (crontab -e del usuario que gestiona Docker):
#   15 3 * * * cd /opt/diderot-web && sh deploy/backup-prod.sh >> backups/backup.log 2>&1
# Copiar periódicamente backups/ FUERA de la máquina (otro servidor o disco).
#
# Restaurar la BD:
#   gunzip -c backups/diderot_web-XXXX.sql.gz | docker exec -i diderot-web-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
# Restaurar los archivos:
#   docker run --rm -v diderot-web_uploads:/data -v "$PWD/backups":/backup alpine sh -c 'tar xzf /backup/uploads-XXXX.tar.gz -C /data'
set -eu

cd "$(dirname "$0")/.."
STAMP=$(date +%Y%m%d-%H%M)
KEEP=30
mkdir -p backups

docker exec diderot-web-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  | gzip > "backups/diderot_web-$STAMP.sql.gz"

docker run --rm \
  -v diderot-web_uploads:/data:ro \
  -v "$PWD/backups":/backup \
  alpine tar czf "/backup/uploads-$STAMP.tar.gz" -C /data .

# Retención
ls -1t backups/diderot_web-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm --
ls -1t backups/uploads-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm --

echo "$(date -Iseconds) copia OK: diderot_web-$STAMP.sql.gz + uploads-$STAMP.tar.gz"
