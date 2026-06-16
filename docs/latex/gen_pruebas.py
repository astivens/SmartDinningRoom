# -*- coding: utf-8 -*-
"""Extrae el catálogo real de casos de prueba (describe/it) de los archivos
   de test y genera secciones/catalogo-pruebas.tex con longtables por suite."""
import os, re, glob

SERVER = "/home/ubuntu/SmartDinningRoom/server/src/tests"
HERE = os.path.dirname(os.path.abspath(__file__))

def esc(s):
    s = s.replace("\\","\\textbackslash{}")
    for a,b in [("&","\\&"),("%","\\%"),("_","\\_"),("#","\\#"),("$","\\$"),
                ("{","\\{"),("}","\\}"),("~","\\textasciitilde{}"),
                ("^","\\textasciicircum{}")]:
        s = s.replace(a,b)
    return s

def parse(path):
    """Devuelve lista de (describe_path, it_title) en orden de aparición."""
    rows = []
    stack = []  # (indent, name)
    depth_token = []  # track nesting by counting braces is hard; use indent
    with open(path) as f:
        lines = f.readlines()
    desc_stack = []
    for ln in lines:
        m = re.match(r"^(\s*)describe\(\s*['\"`](.+?)['\"`]", ln)
        if m:
            indent = len(m.group(1))
            # pop deeper-or-equal
            while desc_stack and desc_stack[-1][0] >= indent:
                desc_stack.pop()
            desc_stack.append((indent, m.group(2)))
            continue
        mi = re.match(r"^(\s*)(it|test)\(\s*['\"`](.+?)['\"`]", ln)
        if mi:
            indent = len(mi.group(1))
            # current describe context = those with smaller indent
            ctx = [n for (i,n) in desc_stack if i < indent]
            rows.append((" > ".join(ctx), mi.group(3)))
    return rows

FILES = [
    ("unit/authController.test.ts", "AuthController", "TC-AUTH"),
    ("unit/studentsController.test.ts", "StudentsController", "TC-STU"),
    ("unit/paymentsController.test.ts", "PaymentsController", "TC-PAY"),
    ("unit/supervisorsController.test.ts", "SupervisorsController", "TC-SUP"),
    ("unit/ratingsComplaintsNews.test.ts", "Ratings/Complaints/News", "TC-RCN"),
    ("unit/middleware.test.ts", "Middleware de seguridad", "TC-MW"),
    ("unit/mealsController.test.ts", "MealsController", "TC-MEAL"),
    ("unit/sisbenValidationService.test.ts", "SisbenValidationService", "TC-SIS"),
    ("integration/incremental.test.ts", "Integración incremental (bottom-up)", "IT-INC"),
    ("integration/threads.test.ts", "Integración basada en hilos", "IT-THR"),
]

out = []
out.append("% Generado por gen_pruebas.py\n")
out.append("A continuacion se presenta el catalogo completo de los casos de prueba "
           "automatizados, extraido directamente del codigo fuente de las suites "
           "(\\texttt{server/src/tests/}). Cada caso corresponde a un bloque "
           "\\texttt{it()} ejecutable; la columna \\emph{Contexto} indica el bloque "
           "\\texttt{describe()} que lo agrupa.\n")

total = 0
for rel, titulo, prefix in FILES:
    path = os.path.join(SERVER, rel)
    rows = parse(path)
    total += len(rows)
    out.append("\n\\subsubsection{%s (\\texttt{%s})}" % (esc(titulo), esc(rel)))
    out.append("La suite \\texttt{%s} contiene %d casos de prueba (Tabla~\\ref{tab:cat-%s})."
               % (esc(rel), len(rows), prefix.lower()))
    out.append("\\begin{longtable}{l L{0.30\\textwidth} L{0.40\\textwidth}}")
    out.append("\\caption{Casos de prueba --- %s}\\label{tab:cat-%s}\\\\" % (esc(titulo), prefix.lower()))
    out.append("\\toprule \\textbf{ID} & \\textbf{Contexto} & \\textbf{Caso de prueba} \\\\ \\midrule")
    out.append("\\endfirsthead")
    out.append("\\toprule \\textbf{ID} & \\textbf{Contexto} & \\textbf{Caso de prueba} \\\\ \\midrule")
    out.append("\\endhead \\bottomrule \\endlastfoot")
    for i,(ctx,it) in enumerate(rows,1):
        out.append("%s-%03d & %s & %s \\\\" % (prefix, i, esc(ctx), esc(it)))
    out.append("\\end{longtable}")

out.insert(2, "\nEl catalogo agrupa **%d** casos declarados en las diez suites.\n" % total)

path = os.path.join(HERE, "secciones", "catalogo-pruebas.tex")
with open(path,"w") as f:
    f.write("\n".join(out)+"\n")
print("Escrito", path, "con", total, "casos")
