#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SERVER = ROOT / "server"
JMETER_RESULTS = ROOT / "tests" / "security" / "jmeter" / "results"
ZAP_JSON = ROOT / "tests" / "security" / "zap" / "zap-baseline.json"
OUT_HTML = ROOT / "docs" / "reportes" / "resumen-ejecutivo.html"


def parse_coverage_index(path: Path) -> dict:
    if not path.exists():
        return {"status": "missing", "title": path.as_posix()}
    text = path.read_text(encoding="utf-8", errors="ignore")
    strong = re.findall(r'<span class="strong">([^<]+)</span>', text)
    fraction = re.findall(r"<span class='fraction'>([^<]+)</span>", text)
    rows = []
    labels = ["Statements", "Branches", "Functions", "Lines"]
    for i, label in enumerate(labels):
        rows.append(
            {
                "label": label,
                "pct": strong[i].strip() if i < len(strong) else "N/A",
                "fraction": fraction[i].strip() if i < len(fraction) else "N/A",
            }
        )
    unknown = any("Unknown%" in r["pct"] for r in rows)
    return {"status": "ok", "unknown": unknown, "rows": rows}


def pct_to_float(value: str) -> float:
    try:
        return float(value.replace("%", "").strip())
    except Exception:
        return 0.0


def parse_jmeter_csv(path: Path) -> dict:
    if not path.exists():
        return {"status": "missing"}
    total = 0
    failures = 0
    by_label = Counter()
    by_code = Counter()
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            success = row.get("success", "").lower() == "true"
            if not success:
                failures += 1
            label = row.get("label", "unknown")
            by_label[(label, success)] += 1
            code = row.get("responseCode", "")
            by_code[code] += 1
    error_pct = (failures / total * 100) if total else 0.0
    top_codes = by_code.most_common(5)
    top_fail = []
    fail_by_endpoint = Counter()
    for (label, success), count in by_label.items():
        if not success:
            fail_by_endpoint[label] += count
    top_fail = fail_by_endpoint.most_common(5)
    return {
        "status": "ok",
        "total": total,
        "failures": failures,
        "error_pct": round(error_pct, 2),
        "top_codes": top_codes,
        "top_fail": top_fail,
    }


def parse_zap(path: Path) -> dict:
    if not path.exists():
        return {"status": "missing"}
    data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    alerts = []
    for site in data.get("site", []):
        alerts.extend(site.get("alerts", []))
    by_risk = Counter()
    for a in alerts:
        risk = a.get("riskdesc", "Unknown")
        by_risk[risk] += 1
    return {
        "status": "ok",
        "total_alerts": len(alerts),
        "risk_counts": dict(by_risk),
    }


def badge_class(error_pct: float) -> str:
    if error_pct <= 5:
        return "ok"
    if error_pct <= 20:
        return "warn"
    return "err"


def coverage_badge(cov: dict) -> str:
    if cov.get("status") != "ok":
        return "warn"
    if cov.get("unknown"):
        return "warn"
    statements = next((r for r in cov.get("rows", []) if r["label"] == "Statements"), None)
    pct = pct_to_float(statements["pct"]) if statements else 0.0
    if pct >= 80:
        return "ok"
    if pct >= 60:
        return "warn"
    return "err"


def parse_integration_results(path: Path) -> dict:
    if not path.exists():
        return {"status": "missing", "total": 0, "passed": 0, "failed": 0, "success_pct": 0.0}
    data = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    total = int(data.get("numTotalTests", 0) or 0)
    passed = int(data.get("numPassedTests", 0) or 0)
    failed = int(data.get("numFailedTests", 0) or 0)
    success_pct = round((passed / total * 100), 2) if total else 0.0
    return {"status": "ok", "total": total, "passed": passed, "failed": failed, "success_pct": success_pct}


def integration_badge(integration: dict) -> str:
    if integration.get("status") != "ok":
        return "warn"
    failed = integration.get("failed", 0)
    success_pct = integration.get("success_pct", 0.0)
    if failed == 0 and success_pct >= 95:
        return "ok"
    if failed <= 2 and success_pct >= 80:
        return "warn"
    return "err"


