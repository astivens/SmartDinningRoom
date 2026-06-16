#!/usr/bin/env bash
# Genera los diagramas (caso de uso, secuencia, actividades) por cada caso de uso.
set -euo pipefail
OUT="$(dirname "$0")/cu"
mkdir -p "$OUT"
cd "$OUT"

SKIN='skinparam backgroundColor #FFFFFF
skinparam shadowing false
skinparam defaultFontName Helvetica
skinparam dpi 150
skinparam ActorBackgroundColor #E3F2FD
skinparam UsecaseBackgroundColor #F5F7FA
skinparam UsecaseBorderColor #607D8B
skinparam SequenceLifeLineBorderColor #90A4AE
skinparam ParticipantBackgroundColor #E3F2FD
skinparam ActivityBackgroundColor #E8F5E9
skinparam ActivityDiamondBackgroundColor #FFF3E0'

# ───────────────────────── CU-01 Registrar estudiante ───────────────────────
cat > cu01-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Estudiante" as E
rectangle "SmartComedor" {
  usecase "Registrar estudiante" as UC
  usecase "Adjuntar documentos\n(SISBEN, cedula, horario)" as A
  usecase "Crear cuenta de usuario" as C
}
E --> UC
UC ..> A : <<include>>
UC ..> C : <<include>>
@enduml
EOF
cat > cu01-seq.puml <<EOF
@startuml
$SKIN
actor Estudiante
participant "Frontend\n(SPA)" as FE
participant "API /auth/register" as API
participant "AuthController" as C
database "PostgreSQL" as DB
Estudiante -> FE : Diligencia formulario + adjuntos
FE -> API : POST /api/auth/register (multipart)
API -> C : register(req)
C -> C : Valida archivo SISBEN
C -> DB : SELECT user WHERE email
alt email ya existe
  C --> FE : 400 Email ya registrado
else email disponible
  C -> C : bcrypt.hash(password)
  C -> DB : INSERT User(role=student)
  C -> DB : INSERT Student(isValidatedSisben=false)
  C --> FE : 201 Created
end
FE --> Estudiante : Confirmacion de registro
@enduml
EOF
cat > cu01-act.puml <<EOF
@startuml
$SKIN
start
:Ingresar datos personales/academicos;
:Adjuntar SISBEN, cedula frontal y horario;
if (Archivo SISBEN presente?) then (no)
  :HTTP 400;
  stop
endif
if (Email ya registrado?) then (si)
  :HTTP 400;
  stop
endif
:Cifrar contrasena (bcrypt);
:Crear User (student);
:Crear Student (sin validar SISBEN);
:HTTP 201 Created;
stop
@enduml
EOF

# ───────────────────────── CU-02 Iniciar sesion ─────────────────────────────
cat > cu02-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Usuario" as U
rectangle "SmartComedor" {
  usecase "Iniciar sesion" as UC
  usecase "Validar credenciales" as V
  usecase "Emitir tokens JWT" as T
}
U --> UC
UC ..> V : <<include>>
UC ..> T : <<include>>
@enduml
EOF
cat > cu02-seq.puml <<EOF
@startuml
$SKIN
actor Usuario
participant Frontend as FE
participant "API /auth/login" as API
participant AuthController as C
database PostgreSQL as DB
Usuario -> FE : email, password, rol
FE -> API : POST /api/auth/login
API -> C : login(req)
C -> DB : SELECT user WHERE email
C -> C : bcrypt.compare(password)
alt credenciales/estado invalido
  C --> FE : 400 / 401 / 403
else valido
  C -> C : sign(access, refresh)
  C --> FE : 200 + tokens
end
FE --> Usuario : Acceso concedido
@enduml
EOF
cat > cu02-act.puml <<EOF
@startuml
$SKIN
start
:Recibir email, password y rol;
if (Campos completos?) then (no)
  :HTTP 400;
  stop
endif
if (Usuario existe?) then (no)
  :HTTP 401;
  stop
