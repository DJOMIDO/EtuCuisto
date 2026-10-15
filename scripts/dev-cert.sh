#!/usr/bin/env bash
# Certificat de dev : CA locale + certificat serveur signé par cette CA, sans invitation
# sudo (mkcert demande le mot de passe macOS et n'inclut que localhost dans le SAN).
#
# Pourquoi l'HTTPS en dev : @neondatabase/auth impose les cookies « __Secure-…; Secure »,
# rejetés par Safari sur toute origine HTTP (même localhost) → sessions impossibles en
# http. Le LAN (téléphone) exige donc https. Et un simple certificat auto-signé ne passe
# pas sur mobile : Chrome Android refuse tout contournement, iOS n'offre « Visiter quand
# même » que pour les erreurs contournables. La solution fiable = installer la CA (.cert/
# dev-ca.pem) comme racine de confiance sur chaque appareil ; après ça, aucune alerte.
#
# Régénère le certificat serveur (.cert/dev-cert.pem) s'il manque, expire bientôt, n'est
# pas signé par cette CA, ou si la liste des IP privées change (l'IP d'un hotspot varie).
set -euo pipefail

cd "$(dirname "$0")/.."
CA_KEY=".cert/dev-ca-key.pem"
CA_CRT=".cert/dev-ca.pem"
KEY=".cert/dev-key.pem"
CERT=".cert/dev-cert.pem"

# IP privées (RFC 1918) de toutes les interfaces actives.
current_ips=$(ifconfig | awk '$1 == "inet" && ($2 ~ /^(10\.|192\.168\.)/ || $2 ~ /^172\.(1[6-9]|2[0-9]|3[01])\./) { print $2 }' | sort -u)

san="DNS:localhost,IP:127.0.0.1"
for ip in $current_ips; do
  san="$san,IP:$ip"
done

mkdir -p .cert

# Racine : créée une seule fois ; c'est ce fichier (public) qu'installe chaque appareil.
if [ ! -f "$CA_CRT" ]; then
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$CA_KEY" -out "$CA_CRT" -days 3650 \
    -subj "/CN=EtuCuisto dev CA" \
    -addext "basicConstraints=critical,CA:TRUE" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" 2>/dev/null
  echo "CA racine cree : $CA_CRT — a installer en confiance sur iPhone/Android." >&2
fi

needs_regen=0
if [ ! -f "$CERT" ] || ! openssl x509 -checkend 2592000 -noout -in "$CERT" >/dev/null 2>&1; then
  needs_regen=1
elif ! openssl verify -CAfile "$CA_CRT" "$CERT" >/dev/null 2>&1; then
  # pas signé par notre CA (ancien certificat auto-signé, ou CA régénérée)
  needs_regen=1
else
  cert_ips=$(openssl x509 -in "$CERT" -noout -ext subjectAltName \
    | grep -oE 'IP Address:[^,]+' | sed 's/IP Address://;s/ //g' | sort -u)
  [ "$cert_ips" != "$current_ips" ] && needs_regen=1
fi

if [ "$needs_regen" = "1" ]; then
  extfile=$(mktemp)
  csr="${extfile}.csr"
  printf 'subjectAltName=%s\nextendedKeyUsage=serverAuth\nkeyUsage=critical,digitalSignature,keyEncipherment\nbasicConstraints=critical,CA:FALSE\n' "$san" > "$extfile"
  openssl req -new -newkey rsa:2048 -nodes -keyout "$KEY" -subj "/CN=EtuCuisto dev" -out "$csr" 2>/dev/null
  openssl x509 -req -in "$csr" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -days 365 -extfile "$extfile" -out "$CERT" 2>/dev/null
  rm -f "$extfile" "$csr"
  echo "Certificat serveur regenere (SAN : $san)" >&2
fi
