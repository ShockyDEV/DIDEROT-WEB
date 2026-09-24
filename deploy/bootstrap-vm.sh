#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────
# Preparación de la VM de DIDEROT (diderot.usal.es). Se ejecuta UNA vez, con
# sudo y desde tu usuario (no como root), junto a la carpeta nginx/:
#
#     sudo bash bootstrap-vm.sh
#
#   1. Instala Docker (con compose y buildx) y nginx.
#   2. Añade tu usuario al grupo docker y crea /opt/diderot-web.
#   3. Deja la clave del certificado lista para nginx. La del CPD está cifrada
#      con la contraseña de tu usuario: openssl te la pedirá.
#   4. Activa el sitio en nginx (nginx/diderot.usal.es.conf).
#   5. Abre 80 y 443 en el cortafuegos (ufw).
#
# No toca SSH, usuarios ni contraseñas. Se puede repetir sin romper nada.
# ───────────────────────────────────────────────────────────────────────────
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Ejecútalo con sudo: sudo bash $0"; exit 1; }
USUARIO="${SUDO_USER:-}"
if [ -z "$USUARIO" ] || [ "$USUARIO" = root ]; then
  echo "Lánzalo con sudo desde tu usuario, no como root."
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_CONF="$DIR/nginx/diderot.usal.es.conf"
CERT=/etc/ssl/certs/diderot_Cert_bundle.pem
KEY=/etc/ssl/private/diderot.usal.es.key
[ -f "$SITE_CONF" ] || { echo "Falta $SITE_CONF"; exit 1; }
[ -f "$CERT" ] || { echo "Falta el certificado $CERT"; exit 1; }

# Huella de una clave pública (para comprobar que clave y certificado casan).
pubhash() { openssl pkey -pubin -outform der 2>/dev/null | sha256sum | cut -d' ' -f1; }

echo "==> 1/5 Docker y nginx"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
if ! apt-get install -y -q docker.io docker-compose-v2 docker-buildx nginx; then
  echo "    (paquetes de Ubuntu no disponibles: repositorio oficial de Docker)"
  apt-get install -y -q ca-certificates curl nginx
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
docker compose version

echo "==> 2/5 Grupo docker y /opt/diderot-web"
usermod -aG docker "$USUARIO"
install -d -o "$USUARIO" -g "$USUARIO" -m 755 /opt/diderot-web

echo "==> 3/5 Clave del certificado"
umask 077
CERT_HASH="$(openssl x509 -in "$CERT" -noout -pubkey | pubhash)"
if [ -s "$KEY" ] && [ "$(openssl pkey -in "$KEY" -pubout 2>/dev/null | pubhash)" = "$CERT_HASH" ]; then
  echo "    Ya estaba lista: $KEY"
else
  CANDIDATAS=()
  for f in /etc/ssl/private/*; do
    [ -f "$f" ] || continue
    case "$f" in *snakeoil*|"$KEY"|*.tmp) continue ;; esac
    grep -q "PRIVATE KEY" "$f" 2>/dev/null && CANDIDATAS+=("$f")
  done
  [ "${#CANDIDATAS[@]}" -gt 0 ] || { echo "No encuentro la clave del CPD en /etc/ssl/private"; exit 1; }
  for f in "${CANDIDATAS[@]}"; do
    echo "    Clave del CPD: $f"
    echo "    Si está cifrada, escribe la contraseña de tu usuario cuando la pida."
    if openssl pkey -in "$f" -out "$KEY.tmp" &&
      [ "$(openssl pkey -in "$KEY.tmp" -pubout | pubhash)" = "$CERT_HASH" ]; then
      install -m 600 -o root -g root "$KEY.tmp" "$KEY"
      rm -f "$KEY.tmp"
      echo "    Lista (sin cifrar, solo root): $KEY"
      break
    fi
    rm -f "$KEY.tmp"
  done
  [ -s "$KEY" ] || { echo "La clave no casa con el certificado o la contraseña no es correcta."; exit 1; }
fi
umask 022

echo "==> 4/5 nginx"
install -m 644 "$SITE_CONF" /etc/nginx/sites-available/diderot.usal.es.conf
ln -sf /etc/nginx/sites-available/diderot.usal.es.conf /etc/nginx/sites-enabled/diderot.usal.es.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

echo "==> 5/5 Cortafuegos (80 y 443)"
ufw allow 80/tcp
ufw allow 443/tcp
ufw status | sed -n '1,20p'

echo
echo "Listo: $(docker --version) · $(nginx -v 2>&1)"
echo "Cierra la sesión SSH y vuelve a entrar para que se aplique el grupo docker."
echo "El despliegue de la web ya no necesita sudo."