endif
if (Password correcto?) then (no)
  :HTTP 401;
  stop
endif
if (Cuenta activa?) then (no)
  :HTTP 401;
  stop
endif
if (Rol coincide y autorizado?) then (no)
  :HTTP 403;
  stop
endif
:Emitir access + refresh token;
:HTTP 200;
stop
@enduml
EOF

# ───────────────────────── CU-03 Recuperar contrasena ───────────────────────
cat > cu03-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Usuario" as U
rectangle "SmartComedor" {
  usecase "Recuperar contrasena" as UC
  usecase "Enviar correo con token" as M
  usecase "Restablecer contrasena" as R
}
U --> UC
UC ..> M : <<include>>
UC ..> R : <<extend>>
@enduml
EOF
cat > cu03-seq.puml <<EOF
@startuml
$SKIN
actor Usuario
participant Frontend as FE
participant "API /auth" as API
participant AuthController as C
participant EmailService as MAIL
database PostgreSQL as DB
Usuario -> FE : Solicita recuperacion (email)
FE -> API : POST /forgot-password
API -> C : forgotPassword()
C -> DB : Buscar usuario
C -> DB : Guardar resetToken + expiracion
C -> MAIL : Enviar correo con enlace
C --> FE : 200 (mensaje generico)
Usuario -> FE : Nueva contrasena + token
FE -> API : POST /reset-password
C -> DB : Validar token no expirado
C -> DB : Actualizar password (hash)
C --> FE : 200 OK
@enduml
EOF
cat > cu03-act.puml <<EOF
@startuml
$SKIN
start
:Solicitar recuperacion con email;
:Generar token y expiracion;
:Enviar correo (mensaje generico);
note right: No revela si el email existe
:Usuario abre enlace e ingresa nueva clave;
if (Token valido y no expirado?) then (no)
  :HTTP 400;
  stop
endif
:Actualizar contrasena (bcrypt);
:HTTP 200;
stop
@enduml
EOF

# ───────────────────────── CU-04 2FA ────────────────────────────────────────
cat > cu04-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Estudiante" as E
rectangle "SmartComedor" {
  usecase "Configurar 2FA (TOTP)" as S
  usecase "Verificar 2FA" as V
}
E --> S
E --> V
@enduml
EOF
cat > cu04-seq.puml <<EOF
@startuml
$SKIN
actor Estudiante
participant Frontend as FE
participant "API /auth" as API
participant AuthController as C
Estudiante -> FE : Activar 2FA
FE -> API : POST /setup-2fa
API -> C : setup2FA()
C -> C : speakeasy.generateSecret()
C --> FE : secret + QR (otpauth)
Estudiante -> FE : Ingresa codigo TOTP
FE -> API : POST /verify-2fa
C -> C : speakeasy.verify(token)
C --> FE : 200 / 400
@enduml
EOF
cat > cu04-act.puml <<EOF
@startuml
$SKIN
start
:Solicitar configuracion 2FA;
:Generar secreto TOTP + QR;
:Escanear QR en app autenticadora;
:Ingresar codigo de 6 digitos;
if (Codigo TOTP valido?) then (no)
  :HTTP 400;
  stop
endif
:Activar segundo factor;
:HTTP 200;
stop
@enduml
EOF

# ───────────────────────── CU-05 Gestionar estudiantes ──────────────────────
cat > cu05-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
rectangle "Gestion de estudiantes" {
  usecase "Listar / buscar" as L
  usecase "Consultar por ID" as G
  usecase "Crear" as C
  usecase "Actualizar" as U
  usecase "Deshabilitar" as D
}
A --> L
A --> G
A --> C
A --> U
A --> D
@enduml
EOF
cat > cu05-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant Frontend as FE
participant "API /students" as API
participant StudentsController as C
database PostgreSQL as DB
A -> FE : Abre gestion de estudiantes
FE -> API : GET /api/students?page&search
API -> C : list()
C -> DB : SELECT con paginacion/filtro
C --> FE : 200 lista
A -> FE : Editar estudiante
FE -> API : PUT /api/students/:id
C -> DB : UPDATE Student
C --> FE : 200 actualizado
@enduml
EOF
cat > cu05-act.puml <<EOF
@startuml
$SKIN
start
:Seleccionar operacion (CRUD);
if (Operacion) then (Crear)
  :Validar datos;
  :INSERT Student + User;