def main() -> None:
    cov_unit = parse_coverage_index(SERVER / "coverage-unit" / "lcov-report" / "index.html")
    integration = parse_integration_results(SERVER / "coverage-integration" / "jest-integration-results.json")
    jmeter_load = parse_jmeter_csv(JMETER_RESULTS / "load-test.csv")
    jmeter_stress = parse_jmeter_csv(JMETER_RESULTS / "stress-test.jtl")
    zap = parse_zap(ZAP_JSON)

    load_class = badge_class(jmeter_load.get("error_pct", 100.0)) if jmeter_load["status"] == "ok" else "warn"
    stress_class = badge_class(jmeter_stress.get("error_pct", 100.0)) if jmeter_stress["status"] == "ok" else "warn"
    unit_class = coverage_badge(cov_unit)
    int_class = integration_badge(integration)

    critical_zap = 0
    medium_zap = 0
    for risk, count in zap.get("risk_counts", {}).items():
        low = risk.lower()
        if "high" in low:
            critical_zap += count
        elif "medium" in low:
            medium_zap += count
    zap_class = "err" if critical_zap > 0 else ("warn" if medium_zap > 0 else "ok")

    html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Resumen Ejecutivo de Pruebas</title>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }}
    .wrap {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
    h1 {{ margin: 0 0 8px; }}
    .subtitle {{ color: #94a3b8; margin-bottom: 16px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }}
    .card {{ background: #111827; border: 1px solid #334155; border-radius: 10px; padding: 12px; }}
    .card h2 {{ margin: 0 0 8px; font-size: 18px; }}
    .line {{ font-size: 14px; margin: 4px 0; color: #cbd5e1; }}
    .badge {{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; }}
    .ok {{ background:#14532d; color:#86efac; }}
    .warn {{ background:#78350f; color:#fde68a; }}
    .err {{ background:#7f1d1d; color:#fecaca; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }}
    th, td {{ border: 1px solid #334155; padding: 6px; text-align: left; }}
    th {{ background: #1e293b; }}
    .muted {{ color: #94a3b8; }}
    a {{ color: #93c5fd; }}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Resumen Ejecutivo de Pruebas</h1>
    <p class="subtitle">Lectura rapida y entendible de unitarias, integracion, carga/estres y seguridad.</p>
    <div class="grid">
      <section class="card">
        <h2>Diagnostico Rapido (Que falla)</h2>
        <table>
          <thead>
            <tr><th>Bloque</th><th>Estado</th><th>Lectura</th><th>Accion recomendada</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Unitarias</td>
              <td><span class="badge {unit_class}">{unit_class.upper()}</span></td>
              <td>Statements en {next((r["pct"] for r in cov_unit.get("rows", []) if r["label"] == "Statements"), "N/A")}</td>
              <td>Subir cobertura en controllers/branching critico.</td>
            </tr>
            <tr>
              <td>Integracion</td>
              <td><span class="badge {int_class}">{int_class.upper()}</span></td>
              <td>Tests: {integration.get("passed", 0)} OK / {integration.get("failed", 0)} FAIL (exito {integration.get("success_pct", 0)}%).</td>
              <td>Revisar suites fallidas y estabilizar contratos API en integración.</td>
            </tr>
            <tr>
              <td>JMeter Carga</td>
              <td><span class="badge {load_class}">{load_class.upper()}</span></td>
              <td>Error {jmeter_load.get("error_pct", 0)}% ({jmeter_load.get("failures", 0)} de {jmeter_load.get("total", 0)}).</td>
              <td>Analizar endpoint con mas error y assertions de tiempo.</td>
            </tr>
            <tr>
              <td>JMeter Estres</td>
              <td><span class="badge {stress_class}">{stress_class.upper()}</span></td>
              <td>Error {jmeter_stress.get("error_pct", 0)}% ({jmeter_stress.get("failures", 0)} de {jmeter_stress.get("total", 0)}).</td>
              <td>Escalar carga gradual y ajustar umbrales por endpoint.</td>
            </tr>
            <tr>
              <td>ZAP Baseline</td>
              <td><span class="badge {zap_class}">{zap_class.upper()}</span></td>
              <td>High: {critical_zap} / Medium: {medium_zap} / Total: {zap.get("total_alerts", 0)}</td>
              <td>Corregir headers y filtrar ruido de rutas 404.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Unitarias (Coverage)</h2>
        {"".join(f'<div class="line">{r["label"]}: <strong>{r["pct"]}</strong> <span class="muted">({r["fraction"]})</span></div>' for r in cov_unit.get("rows", []))}
        <div class="line muted">Fuente: server/coverage-unit/lcov-report/index.html</div>
      </section>

      <section class="card">
        <h2>Integracion (Ejecucion real)</h2>
        <div class="line">Tests totales: <strong>{integration.get("total", 0)}</strong></div>
        <div class="line">Pasados: <strong>{integration.get("passed", 0)}</strong></div>
        <div class="line">Fallidos: <strong>{integration.get("failed", 0)}</strong></div>
        <div class="line">Exito: <strong>{integration.get("success_pct", 0)}%</strong> <span class="badge {int_class}">{int_class.upper()}</span></div>
        <div class="line muted">Fuente: server/coverage-integration/jest-integration-results.json</div>
      </section>

      <section class="card">
        <h2>JMeter Carga</h2>
        <div class="line">Peticiones: <strong>{jmeter_load.get("total", 0)}</strong></div>
        <div class="line">Errores: <strong>{jmeter_load.get("failures", 0)}</strong> ({jmeter_load.get("error_pct", 0)}%) <span class="badge {load_class}">{load_class.upper()}</span></div>
        <table><thead><tr><th>Codigo</th><th>Cantidad</th></tr></thead><tbody>
        {"".join(f"<tr><td>{code}</td><td>{count}</td></tr>" for code, count in jmeter_load.get("top_codes", []))}
        </tbody></table>
      </section>

      <section class="card">
        <h2>JMeter Estres</h2>
        <div class="line">Peticiones: <strong>{jmeter_stress.get("total", 0)}</strong></div>
        <div class="line">Errores: <strong>{jmeter_stress.get("failures", 0)}</strong> ({jmeter_stress.get("error_pct", 0)}%) <span class="badge {stress_class}">{stress_class.upper()}</span></div>
        <table><thead><tr><th>Endpoint con mas fallos</th><th>Cantidad</th></tr></thead><tbody>
        {"".join(f"<tr><td>{ep}</td><td>{count}</td></tr>" for ep, count in jmeter_stress.get("top_fail", []))}
        </tbody></table>
      </section>

      <section class="card">
        <h2>ZAP Baseline</h2>
        <div class="line">Alertas totales: <strong>{zap.get("total_alerts", 0)}</strong></div>
        <table><thead><tr><th>Riesgo</th><th>Cantidad</th></tr></thead><tbody>
        {"".join(f"<tr><td>{risk}</td><td>{count}</td></tr>" for risk, count in zap.get("risk_counts", {}).items())}
        </tbody></table>
      </section>

      <section class="card">
        <h2>Abrir reportes detallados</h2>
        <div class="line"><a href="../../server/coverage-unit/lcov-report/index.html">Unitarias (coverage)</a></div>
        <div class="line"><a href="../../server/coverage-integration/integration-report.html">Integracion (ejecucion)</a></div>
        <div class="line"><a href="../../tests/security/jmeter/results/html-report-load-full/index.html">JMeter carga (html)</a></div>
        <div class="line"><a href="../../tests/security/zap/zap-baseline.html">ZAP baseline (html)</a></div>
      </section>
    </div>
  </div>
</body>
</html>
"""
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"Resumen generado: {OUT_HTML}")


if __name__ == "__main__":
    main()
