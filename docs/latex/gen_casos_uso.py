# -*- coding: utf-8 -*-
"""Genera secciones/casos-uso.tex con ficha extendida + 3 diagramas por CU."""
import os

# Cada CU: id, titulo, objetivo, precondiciones, exito, fracaso, actor, secundarios,
# flujo principal [(paso, accion)], extensiones [(paso, accion)], endpoint
CU = [
 ("CU-01","Registrar estudiante",
  "Permitir que un aspirante cree su cuenta de estudiante en SmartComedor adjuntando los documentos requeridos (SISBEN, cedula y horario), para acceder al servicio de comedor.",
  "El correo electronico no debe estar registrado previamente.",
  "Se crea el usuario (rol estudiante) y su perfil de estudiante con SISBEN sin validar.",
  "El registro se rechaza por falta de documento SISBEN o por correo ya existente.",
  "Estudiante (no autenticado)","Servicio de almacenamiento de archivos",
  [(1,"El estudiante diligencia el formulario con sus datos personales y academicos."),
   (2,"Adjunta el documento SISBEN, la cedula frontal y el horario."),
   (3,"El sistema valida la presencia del archivo SISBEN."),
   (4,"El sistema verifica que el correo no exista."),
   (5,"El sistema cifra la contrasena (bcrypt) y crea el usuario y el estudiante."),
   (6,"El sistema responde 201 Created.")],
  [("3.1","Falta el archivo SISBEN -> HTTP 400."),
   ("4.1","Correo ya registrado -> HTTP 400.")],
  "POST /api/auth/register"),

 ("CU-02","Iniciar sesion",
  "Permitir a un usuario autenticarse en el sistema mediante correo, contrasena y rol, obteniendo los tokens de acceso.",
  "El usuario debe estar registrado y su cuenta activa.",
  "Se emiten los tokens de acceso y refresco; el usuario accede segun su rol.",
  "Acceso denegado por credenciales, estado o rol invalidos.",
  "Usuario (estudiante, supervisor, administrador, auditor)","Servicio de autenticacion JWT",
  [(1,"El usuario ingresa correo, contrasena y rol."),
   (2,"El sistema valida que los campos esten completos."),
   (3,"El sistema busca al usuario por correo."),
   (4,"El sistema verifica la contrasena con bcrypt.compare."),
   (5,"El sistema valida que la cuenta este activa, autorizada y que el rol coincida."),
   (6,"El sistema emite access y refresh token y responde 200.")],
  [("2.1","Campos faltantes -> HTTP 400."),
   ("3.1","Usuario inexistente -> HTTP 401."),
   ("4.1","Contrasena incorrecta -> HTTP 401."),
   ("5.1","Cuenta inactiva -> 401; rol no coincide o no autorizado -> 403.")],
  "POST /api/auth/login"),

 ("CU-03","Recuperar y restablecer contrasena",
  "Permitir al usuario recuperar el acceso cuando olvida su contrasena, mediante un enlace con token enviado por correo.",
  "El usuario debe tener un correo registrado.",
  "La contrasena se actualiza y el usuario puede iniciar sesion.",
  "El token es invalido o esta expirado.",
  "Usuario","Servicio de correo (Nodemailer)",
  [(1,"El usuario solicita recuperacion indicando su correo."),
   (2,"El sistema genera un token con expiracion y lo almacena."),
   (3,"El sistema envia un correo con el enlace (mensaje generico)."),
   (4,"El usuario abre el enlace e ingresa la nueva contrasena."),
   (5,"El sistema valida el token y actualiza la contrasena cifrada."),
   (6,"El sistema responde 200.")],
  [("3.1","Por seguridad, el mensaje no revela si el correo existe."),
   ("5.1","Token invalido o expirado -> HTTP 400.")],
  "POST /api/auth/forgot-password, POST /api/auth/reset-password"),

 ("CU-04","Configurar y verificar 2FA",
  "Permitir al estudiante activar un segundo factor de autenticacion (TOTP) para reforzar la seguridad de su cuenta.",
  "El usuario debe estar autenticado.",
  "El segundo factor queda activo y se exige en posteriores inicios de sesion.",
  "El codigo TOTP ingresado es invalido.",
  "Estudiante","Aplicacion autenticadora (TOTP)",
  [(1,"El usuario solicita activar 2FA."),
   (2,"El sistema genera un secreto TOTP y un codigo QR."),
   (3,"El usuario escanea el QR en su aplicacion autenticadora."),
   (4,"El usuario ingresa el codigo de 6 digitos."),
   (5,"El sistema verifica el codigo con speakeasy y activa el 2FA."),
   (6,"El sistema responde 200.")],
  [("5.1","Codigo TOTP invalido -> HTTP 400.")],
  "POST /api/auth/setup-2fa, POST /api/auth/verify-2fa"),

 ("CU-05","Gestionar estudiantes (CRUD)",
  "Permitir al administrador listar, consultar, crear, actualizar y deshabilitar estudiantes del sistema.",
  "El administrador debe estar autenticado con rol admin.",
  "La operacion solicitada se refleja en la base de datos.",
  "Datos invalidos o estudiante inexistente.",
  "Administrador","Base de datos",
  [(1,"El administrador abre la gestion de estudiantes."),
   (2,"El sistema lista los estudiantes con paginacion y filtros."),
   (3,"El administrador selecciona crear, editar o deshabilitar."),
   (4,"El sistema valida los datos y ejecuta la operacion."),
   (5,"El sistema responde con el recurso afectado.")],
  [("4.1","Datos invalidos -> HTTP 400."),
   ("4.2","Estudiante inexistente -> HTTP 404.")],
  "GET/POST/PUT/DELETE /api/students"),

 ("CU-06","Importar estudiantes desde Excel",
  "Permitir al administrador cargar masivamente estudiantes a partir de un archivo Excel.",
  "El administrador debe estar autenticado; el archivo debe tener el formato esperado.",
  "Se crean los estudiantes de las filas validas y se reporta el resultado.",
  "El archivo es invalido o no contiene filas procesables.",
  "Administrador","Libreria de parseo xlsx",
  [(1,"El administrador sube un archivo .xlsx."),
   (2,"El sistema parsea las filas del archivo."),
   (3,"Por cada fila valida, el sistema crea el estudiante y su usuario."),
   (4,"El sistema acumula errores de las filas invalidas."),
   (5,"El sistema responde con un resumen (creados/errores).")],
  [("2.1","Archivo invalido o vacio -> HTTP 400."),
   ("3.1","Fila con datos invalidos -> se registra el error y continua.")],
  "POST /api/students/import"),

 ("CU-07","Validar SISBEN",
  "Permitir al administrador validar la elegibilidad del estudiante cotejando el documento SISBEN con la cedula registrada.",
  "El estudiante debe existir y tener documentos adjuntos.",
  "El estudiante queda con SISBEN validado.",
  "Existen discrepancias entre los documentos.",
  "Administrador","Servicio de validacion SISBEN (PDF/OCR)",
  [(1,"El administrador solicita validar el SISBEN del estudiante."),
   (2,"El sistema extrae el texto del documento (pdf-parse u OCR)."),
   (3,"El sistema normaliza y coteja cedula, nombre y apellido."),
   (4,"Si todo coincide, marca isValidatedSisben = true y responde 200.")],
  [("1.1","Estudiante no encontrado -> HTTP 404."),
   ("3.1","Inconsistencia -> validated=false con el detalle de cada discrepancia.")],
  "POST /api/students/:id/validate-sisben"),

 ("CU-08","Gestionar supervisores",
  "Permitir al administrador crear, actualizar, cambiar de estado y deshabilitar supervisores, y consultar sus bitacoras.",
  "El administrador debe estar autenticado con rol admin.",
  "El supervisor se crea o actualiza segun la operacion.",
  "Datos invalidos o supervisor inexistente.",
  "Administrador","Base de datos",
  [(1,"El administrador selecciona la operacion sobre el supervisor."),
   (2,"Para crear, el sistema genera una contrasena temporal cifrada."),
   (3,"El sistema persiste el usuario con rol supervisor."),
   (4,"Para cambiar estado, actualiza isActive/isAuthorized."),
   (5,"El sistema responde con el resultado.")],
  [("3.1","Correo duplicado -> HTTP 400."),
   ("4.1","Supervisor inexistente -> HTTP 404.")],
  "GET/POST/PUT/PATCH/DELETE /api/supervisors"),

 ("CU-09","Invitar supervisor / unirse por invitacion",
  "Permitir al administrador invitar supervisores por correo y a estos crear su cuenta mediante un enlace temporal.",
  "El administrador debe estar autenticado; la invitacion debe estar vigente.",
  "El supervisor crea su cuenta a partir de la invitacion.",
  "El token de invitacion es invalido o expirado.",
  "Administrador, Supervisor","Servicio de correo",
  [(1,"El administrador genera una invitacion indicando el correo."),
   (2,"El sistema crea un token con vigencia de 48 horas."),
   (3,"El sistema envia el enlace de invitacion por correo."),
   (4,"El supervisor abre el enlace y completa sus datos."),
   (5,"El sistema valida el token y crea la cuenta de supervisor.")],
  [("5.1","Token vencido -> HTTP 400."),
   ("5.2","Correo duplicado -> HTTP 400.")],
  "POST /api/supervisors/invite, POST /api/supervisors/join"),

 ("CU-10","Asignar estudiantes a supervisor",
  "Permitir al administrador asociar estudiantes a un supervisor para delimitar su ambito de supervision.",
  "El supervisor y el estudiante deben existir.",
  "Se crea la relacion supervisor-estudiante.",
  "La asignacion ya existe.",
  "Administrador","Base de datos",
  [(1,"El administrador selecciona un supervisor y un estudiante."),
   (2,"El sistema verifica que la asignacion no exista."),
   (3,"El sistema crea el registro de asignacion (N:M)."),
   (4,"El sistema responde 201.")],
  [("2.1","Asignacion duplicada -> HTTP 400.")],
  "POST/DELETE /api/supervisors/:id/assignments"),

 ("CU-11","Subir pago y comprobantes",
  "Permitir al estudiante registrar un pago/recarga indicando el monto y adjuntando el comprobante, calculando los almuerzos incluidos.",
  "El estudiante debe estar autenticado.",
  "Se crea un pago pendiente de verificacion con los almuerzos calculados.",
  "El monto es invalido (menor al precio de un almuerzo).",
  "Estudiante","Almacenamiento de archivos",
  [(1,"El estudiante ingresa el monto y adjunta el comprobante."),
   (2,"El sistema calcula almuerzos = piso(monto/2000)."),
   (3,"El sistema crea el pago con isVerified=false."),
   (4,"El sistema responde 201.")],
  [("2.1","Monto menor a 2000 -> HTTP 400.")],
  "POST /api/payments, POST /api/payments/upload, POST /api/payments/calculate"),

 ("CU-12","Verificar pago",
  "Permitir al administrador verificar un pago para habilitar los almuerzos del estudiante, dejando trazabilidad.",
  "El pago debe existir y estar pendiente.",
  "El pago queda verificado y se registra en auditoria.",
  "El pago no existe.",
  "Administrador","Servicio de auditoria",
  [(1,"El administrador selecciona el pago a verificar."),
   (2,"El sistema verifica que el pago exista."),
   (3,"El sistema marca isVerified=true (verifiedBy, verifiedAt)."),
   (4,"El sistema registra el evento en auditoria."),
   (5,"El sistema responde 200.")],
  [("2.1","Pago inexistente -> HTTP 404.")],
  "PATCH /api/payments/:id/verify"),

 ("CU-13","Calcular almuerzos por monto",
  "Permitir a un usuario autenticado conocer cuantos almuerzos corresponden a un monto dado, antes de registrar el pago.",
  "El usuario debe estar autenticado.",
  "Se devuelve el numero de almuerzos y el residuo.",
  "El monto es invalido.",
  "Usuario autenticado","-",
  [(1,"El usuario envia un monto."),
   (2,"El sistema valida que el monto sea mayor o igual a 2000."),
   (3,"El sistema calcula almuerzos=piso(monto/2000) y el residuo."),
   (4,"El sistema responde 200 con el resultado.")],
  [("2.1","Monto menor a 2000 o no numerico -> HTTP 400.")],
  "POST /api/payments/calculate"),

 ("CU-14","Registrar almuerzo",
  "Permitir al supervisor registrar el consumo de almuerzo de un estudiante validando todas las reglas de elegibilidad del dia.",
  "El supervisor debe estar autenticado; el estudiante debe estar activo y tener almuerzos.",
  "Se registra la asistencia, se descuenta un almuerzo y se deja bitacora.",
  "El estudiante no cumple alguna regla (inactivo, dia no permitido, ya comio, sin saldo).",
  "Supervisor","Servicios de bitacora y auditoria",
  [(1,"El supervisor busca al estudiante por QR, cedula o UID."),
   (2,"El sistema valida que exista y este activo."),
   (3,"El sistema valida el dia autorizado y que no haya comido hoy."),
   (4,"El sistema valida que tenga almuerzos disponibles."),
   (5,"El sistema registra la asistencia e incrementa mealsUsed."),
   (6,"El sistema registra la bitacora y la auditoria, y responde 201.")],
  [("2.1","Estudiante inexistente -> 404; inactivo -> 400."),
   ("3.1","Dia no autorizado o ya comio hoy -> 400."),
   ("4.1","Sin almuerzos disponibles -> 400.")],
  "POST /api/meals"),

 ("CU-15","Consultar historial y asistencia del dia",
  "Permitir a los usuarios autorizados consultar el historial de almuerzos y la asistencia del dia.",
  "El usuario debe estar autenticado.",
  "Se devuelven los registros segun los filtros.",
  "Parametros de filtro invalidos.",
  "Usuario autenticado","Base de datos",
  [(1,"El usuario elige consultar historial o asistencia del dia."),
   (2,"El usuario aplica filtros (estudiante, rango de fechas)."),
   (3,"El sistema consulta las asistencias correspondientes."),
   (4,"El sistema responde 200 con los resultados.")],
  [("2.1","Filtros invalidos -> HTTP 400.")],
  "GET /api/meals/history, GET /api/meals/today"),

 ("CU-16","Consultar analitica del tablero",
  "Proveer indicadores agregados (KPIs) del servicio de comedor para la toma de decisiones.",
  "El usuario debe tener rol admin o auditor.",
  "Se devuelven las metricas agregadas.",
  "Sin autorizacion.",
  "Administrador, Auditor externo","Base de datos",
  [(1,"El usuario solicita la analitica del tablero."),
   (2,"El sistema ejecuta las agregaciones (conteos y totales)."),
   (3,"El sistema construye la respuesta con los KPIs."),
   (4,"El sistema responde 200.")],
  [("1.1","Rol no autorizado -> HTTP 403.")],
  "GET /api/meals/analytics"),

 ("CU-17","Gestionar ciclos y cierre automatico",
  "Administrar los periodos del servicio y cerrar automaticamente los ciclos vencidos solicitando revalidacion documental.",
  "Debe existir al menos un ciclo configurado.",
  "Los ciclos vencidos se cierran y los estudiantes quedan marcados para revalidacion.",
  "No hay ciclos vencidos por procesar.",
  "Administrador, Sistema (cron)","Servicio de automatizacion de ciclos",
  [(1,"El administrador crea o cierra ciclos manualmente."),
   (2,"Una tarea programada se ejecuta periodicamente."),
   (3,"El sistema busca ciclos activos cuya fecha de fin ya paso."),
   (4,"El sistema cierra cada ciclo y marca a los estudiantes para revalidacion.")],
  [("3.1","Si no hay ciclos vencidos, la tarea finaliza sin cambios.")],
  "GET/POST/PUT /api/cycles + tarea programada"),

 ("CU-18","Calificar servicio",
  "Permitir al estudiante calificar el servicio del comedor con una puntuacion y un comentario opcional.",
  "El estudiante debe estar autenticado.",
  "Se registra la calificacion y se actualiza el promedio.",
  "Usuario no autenticado.",
  "Estudiante","Base de datos",
  [(1,"El estudiante selecciona una puntuacion de 1 a 5 estrellas."),
   (2,"El estudiante agrega un comentario opcional."),
   (3,"El sistema registra la calificacion."),
   (4,"El sistema responde 201.")],
  [("3.1","Usuario no autenticado -> HTTP 401.")],
  "POST /api/ratings"),

 ("CU-19","Enviar y responder quejas",
  "Permitir al estudiante enviar quejas, sugerencias o comentarios (anonimos o no) y al administrador responderlas.",
  "El estudiante debe estar autenticado para enviar; el administrador para responder.",
  "Se registra la queja y, en su caso, la respuesta del administrador.",
  "Datos invalidos.",
  "Estudiante, Administrador","Base de datos",
  [(1,"El estudiante crea una queja/sugerencia/comentario."),
   (2,"Si es anonima, no se asocia al estudiante."),
   (3,"El sistema registra la queja."),
   (4,"El administrador responde y la marca como resuelta.")],
  [("1.1","Contenido vacio -> HTTP 400.")],
  "POST /api/complaints, POST /api/complaints/:id/respond"),

 ("CU-20","Gestionar noticias",
  "Permitir al administrador publicar, editar y eliminar noticias visibles para los usuarios.",
  "El administrador debe estar autenticado con rol admin.",
  "La noticia se crea, actualiza o desactiva.",
  "Datos invalidos o noticia inexistente.",
  "Administrador, Usuario","Base de datos",
  [(1,"El administrador selecciona la operacion sobre la noticia."),
   (2,"El sistema valida los datos."),
   (3,"El sistema crea, actualiza o desactiva (soft delete) la noticia."),
   (4,"Los usuarios consultan las noticias activas.")],
  [("2.1","Datos invalidos -> HTTP 400."),
   ("3.1","Noticia inexistente -> HTTP 404.")],
  "GET/POST/PUT/DELETE /api/news"),

 ("CU-21","Consultar auditoria",
  "Permitir a los perfiles autorizados consultar la bitacora de auditoria del sistema con filtros controlados.",
  "El usuario debe tener rol admin o auditor.",
  "Se devuelven los eventos de auditoria paginados.",
  "Filtros fuera de la lista blanca.",
  "Administrador, Auditor externo","Base de datos",
  [(1,"El usuario ingresa filtros (accion, metodo, fechas)."),
   (2,"El sistema valida los filtros contra una lista blanca."),
   (3,"El sistema consulta audit_logs con paginacion."),
   (4,"El sistema responde 200 con los eventos.")],
  [("2.1","Filtro no permitido -> HTTP 400.")],
  "GET /api/audit"),
]