elseif () then (Actualizar)
  :UPDATE Student;
elseif () then (Deshabilitar)
  :isActive = false (soft delete);
else (Listar/Consultar)
  :SELECT con paginacion;
endif
:Responder al cliente;
stop
@enduml
EOF

# ───────────────────────── CU-06 Importar Excel ─────────────────────────────
cat > cu06-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
rectangle "SmartComedor" {
  usecase "Importar estudiantes\ndesde Excel" as UC
  usecase "Validar filas" as V
}
A --> UC
UC ..> V : <<include>>
@enduml
EOF
cat > cu06-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant Frontend as FE
participant "API /students/import" as API
participant StudentsController as C
participant "xlsx" as X
database PostgreSQL as DB
A -> FE : Sube archivo .xlsx
FE -> API : POST /api/students/import
API -> C : import()
C -> X : Parsear hojas/filas
loop por cada fila valida
  C -> DB : INSERT Student + User
end
C --> FE : 200 resumen (creados/errores)
@enduml
EOF
cat > cu06-act.puml <<EOF
@startuml
$SKIN
start
:Recibir archivo .xlsx;
:Parsear filas (xlsx);
repeat
  :Leer fila;
  if (Fila valida?) then (si)
    :Crear estudiante;
  else (no)
    :Registrar error;
  endif
repeat while (Mas filas?)
:Devolver resumen;
stop
@enduml
EOF

# ───────────────────────── CU-07 Validar SISBEN ─────────────────────────────
cat > cu07-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
rectangle "SmartComedor" {
  usecase "Validar SISBEN" as UC
  usecase "Extraer texto (PDF/OCR)" as O
  usecase "Cotejar cedula/nombre" as M
}
A --> UC
UC ..> O : <<include>>
UC ..> M : <<include>>
@enduml
EOF
cat > cu07-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant Frontend as FE
participant "API /students/:id/validate-sisben" as API
participant StudentsController as C
participant SisbenValidationService as S
database PostgreSQL as DB
A -> FE : Validar SISBEN del estudiante
FE -> API : POST validate-sisben
API -> C : validateSisben()
C -> DB : Buscar estudiante
C -> S : extraer texto (pdf-parse / tesseract)
S -> S : Normalizar y cotejar cedula/nombre/apellido
alt coincide
  C -> DB : isValidatedSisben = true
  C --> FE : 200 validated=true
else discrepancia
  C --> FE : 200 validated=false + detalle
end
@enduml
EOF
cat > cu07-act.puml <<EOF
@startuml
$SKIN
start
:Solicitar validacion del estudiante;
if (Estudiante existe?) then (no)
  :HTTP 404;
  stop
endif
:Extraer texto del SISBEN (PDF u OCR);
:Normalizar cedula, nombre y apellido;
if (Coincide con cedula frontal?) then (no)
  :validated=false + detalle;
  stop
endif
:isValidatedSisben = true;
:HTTP 200;
stop
@enduml
EOF

