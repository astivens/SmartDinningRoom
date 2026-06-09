#!/usr/bin/env bash
set -euo pipefail

# ─── Configuración ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/reports"
ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable"
NETWORK="smartdiningroom_default"

# Credenciales de prueba (sobreescribibles por variables de entorno)
ZAP_TEST_EMAIL="${ZAP_TEST_EMAIL:-test@example.com}"
ZAP_TEST_PASSWORD="${ZAP_TEST_PASSWORD:-TestPassword123!}"

API_URL="${API_URL:-http://localhost:3002}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5174}"

# ─── Funciones ────────────────────────────────────────────────────────────────
log() { echo "[ZAP] $*"; }

check_target_up() {
  local url="$1"
  local name="$2"
  log "Verificando que $name esté disponible en $url ..."
  for i in {1..15}; do
    if curl -sf --max-time 3 "$url" > /dev/null 2>&1; then
      log "$name está disponible."
      return 0
    fi
    log "Intento $i/15 — esperando $name ..."
    sleep 4
  done
  log "ERROR: $name no responde en $url. Abortando."
  exit 1
}

# ─── Validaciones previas ─────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker no está instalado o no está en PATH." >&2
  exit 1
fi

mkdir -p "$REPORTS_DIR"

check_target_up "$API_URL/api/health" "API Backend"
check_target_up "$FRONTEND_URL" "Frontend"

# ─── Determinar si el contenedor puede alcanzar localhost del host ─────────────
# En Linux, host.docker.internal puede no existir; usamos --network host en su lugar
DOCKER_EXTRA_ARGS=()
if [[ "$(uname -s)" == "Linux" ]]; then
  DOCKER_EXTRA_ARGS+=("--network=host")
  RESOLVED_API_URL="$API_URL"
  RESOLVED_FRONTEND_URL="$FRONTEND_URL"
else
  DOCKER_EXTRA_ARGS+=("--add-host=host.docker.internal:host-gateway")
  RESOLVED_API_URL="${API_URL/localhost/host.docker.internal}"
  RESOLVED_FRONTEND_URL="${FRONTEND_URL/localhost/host.docker.internal}"
fi

# ─── Actualizar las URLs en el archivo de automatización ─────────────────────
TMP_CONFIG="$(mktemp /tmp/zap-automation-XXXXXX.yml)"
sed \
  -e "s|http://localhost:3002|${RESOLVED_API_URL}|g" \
  -e "s|http://localhost:5174|${RESOLVED_FRONTEND_URL}|g" \
  "${SCRIPT_DIR}/automation.yml" > "$TMP_CONFIG"

log "Iniciando OWASP ZAP baseline + API scan ..."
log "API Target : $RESOLVED_API_URL"
log "Frontend Target: $RESOLVED_FRONTEND_URL"
log "Reportes en: $REPORTS_DIR"

# ─── Ejecutar ZAP ─────────────────────────────────────────────────────────────
docker run --rm \
  "${DOCKER_EXTRA_ARGS[@]}" \
  -v "${REPORTS_DIR}:/zap/reports:rw" \
  -v "${TMP_CONFIG}:/zap/automation.yml:ro" \
  -e "ZAP_TEST_EMAIL=${ZAP_TEST_EMAIL}" \
  -e "ZAP_TEST_PASSWORD=${ZAP_TEST_PASSWORD}" \
  "$ZAP_IMAGE" \
  zap.sh -cmd \
    -autorun /zap/automation.yml

EXIT_CODE=$?
rm -f "$TMP_CONFIG"

# ─── Resultado ────────────────────────────────────────────────────────────────
if [[ $EXIT_CODE -eq 0 ]]; then
  log "Escaneo completado. Sin alertas de nivel High."
elif [[ $EXIT_CODE -eq 2 ]]; then
  log "ADVERTENCIA: Se encontraron alertas de nivel Medium o inferior."
  log "Revisa el reporte en: $REPORTS_DIR/"
  exit 0
else
  log "FALLO: Se encontraron alertas de nivel High. Revisa: $REPORTS_DIR/"
  exit 1
fi

log "Reportes generados en $REPORTS_DIR/"
