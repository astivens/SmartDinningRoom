#!/usr/bin/env bash
set -euo pipefail

# ─── Configuración ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
JMETER_IMAGE="justb4/jmeter:latest"

BASE_URL="${BASE_URL:-localhost}"
PORT="${PORT:-3002}"
VALID_EMAIL="${VALID_EMAIL:-admin@test.com}"
VALID_PASS="${VALID_PASS:-Admin1234!}"

# ─── Funciones ────────────────────────────────────────────────────────────────
log() { echo "[JMeter] $*"; }

check_target_up() {
  log "Verificando que la API esté disponible en http://${BASE_URL}:${PORT}/api/health ..."
  for i in {1..15}; do
    if curl -sf --max-time 3 "http://${BASE_URL}:${PORT}/api/health" > /dev/null 2>&1; then
      log "API disponible."
      return 0
    fi
    log "Intento $i/15 — esperando API ..."
    sleep 4
  done
  log "ERROR: La API no responde. Abortando."
  exit 1
}

# ─── Validaciones ─────────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker no está instalado." >&2
  exit 1
fi

mkdir -p "$RESULTS_DIR"
check_target_up

# ─── Determinar networking en Linux ──────────────────────────────────────────
DOCKER_NET_ARGS=()
if [[ "$(uname -s)" == "Linux" ]]; then
  DOCKER_NET_ARGS+=("--network=host")
  RESOLVED_HOST="localhost"
else
  DOCKER_NET_ARGS+=("--add-host=host.docker.internal:host-gateway")
  RESOLVED_HOST="host.docker.internal"
fi

log "Ejecutando plan de seguridad JMeter..."
log "Target: http://${BASE_URL}:${PORT}"

docker run --rm \
  "${DOCKER_NET_ARGS[@]}" \
  -v "${SCRIPT_DIR}:/jmeter/tests:ro" \
  -v "${RESULTS_DIR}:/jmeter/tests/results:rw" \
  -w /jmeter/tests \
  "$JMETER_IMAGE" \
  -n \
  -t security-plan.jmx \
  -JBASE_URL="${RESOLVED_HOST}" \
  -JPORT="${PORT}" \
  -JVALID_EMAIL="${VALID_EMAIL}" \
  -JVALID_PASS="${VALID_PASS}" \
  -l results/jmeter-results.jtl \
  -e \
  -o results/html-report

EXIT_CODE=$?

# ─── Resultado ────────────────────────────────────────────────────────────────
if [[ $EXIT_CODE -eq 0 ]]; then
  log "Pruebas completadas. Sin errores de aserción."
else
  log "ATENCIÓN: Algunas aserciones fallaron. Revisa los reportes en: $RESULTS_DIR/"
fi

log ""
log "Resultados disponibles en:"
log "  CSV individuales : $RESULTS_DIR/*.csv"
log "  Reporte JTL      : $RESULTS_DIR/jmeter-results.jtl"
log "  Reporte HTML     : $RESULTS_DIR/html-report/index.html"

exit $EXIT_CODE