# ───────────────────────── CU-08 Gestionar supervisores ─────────────────────
cat > cu08-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
rectangle "Gestion de supervisores" {
  usecase "Crear supervisor" as C
  usecase "Actualizar" as U
  usecase "Cambiar estado" as S
  usecase "Deshabilitar" as D
  usecase "Ver bitacoras" as L
}
A --> C
A --> U
A --> S
A --> D
A --> L
@enduml
EOF
cat > cu08-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant Frontend as FE
participant "API /supervisors" as API
participant SupervisorsController as C
database PostgreSQL as DB
A -> FE : Crear supervisor
FE -> API : POST /api/supervisors
API -> C : create()
C -> C : Generar contrasena temporal (hash)
C -> DB : INSERT User(role=supervisor)
C --> FE : 201 creado
A -> FE : Cambiar estado (activo/autorizado)
FE -> API : PATCH /api/supervisors/:id/status
C -> DB : UPDATE estado
C --> FE : 200
@enduml
EOF
cat > cu08-act.puml <<EOF
@startuml
$SKIN
start
:Seleccionar operacion sobre supervisor;
if (Operacion) then (Crear)
  :Generar contrasena temporal;
  :INSERT User supervisor;
elseif () then (Cambiar estado)
  :UPDATE isActive/isAuthorized;
elseif () then (Deshabilitar)
  :isActive=false;
else (Consultar)
  :SELECT supervisores/bitacoras;
endif
:Responder;
stop
@enduml
EOF

# ───────────────────────── CU-09 Invitar/unir supervisor ────────────────────
cat > cu09-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
actor "Supervisor" as S
rectangle "SmartComedor" {
  usecase "Generar invitacion (48h)" as I
  usecase "Unirse por invitacion" as J
}
A --> I
S --> J
@enduml
EOF
cat > cu09-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
actor Supervisor as S
participant "API /supervisors" as API
participant SupervisorsController as C
participant EmailService as MAIL
database PostgreSQL as DB
A -> API : POST /invite (email)
API -> C : invite()
C -> DB : Crear token (valido 48h)
C -> MAIL : Enviar enlace de invitacion
S -> API : POST /join (token, datos)
C -> DB : Validar token vigente
C -> DB : INSERT User supervisor
C --> S : 201 cuenta creada
@enduml
EOF
cat > cu09-act.puml <<EOF
@startuml
$SKIN
start
:Admin genera invitacion;
:Crear token (expira en 48h);
:Enviar correo con enlace;
:Supervisor abre enlace;
if (Token vigente?) then (no)
  :HTTP 400;
  stop
endif
if (Email duplicado?) then (si)
  :HTTP 400;
  stop
endif
:Crear cuenta de supervisor;
:HTTP 201;
stop
@enduml
EOF

# ───────────────────────── CU-10 Asignar estudiantes ────────────────────────
cat > cu10-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
rectangle "SmartComedor" {
  usecase "Asignar estudiante\na supervisor" as AS
  usecase "Remover asignacion" as RM
  usecase "Consultar asignados" as Q
}
A --> AS
A --> RM
A --> Q
@enduml
EOF
cat > cu10-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant "API /supervisors/:id/assignments" as API
participant SupervisorsController as C
database PostgreSQL as DB
A -> API : POST assignment (studentId)
API -> C : assignStudent()
C -> DB : Verificar duplicado
alt ya asignado
  C --> A : 400 duplicado
else
  C -> DB : INSERT SupervisorAssignment
  C --> A : 201 asignado
end
@enduml
EOF
cat > cu10-act.puml <<EOF
@startuml
$SKIN
start
:Seleccionar supervisor y estudiante;
if (Asignacion ya existe?) then (si)
  :HTTP 400 duplicado;
  stop
endif
:INSERT SupervisorAssignment (N:M);
:HTTP 201;
stop
@enduml
EOF

# ───────────────────────── CU-11 Subir pago ─────────────────────────────────
cat > cu11-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Estudiante" as E
rectangle "SmartComedor" {
  usecase "Subir pago" as UC
  usecase "Calcular almuerzos" as C
  usecase "Adjuntar comprobante" as A
}
E --> UC
UC ..> C : <<include>>
UC ..> A : <<include>>
@enduml
EOF
cat > cu11-seq.puml <<EOF
@startuml
$SKIN
actor Estudiante as E
participant Frontend as FE
participant "API /payments" as API
participant PaymentsController as C
database PostgreSQL as DB
E -> FE : Ingresa monto + comprobante
FE -> API : POST /api/payments
API -> C : create()
C -> C : mealsIncluded = floor(monto/2000)
alt monto < 2000
  C --> FE : 400 monto invalido