def esc(s):
    return (s.replace("&","\\&").replace("%","\\%").replace("_","\\_")
             .replace("#","\\#").replace("->","$\\rightarrow$"))

out = []
out.append("% Generado por gen_casos_uso.py\n")
out.append("Esta seccion documenta los veintiun casos de uso del sistema con la "
           "plantilla extendida (objetivo, precondiciones, condiciones de exito y "
           "fracaso, actores y flujo de eventos). Cada caso se acompana de su "
           "diagrama de caso de uso, su diagrama de secuencia y su diagrama de "
           "actividades, derivados de los controladores reales y verificados por las "
           "pruebas de la Segunda Parte.\n")

for (cid, titulo, obj, pre, exito, fracaso, actor, sec, flujo, ext, endpoint) in CU:
    num = cid.split("-")[1]
    out.append("\n\\subsection{%s --- %s}\n" % (cid, esc(titulo)))
    out.append("\\noindent\\textbf{Endpoint(s):} \\texttt{%s}\\par\\vspace{4pt}\n"
               % esc(endpoint).replace("$\\rightarrow$","->"))
    # Ficha
    out.append("\\begin{table}[H]\\centering\\small")
    out.append("\\caption{Ficha del caso de uso %s --- %s}" % (cid, esc(titulo)))
    out.append("\\begin{tabularx}{\\textwidth}{L{0.26\\textwidth} X}")
    out.append("\\toprule")
    out.append("\\textbf{Campo} & \\textbf{Descripcion} \\\\ \\midrule")
    out.append("Objetivo del contexto & %s \\\\ \\midrule" % esc(obj))
    out.append("Precondiciones & %s \\\\ \\midrule" % esc(pre))
    out.append("Condicion de exito & %s \\\\ \\midrule" % esc(exito))
    out.append("Condicion de fracaso & %s \\\\ \\midrule" % esc(fracaso))
    out.append("Actores principales & %s \\\\ \\midrule" % esc(actor))
    out.append("Actores secundarios & %s \\\\" % esc(sec))
    out.append("\\bottomrule\\end{tabularx}\\end{table}")
    # Flujo principal
    out.append("\\begin{table}[H]\\centering\\small")
    out.append("\\caption{Flujo principal de %s}" % cid)
    out.append("\\begin{tabularx}{\\textwidth}{C{0.10\\textwidth} X}")
    out.append("\\toprule \\textbf{Paso} & \\textbf{Accion} \\\\ \\midrule")
    for paso, acc in flujo:
        out.append("%s & %s \\\\" % (paso, esc(acc)))
    out.append("\\bottomrule\\end{tabularx}\\end{table}")
    # Extensiones
    out.append("\\begin{table}[H]\\centering\\small")
    out.append("\\caption{Extensiones (flujos alternativos) de %s}" % cid)
    out.append("\\begin{tabularx}{\\textwidth}{C{0.10\\textwidth} X}")
    out.append("\\toprule \\textbf{Paso} & \\textbf{Accion} \\\\ \\midrule")
    for paso, acc in ext:
        out.append("%s & %s \\\\" % (paso, esc(acc)))
    out.append("\\bottomrule\\end{tabularx}\\end{table}")
    # Diagramas
    out.append("\\begin{figure}[H]\\centering"
               "\\includegraphics[width=\\linewidth,height=0.30\\textheight,keepaspectratio]{cu/cu%s-uc.pdf}"
               "\\caption{Diagrama de caso de uso --- %s}\\end{figure}" % (num, cid))
    out.append("\\begin{figure}[H]\\centering"
               "\\includegraphics[width=\\linewidth,height=0.42\\textheight,keepaspectratio]{cu/cu%s-seq.pdf}"
               "\\caption{Diagrama de secuencia --- %s}\\end{figure}" % (num, cid))
    out.append("\\begin{figure}[H]\\centering"
               "\\includegraphics[width=\\linewidth,height=0.46\\textheight,keepaspectratio]{cu/cu%s-act.pdf}"
               "\\caption{Diagrama de actividades --- %s}\\end{figure}" % (num, cid))

here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(here, "secciones"), exist_ok=True)
path = os.path.join(here, "secciones", "casos-uso.tex")
with open(path, "w") as f:
    f.write("\n".join(out) + "\n")
print("Escrito", path, "con", len(CU), "casos de uso")
