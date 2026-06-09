#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

python3 "${ROOT_DIR}/docs/reportes/generar-integracion-html.py" >/dev/null 2>&1 || true
python3 "${ROOT_DIR}/docs/reportes/generar-resumen.py" >/dev/null 2>&1 || true

SUMMARY_HTML="${ROOT_DIR}/docs/reportes/resumen-ejecutivo.html"
UNIT_HTML="${ROOT_DIR}/server/coverage-unit/lcov-report/index.html"
INT_HTML="${ROOT_DIR}/server/coverage-integration/integration-report.html"
PW_HTML="${ROOT_DIR}/tests/security/browserstack/playwright-report/index.html"
ZAP_HTML="${ROOT_DIR}/tests/security/zap/zap-baseline.html"

latest_jmeter_dir="$(ls -1dt "${ROOT_DIR}"/tests/security/jmeter/results/html-report-load-* 2>/dev/null | head -n 1 || true)"
JMETER_HTML=""
if [[ -n "$latest_jmeter_dir" ]]; then
  JMETER_HTML="${latest_jmeter_dir}/index.html"
fi

open_if_exists() {
  local path="$1"
  if [[ -f "$path" ]]; then
    xdg-open "$path" >/dev/null 2>&1 || true
    echo "Abierto: $path"
  else
    echo "No encontrado: $path"
  fi
}

open_if_exists "$SUMMARY_HTML"
open_if_exists "$UNIT_HTML"
open_if_exists "$INT_HTML"
open_if_exists "$PW_HTML"
if [[ -n "$JMETER_HTML" ]]; then
  open_if_exists "$JMETER_HTML"
else
  echo "No encontrado: reporte JMeter html-report-load-*"
fi
open_if_exists "$ZAP_HTML"