else
  C -> DB : INSERT Payment(isVerified=false)
  C --> FE : 201 creado (pendiente)
end
@enduml
EOF
cat > cu11-act.puml <<EOF
@startuml
$SKIN
start
:Ingresar monto y comprobante;
if (Monto >= 2000?) then (no)
  :HTTP 400;
  stop
endif
:Calcular almuerzos = floor(monto/2000);
:INSERT Payment (pendiente de verificar);
:HTTP 201;
stop
@enduml
EOF

# ───────────────────────── CU-12 Verificar pago ─────────────────────────────
cat > cu12-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
rectangle "SmartComedor" {
  usecase "Verificar pago" as UC
  usecase "Registrar auditoria" as AU
}
A --> UC
UC ..> AU : <<include>>
@enduml
EOF
cat > cu12-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant "API /payments/:id/verify" as API
participant PaymentsController as C
participant AuditService as AU
database PostgreSQL as DB
A -> API : PATCH verify
API -> C : verifyPayment()
C -> DB : Buscar pago
alt no existe
  C --> A : 404
else
  C -> DB : isVerified=true, verifiedBy, verifiedAt
  C -> AU : logAction(verify_payment)
  C --> A : 200 verificado
end
@enduml
EOF
cat > cu12-act.puml <<EOF
@startuml
$SKIN
start
:Seleccionar pago a verificar;
if (Pago existe?) then (no)
  :HTTP 404;
  stop
endif
:Marcar isVerified=true (verifiedBy/At);
:Registrar evento en auditoria;
note right: Los almuerzos pasan a estar disponibles
:HTTP 200;
stop
@enduml
EOF

# ───────────────────────── CU-13 Calcular almuerzos ─────────────────────────
cat > cu13-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Usuario autenticado" as U
rectangle "SmartComedor" {
  usecase "Calcular almuerzos\npor monto" as UC
}
U --> UC
@enduml
EOF
cat > cu13-seq.puml <<EOF
@startuml
$SKIN
actor Usuario as U
participant "API /payments/calculate" as API
participant PaymentsController as C
U -> API : POST { amount }
API -> C : calculate()
alt amount <= 0 o < 2000
  C --> U : 400
else
  C -> C : meals = floor(amount/2000)
  C --> U : 200 { meals, residuo }
end
@enduml
EOF
cat > cu13-act.puml <<EOF
@startuml
$SKIN
start
:Recibir monto;
if (Monto >= 2000?) then (no)
  :HTTP 400;
  stop
endif
:meals = floor(monto/2000);
:residuo = monto mod 2000;
:HTTP 200 con resultado;
stop
@enduml
EOF

# ───────────────────────── CU-14 Registrar almuerzo ─────────────────────────
cat > cu14-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Supervisor" as S
rectangle "SmartComedor" {
  usecase "Registrar almuerzo" as UC
  usecase "Buscar estudiante" as B
  usecase "Registrar bitacora" as L
}
S --> UC
UC ..> B : <<include>>
UC ..> L : <<include>>
@enduml
EOF
cat > cu14-seq.puml <<EOF
@startuml
$SKIN
actor Supervisor as S
participant Frontend as FE
participant "API /meals" as API
participant MealsController as C
database PostgreSQL as DB
S -> FE : Busca estudiante (QR/cedula/UID)
FE -> API : POST /api/meals
API -> C : registerMeal()
C -> DB : Buscar estudiante
C -> C : Validar activo, dia, no comio hoy, disponibilidad
alt validacion falla
  C --> FE : 400 / 404
else ok
  C -> DB : INSERT MealAttendance
  C -> DB : mealsUsed++ (ultimo pago)
  C -> DB : INSERT SupervisorLog + AuditLog
  C --> FE : 201 registrado
