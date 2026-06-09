#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
IN_JSON = ROOT / "server" / "coverage-integration" / "jest-integration-results.json"
OUT_HTML = ROOT / "server" / "coverage-integration" / "integration-report.html"


def ms(value: float) -> str:
    return f"{value:.0f} ms"


def ensure_integration_json() -> bool:
    if IN_JSON.exists():
        return True
    server_dir = ROOT / "server"
    command = [
        "npx",
        "jest",
        "--testPathPattern=tests/integration",
        "--runInBand",
        "--json",
        "--outputFile=coverage-integration/jest-integration-results.json",
    ]
    try:
        subprocess.run(
            command,
            cwd=server_dir,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return False
    return IN_JSON.exists()


def main() -> None:
    if not ensure_integration_json():
        OUT_HTML.write_text(
            """<!doctype html><html lang="es"><meta charset="utf-8"><title>Integración</title>
            <body><h1>Reporte de Integración</h1>
            <p>No se pudo generar <code>jest-integration-results.json</code> automáticamente.</p>
            <p>Ejecuta: <code>cd server && npx jest --testPathPattern=tests/integration --runInBand --json --outputFile=coverage-integration/jest-integration-results.json</code></p>
            </body></html>""",
            encoding="utf-8",
        )
        return

    data = json.loads(IN_JSON.read_text(encoding="utf-8", errors="ignore"))
    total = data.get("numTotalTests", 0)
    passed = data.get("numPassedTests", 0)
    failed = data.get("numFailedTests", 0)
    suites = data.get("testResults", [])
    success_rate = (passed / total * 100) if total else 0

    rows = []
    for suite in suites:
        name = Path(suite.get("name", "")).name
        start = suite.get("startTime", 0)
        end = suite.get("endTime", 0)
        duration = max(0, end - start)
        assertions = suite.get("assertionResults", [])
        pass_count = sum(1 for a in assertions if a.get("status") == "passed")
        fail_count = sum(1 for a in assertions if a.get("status") == "failed")
        status = "OK" if fail_count == 0 else "FALLA"
        cls = "ok" if fail_count == 0 else "err"
        rows.append(
            f"<tr><td>{name}</td><td><span class='badge {cls}'>{status}</span></td><td>{pass_count}</td><td>{fail_count}</td><td>{ms(duration)}</td></tr>"
        )

    html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reporte de Integración</title>
  <style>
    body {{ font-family: Inter, Arial, sans-serif; margin: 0; background:#0f172a; color:#e2e8f0; }}
    .wrap {{ max-width: 1100px; margin: 0 auto; padding: 20px; }}
    .cards {{ display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:10px; margin: 12px 0 18px; }}
    .card {{ background:#111827; border:1px solid #334155; border-radius:10px; padding:10px; }}
    .k {{ color:#94a3b8; font-size:12px; }}
    .v {{ font-size:22px; font-weight:700; margin-top:4px; }}
    .badge {{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; }}
    .ok {{ background:#14532d; color:#86efac; }}
    .err {{ background:#7f1d1d; color:#fecaca; }}
    .warn {{ background:#78350f; color:#fde68a; }}
    table {{ width:100%; border-collapse:collapse; }}
    th,td {{ border:1px solid #334155; padding:8px; text-align:left; font-size:14px; }}
    th {{ background:#1e293b; }}
    .help {{ margin: 8px 0 16px; padding:10px; border-left:4px solid #0ea5e9; background:#082f49; color:#bae6fd; border-radius:4px; }}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Pruebas de Integración (Ejecución real)</h1>
    <p class="help">Este reporte reemplaza el coverage Unknown% para integración. Aquí se muestra lo importante: suites, tests pasados/fallidos y tiempos.</p>
    <div class="cards">
      <div class="card"><div class="k">Tests totales</div><div class="v">{total}</div></div>
      <div class="card"><div class="k">Pasados</div><div class="v">{passed}</div></div>
      <div class="card"><div class="k">Fallidos</div><div class="v">{failed}</div></div>
      <div class="card"><div class="k">Éxito global</div><div class="v">{success_rate:.2f}%</div></div>
      <div class="card"><div class="k">Estado</div><div class="v"><span class="badge {'ok' if failed == 0 else 'err'}">{'OK' if failed == 0 else 'REVISAR'}</span></div></div>
    </div>
    <table>
      <thead><tr><th>Suite</th><th>Estado</th><th>Pass</th><th>Fail</th><th>Duración</th></tr></thead>
      <tbody>
        {''.join(rows)}
      </tbody>
    </table>
  </div>
</body>
</html>
"""
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"Reporte de integración generado: {OUT_HTML}")


if __name__ == "__main__":
    main()
