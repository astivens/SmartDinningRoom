#!/usr/bin/env bash
set -euo pipefail

# ─── Configuración ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
JMETER_IMAGE="justb4/jmeter:latest"

BASE_URL="${BASE_URL:-localhost}"
PORT="${PORT:-3002}"
TEST_EMAIL="${TEST_EMAIL:-admin@test.com}"
TEST_PASS="${TEST_PASS:-Admin1234!}"

# Parámetros de carga (sobreescribibles)
LOAD_THREADS="${LOAD_THREADS:-200}"
LOAD_RAMP_SECS="${LOAD_RAMP_SECS:-60}"
LOAD_DURATION_SECS="${LOAD_DURATION_SECS:-300}"
THRESHOLD_MS="${THRESHOLD_MS:-500}"

# Modo de ejecución: "load", "stress", "both" (default)
MODE="${MODE:-both}"

# ─── Funciones ────────────────────────────────────────────────────────────────
log()     { echo "[JMeter] $*"; }
success() { echo "[JMeter] ✔ $*"; }
fail()    { echo "[JMeter] ✘ $*" >&2; }

check_target_up() {
  log "Verificando que la API esté disponible en http://${BASE_URL}:${PORT}/api/health ..."
  for i in {1..20}; do
    if curl -sf --max-time 3 "http://${BASE_URL}:${PORT}/api/health" > /dev/null 2>&1; then
      success "API disponible."
      return 0
    fi
    log "Intento $i/20 — esperando 5s ..."
    sleep 5
  done
  fail "La API no responde. Abortando."
  exit 1
}

run_jmeter() {
  local plan="$1"
  local extra_args="${2:-}"

  docker run --rm \
    --network host \
    -v "${SCRIPT_DIR}:/jmeter/tests" \
    -v "${RESULTS_DIR}:/jmeter/tests/results" \
    -w /jmeter/tests \
    "$JMETER_IMAGE" \
    -n \
    -t "$plan" \
    -JBASE_URL="${BASE_URL}" \
    -JPORT="${PORT}" \
    -JTEST_EMAIL="${TEST_EMAIL}" \
    -JTEST_PASS="${TEST_PASS}" \
    $extra_args \
    -l "results/${plan%.jmx}.jtl"
}

print_summary() {
  local csv="$1"
  local label="$2"
  if [[ ! -f "$csv" ]]; then
    log "Sin datos para $label"
    return
  fi

  echo ""
  echo "─── $label ───────────────────────────────────────────"
  python3 - "$csv" <<'PYEOF'
import sys, csv, statistics

path = sys.argv[1]
rows = []
with open(path) as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

if not rows:
    print("Sin datos")
    sys.exit(0)

times = [int(r['elapsed']) for r in rows if r.get('elapsed','').isdigit()]
successes = sum(1 for r in rows if r.get('success','').lower() == 'true')
total = len(rows)
errors = total - successes
error_rate = (errors / total * 100) if total > 0 else 0

if times:
    times.sort()
    p50 = statistics.median(times)
    p95 = times[int(len(times) * 0.95)] if len(times) > 20 else max(times)
    p99 = times[int(len(times) * 0.99)] if len(times) > 100 else max(times)
    avg = statistics.mean(times)
    print(f"  Total peticiones : {total}")
    print(f"  Errores          : {errors} ({error_rate:.1f}%)")
    print(f"  Promedio         : {avg:.0f} ms")
    print(f"  Mediana (p50)    : {p50:.0f} ms")
    print(f"  Percentil 95     : {p95} ms")
    print(f"  Percentil 99     : {p99} ms")
    print(f"  Máximo           : {max(times)} ms")
    print(f"  Mínimo           : {min(times)} ms")
PYEOF
}

# ─── Validaciones ─────────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  fail "Docker no está instalado."
  exit 1
fi

mkdir -p "$RESULTS_DIR"
check_target_up

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        SmartDiningRoom — Load & Stress Tests             ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Target  : http://${BASE_URL}:${PORT}                    "
echo "║  Modo    : ${MODE}                                       "
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

OVERALL_EXIT=0

# ─── Prueba de CARGA ──────────────────────────────────────────────────────────
if [[ "$MODE" == "load" || "$MODE" == "both" ]]; then
  log "Iniciando prueba de CARGA (${LOAD_THREADS} usuarios, ${LOAD_DURATION_SECS}s, umbral ${THRESHOLD_MS}ms)..."
  run_jmeter "load-test.jmx" \
    "-JTHREADS=${LOAD_THREADS} -JRAMP_SECS=${LOAD_RAMP_SECS} -JDURATION_SECS=${LOAD_DURATION_SECS} -JTHRESHOLD_MS=${THRESHOLD_MS}" \
    || { fail "Prueba de carga falló"; OVERALL_EXIT=1; }

  print_summary "${RESULTS_DIR}/load-test.csv" "Prueba de CARGA — ${LOAD_THREADS} usuarios"
  success "Prueba de CARGA completada. CSV: ${RESULTS_DIR}/load-test.csv"
fi

# ─── Prueba de ESTRÉS ─────────────────────────────────────────────────────────
if [[ "$MODE" == "stress" || "$MODE" == "both" ]]; then
  log "Iniciando prueba de ESTRÉS (rampa 10→500 usuarios, 5 niveles × 30s)..."
  log "Tiempo total estimado: ~3 minutos"
  run_jmeter "stress-test.jmx" \
    || { fail "Prueba de estrés falló"; OVERALL_EXIT=1; }

  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║              Resultados de ESTRÉS por nivel              ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  print_summary "${RESULTS_DIR}/stress-nivel1-10u.csv"   "Nivel 1 —  10 usuarios"
  print_summary "${RESULTS_DIR}/stress-nivel2-50u.csv"   "Nivel 2 —  50 usuarios"
  print_summary "${RESULTS_DIR}/stress-nivel3-100u.csv"  "Nivel 3 — 100 usuarios"
  print_summary "${RESULTS_DIR}/stress-nivel4-250u.csv"  "Nivel 4 — 250 usuarios"
  print_summary "${RESULTS_DIR}/stress-nivel5-500u.csv"  "Nivel 5 — 500 usuarios"
  success "Prueba de ESTRÉS completada. Revisa los CSV en: ${RESULTS_DIR}/"
fi

echo ""
echo "─── Todos los resultados en: ${RESULTS_DIR}/ ───────────────"
exit $OVERALL_EXIT