end
@enduml
EOF
cat > cu14-act.puml <<EOF
@startuml
$SKIN
start
:Buscar estudiante;
if (Existe y activo?) then (no)
  :HTTP 404/400;
  stop
endif
if (Dia autorizado?) then (no)
  :HTTP 400;
  stop
endif
if (Ya comio hoy?) then (si)
  :HTTP 400;
  stop
endif
if (Tiene almuerzos?) then (no)
  :HTTP 400;
  stop
endif
:Registrar asistencia;
:Incrementar mealsUsed;
:Registrar bitacora + auditoria;
:HTTP 201;
stop
@enduml
EOF

# ───────────────────────── CU-15 Historial / asistencia ─────────────────────
cat > cu15-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Usuario autenticado" as U
rectangle "SmartComedor" {
  usecase "Consultar historial" as H
  usecase "Asistencia del dia" as T
}
U --> H
U --> T
@enduml
EOF
cat > cu15-seq.puml <<EOF
@startuml
$SKIN
actor Usuario as U
participant "API /meals" as API
participant MealsController as C
database PostgreSQL as DB
U -> API : GET /history?studentId&fechas
API -> C : getHistory()
C -> DB : SELECT MealAttendance (filtros)
C --> U : 200 historial
U -> API : GET /today
C -> DB : SELECT asistencia de hoy
C --> U : 200 lista del dia
@enduml
EOF
cat > cu15-act.puml <<EOF
@startuml
$SKIN
start
:Elegir consulta (historial o dia);
:Aplicar filtros (estudiante, fechas);
:SELECT asistencia;
:HTTP 200 con resultados;
stop
@enduml
EOF

# ───────────────────────── CU-16 Analitica ──────────────────────────────────
cat > cu16-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
actor "Auditor externo" as X
rectangle "SmartComedor" {
  usecase "Consultar analitica\ndel tablero" as UC
}
A --> UC
X --> UC
@enduml
EOF
cat > cu16-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant "API /meals/analytics" as API
participant MealsController as C
database PostgreSQL as DB
A -> API : GET analytics
API -> C : getDashboardAnalytics()
C -> DB : Agregaciones (conteos, totales)
C --> A : 200 metricas
@enduml
EOF
cat > cu16-act.puml <<EOF
@startuml
$SKIN
start
:Solicitar metricas del tablero;
:Ejecutar agregaciones;
:Construir respuesta (KPIs);
:HTTP 200;
stop
@enduml
EOF

# ───────────────────────── CU-17 Ciclos ─────────────────────────────────────
cat > cu17-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
actor "Sistema (cron)" as SY
rectangle "SmartComedor" {
  usecase "Crear ciclo" as C
  usecase "Cerrar ciclo manual" as M
  usecase "Cierre automatico" as AU
}
A --> C
A --> M
SY --> AU
@enduml
EOF
cat > cu17-seq.puml <<EOF
@startuml
$SKIN
participant "Cron" as CRON
participant CycleAutomationService as S
database PostgreSQL as DB
CRON -> S : Tarea programada
S -> DB : SELECT ciclos Activos con endDate < hoy
loop por cada ciclo vencido
  S -> DB : status = Cerrado
  S -> DB : Marcar estudiantes para revalidacion
end
@enduml
EOF
cat > cu17-act.puml <<EOF
@startuml
$SKIN
start
:Disparo programado (cron);
:Buscar ciclos vencidos y activos;
repeat
  :Cerrar ciclo;
  :Solicitar revalidacion documental;
repeat while (Mas ciclos?)
stop
@enduml
EOF

# ───────────────────────── CU-18 Calificar ──────────────────────────────────
cat > cu18-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Estudiante" as E
rectangle "SmartComedor" {
  usecase "Calificar servicio\n(1-5 estrellas)" as UC
}
E --> UC
@enduml
EOF
cat > cu18-seq.puml <<EOF
@startuml
$SKIN
actor Estudiante as E
participant "API /ratings" as API
participant RatingsController as C
database PostgreSQL as DB
E -> API : POST { stars, comment }
API -> C : create()
alt no autenticado
  C --> E : 401
