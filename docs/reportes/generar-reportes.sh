#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVER_DIR="${ROOT_DIR}/server"
BROWSERSTACK_DIR="${ROOT_DIR}/tests/security/browserstack"
JMETER_DIR="${ROOT_DIR}/tests/security/jmeter"
JMETER_RESULTS_DIR="${JMETER_DIR}/results"
ZAP_DIR="${ROOT_DIR}/tests/security/zap"

API_URL="${API_URL:-http://localhost:3002}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5174}"
TEST_EMAIL="${TEST_EMAIL:-admin@smartcomedor.edu}"
TEST_PASS="${TEST_PASS:-admin123}"

log() { echo "[reportes] $*"; }

check_url() {
  local url="$1"
  local name="$2"
  if ! curl -sf --max-time 3 "$url" >/dev/null 2>&1; then
    log "ERROR: $name no responde en $url"
    log "Levanta primero backend/frontend y reintenta."
    exit 1
  fi
}

log "Validando servicios..."
check_url "${API_URL}/api/health" "API"
check_url "${FRONTEND_URL}/login" "Frontend"

log "Generando cobertura HTML de unitarias..."
cd "$SERVER_DIR"
npx jest --testPathPattern=tests/unit --coverage --coverageDirectory=coverage-unit >/dev/null

log "Generando cobertura HTML de integración..."
npx jest --testPathPattern=tests/integration --runInBand --json --outputFile=coverage-integration/jest-integration-results.json >/dev/null
python3 "${ROOT_DIR}/docs/reportes/generar-integracion-html.py" >/dev/null

log "Ejecutando Playwright (seguridad y portabilidad)..."
cd "$BROWSERSTACK_DIR"
npx playwright test security.test.ts >/dev/null || true
npx playwright test portability.test.ts >/dev/null || true

log "Ejecutando JMeter carga corta..."
cd "$JMETER_DIR"
rm -f results/load-test.jtl results/load-test.csv
MODE=load LOAD_THREADS=10 LOAD_RAMP_SECS=10 LOAD_DURATION_SECS=30 THRESHOLD_MS=1000 TEST_EMAIL="$TEST_EMAIL" TEST_PASS="$TEST_PASS" bash run-load-stress.sh >/dev/null

log "Generando HTML de JMeter en carpeta nueva..."
mkdir -p "$JMETER_RESULTS_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
JMETER_HTML_DIR="results/html-report-load-${TS}"
docker run --rm --network host \
  -v "${JMETER_DIR}:/jmeter/tests:rw" \
  -w /jmeter/tests \
  justb4/jmeter:latest \
  -g results/load-test.jtl -o "${JMETER_HTML_DIR}" >/dev/null

log "Ejecutando ZAP baseline..."
cd "$ROOT_DIR"
docker run --rm --network host \
  -v "${ZAP_DIR}:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "${API_URL}/api/health" -I -J zap-baseline.json -r zap-baseline.html >/dev/null || true

log "Generando resumen ejecutivo entendible..."
python3 "${ROOT_DIR}/docs/reportes/generar-resumen.py" >/dev/null

cat <<EOF

Reportes generados/actualizados:
- ${SERVER_DIR}/coverage-unit/lcov-report/index.html
- ${SERVER_DIR}/coverage-integration/lcov-report/index.html
- ${SERVER_DIR}/coverage-integration/integration-report.html
- ${BROWSERSTACK_DIR}/playwright-report/index.html
- ${JMETER_DIR}/${JMETER_HTML_DIR}/index.html
- ${ZAP_DIR}/zap-baseline.html
- ${ROOT_DIR}/docs/reportes/resumen-ejecutivo.html

EOF