else
  C -> DB : INSERT Rating
  C --> E : 201 creado
end
@enduml
EOF
cat > cu18-act.puml <<EOF
@startuml
$SKIN
start
:Seleccionar estrellas (1-5) y comentario;
if (Autenticado?) then (no)
  :HTTP 401;
  stop
endif
:INSERT Rating;
:Actualizar promedio;
:HTTP 201;
stop
@enduml
EOF

# ───────────────────────── CU-19 Quejas ─────────────────────────────────────
cat > cu19-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Estudiante" as E
actor "Administrador" as A
rectangle "SmartComedor" {
  usecase "Enviar queja/sugerencia" as Q
  usecase "Responder queja" as R
}
E --> Q
A --> R
@enduml
EOF
cat > cu19-seq.puml <<EOF
@startuml
$SKIN
actor Estudiante as E
actor Administrador as A
participant "API /complaints" as API
participant ComplaintsController as C
database PostgreSQL as DB
E -> API : POST { type, content, isAnonymous }
C -> DB : INSERT Complaint
C --> E : 201
A -> API : POST /:id/respond
C -> DB : response + isResolved=true
C --> A : 200
@enduml
EOF
cat > cu19-act.puml <<EOF
@startuml
$SKIN
start
:Crear queja/sugerencia/comentario;
if (Anonima?) then (si)
  :No asociar studentId;
else (no)
  :Asociar al estudiante;
endif
:INSERT Complaint;
:Admin responde y marca resuelta;
stop
@enduml
EOF

# ───────────────────────── CU-20 Noticias ───────────────────────────────────
cat > cu20-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
actor "Usuario" as U
rectangle "SmartComedor" {
  usecase "Publicar/editar/eliminar noticia" as M
  usecase "Listar noticias" as L
}
A --> M
U --> L
@enduml
EOF
cat > cu20-seq.puml <<EOF
@startuml
$SKIN
actor Administrador as A
participant "API /news" as API
participant NewsController as C
database PostgreSQL as DB
A -> API : POST /api/news
C -> DB : INSERT News(isActive=true)
C --> A : 201
A -> API : DELETE /api/news/:id
C -> DB : isActive=false (soft delete)
C --> A : 200
@enduml
EOF
cat > cu20-act.puml <<EOF
@startuml
$SKIN
start
:Seleccionar operacion de noticia;
if (Operacion) then (Crear)
  :INSERT News;
elseif () then (Editar)
  :UPDATE News;
elseif () then (Eliminar)
  :isActive=false;
else (Listar)
  :SELECT News activas;
endif
:Responder;
stop
@enduml
EOF

# ───────────────────────── CU-21 Auditoria ──────────────────────────────────
cat > cu21-uc.puml <<EOF
@startuml
$SKIN
left to right direction
actor "Administrador" as A
actor "Auditor externo" as X
rectangle "SmartComedor" {
  usecase "Consultar auditoria" as UC
  usecase "Filtrar (lista blanca)" as F
}
A --> UC
X --> UC
UC ..> F : <<include>>
@enduml
EOF
cat > cu21-seq.puml <<EOF
@startuml
$SKIN
actor Auditor as X
participant "API /audit" as API
participant AuditController as C
database PostgreSQL as DB
X -> API : GET /api/audit?accion&metodo&fechas
API -> C : list()
C -> C : Validar filtros (lista blanca)
alt filtro invalido
  C --> X : 400
else
  C -> DB : SELECT audit_logs (paginado)
  C --> X : 200 eventos
end
@enduml
EOF
cat > cu21-act.puml <<EOF
@startuml
$SKIN
start
:Ingresar filtros de auditoria;
if (Filtros en lista blanca?) then (no)
  :HTTP 400;
  stop
endif
:SELECT audit_logs con paginacion;
:HTTP 200;
stop
@enduml
EOF

echo "Generados $(ls *.puml | wc -l) archivos .puml"
