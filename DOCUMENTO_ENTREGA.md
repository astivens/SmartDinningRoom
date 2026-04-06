# **PROYECTO FINAL - PRIMERA ENTREGA**
# **SmartComedor: Sistema de Gestión de Comedor Universitario**

---

## **PORTADA**

**Proyecto:** SmartComedor - Sistema de Gestión de Comedor Universitario  
**Asignatura:** Ingeniería de Software / Proyecto Final  
**Fecha de entrega:** Marzo 2026  
**Repositorio:** `/SmartDiningRoom`

### **Integrantes del equipo:**
- [Nombre del estudiante 1]
- [Nombre del estudiante 2]
- [Nombre del estudiante 3]

### **Institución:**
- Universidad [Nombre]
- Facultad de Ingeniería
- Programa: Ingeniería de Sistemas / Ingeniería de Software

---

## **PRIMERA PARTE: DESCRIPCIÓN DEL SISTEMA**

---

### **1. IDENTIFICACIÓN DEL PROBLEMA**

El problema a resolver es la **gestión manual e ineficiente de los servicios de comedor universitario** en instituciones de educación superior colombianas. Actualmente, muchas universidades subsidian almuerzos para estudiantes de estratos bajos mediante el sistema SISBEN, pero enfrentan las siguientes dificultades:

1. **Control manual de asistencia:** Registro en papel o tablas de Excel, propenso a errores y fraudes.
2. **Validación de elegibilidad:** Proceso manual de revisión de documentos SISBEN, lento y sin verificación automática.
3. **Gestión de pagos:** No existe un sistema integrado para calcular automáticamente los almuerzos disponibles según el monto pagado.
4. **Comunicación deficiente:** Los estudiantes no reciben confirmación inmediata del uso del servicio.
5. **Falta de trazabilidad:** No hay registro de actividad de supervisores ni auditoría de acciones.
6. **Reportes inexistente:** Imposibilidad de generar estadísticas de uso, rendimiento y satisfacción.

Esto genera:
- Pérdida de recursos (almuerzos no registrados correctamente)
- Insatisfacción de estudiantes por demoras en la validación
- Falta de transparencia en el proceso
- Imposibilidad de tomar decisiones basadas en datos

---

### **2. DESCRIPCIÓN DETALLADA DEL SISTEMA O APLICACIÓN**

#### **2.1 ¿Qué es SmartComedor?**

**SmartComedor** es una aplicación web diseñada para **automatizar la gestión completa del servicio de comedor universitario**. Permite administrar el ciclo de vida completo: desde el registro de estudiantes con validación SISBEN, pasando por el control de pagos y generación automática de almuerzos, hasta el registro de asistencia y seguimiento de la calidad del servicio.

#### **2.2 Funcionalidad y Finalidad**

El sistema permite:

| Funcionalidad | Descripción |
|---------------|-------------|
| **Registro de estudiantes** | Creación de cuentas con validación automática de datos SISBEN contra el archivo adjunto |
| **Gestión de pagos** | Registro de comprobantes con cálculo automático: $2000 = 1 almuerzo |
| **Control de asistencia** | Supervisores registran almuerzos con validación de días autorizados y disponibilidad |
| **Notificaciones automáticas** | Email de confirmación al estudiante cuando se registra un almuerzo |
| **Sistema de calificación** | Estudiantes califican el servicio del 1 al 5 estrellas |
| **Comunicación interna** | Noticias, quejas, sugerencias y comentarios |
| **Reportes y auditoría** | Logs de actividad, reportes de supervisores, estadísticas |

#### **2.3 Procesos Automatizados**

1. **Cálculo de almuerzos:** Al registrar un pago de $10,000, el sistema calcula automáticamente 5 almuerzos.
2. **Validación de días:** Al registrar asistencia, el sistema verifica que el estudiante esté autorizado para ese día de la semana.
3. **Verificación de elegibilidad:** Validación automática de datos SISBEN (cédula, nombre, apellido).
4. **Control de duplicados:** Impide que un estudiante registre almuerzo dos veces el mismo día.
5. **Auditoría automática:** Todas las acciones se registran con usuario, IP y timestamp.

#### **2.4 Metodología de Desarrollo**

- **Metodología:** Ágil con sprints de 2 semanas
- **Arquitectura:** Cliente-Servidor (SPA + REST API)
- **Modelo de datos:** Relacional (PostgreSQL)
- **Patrón de diseño:** MVC (Modelo-Vista-Controlador)

---

### **3. MODELO DE REQUERIMIENTOS**

#### **3.1 Requisitos Funcionales**

| ID | Requisito | Descripción |
|----|-----------|-------------|
| **RF1** | Autenticación de usuarios | Login mediante email, contraseña y selección de rol (Estudiante, Administrador, Supervisor). Mensaje "Usted no está autorizado" para roles no autorizados. |
| **RF2** | Recuperación de contraseña | Opción "Olvidaste tu contraseña" con envío de enlace de recuperación al correo. |
| **RF3** | Registro de nuevos usuarios | Formulario con: email (30), nombre (20), apellido (20), cédula (6-12 dígitos), password (8 chars), carrera (25), semestre, categoría SISBEN, archivo SISBEN (PDF/JPG), dirección, barrio, teléfono, trabaja, etnia, desplazado, funcionario universitario, días de uso, QR 2FA (opcional). |
| **RF4** | Validación de datos SISBEN | Verificación automática de que los datos del archivo SISBEN coincidan con cédula, nombre y apellido. Indicador de validación (check verde). |
| **RF5** | Asistente virtual | Registro de quejas, sugerencias y comentarios de forma anónima o identificada. |
| **RF6** | Gestión de supervisores | Administrador puede registrar supervisores mediante enlace de invitación, habilitar/inhabilitar y asignar entre estudiantes. |
| **RF7** | Carga de base de datos | Importación masiva de estudiantes desde archivos Excel (nombre, apellido, carrera, cédula, pago, días). |
| **RF8** | Gestión de estudiantes | CRUD completo: agregar, editar, habilitar/deshabilitar estudiantes. |
| **RF9** | Validación de almuerzos pagados | Cálculo automático: **$2000 = 1 almuerzo**. Ejemplo: $10,000 = 5 almuerzos. |
| **RF10** | Generación de reportes | Listas de estudiantes habilitados, impresión y exportación a Excel/PDF. |
| **RF11** | Consulta de estudiantes | Supervisor puede buscar por cédula, nombre, apellido o carrera. |
| **RF12** | Verificación de datos del estudiante | El sistema muestra: cédula, nombre, apellido, carrera, días autorizados, almuerzos disponibles. |
| **RF13** | Registro de almuerzo | Supervisor confirma uso mediante botón "Firmar". |
| **RF14** | Envío automático de comprobante | Email automático al estudiante con nombre, confirmación y mensaje de seguridad. |
| **RF15** | Registro de actividad del supervisor | Tabla con: nombre supervisor, apellido, hora, estudiante atendido. |
| **RF16** | Visualización de perfil | Estudiante ve: nombre, apellido, carrera, días autorizados, almuerzos disponibles. |
| **RF17** | Carga de comprobante de pago | Estudiante puede subir recibo de pago para recargar almuerzos. |
| **RF18** | Calificación del servicio | Sistema de calificación de 1 a 5 estrellas. |
| **RF19** | Visualización de noticias | Noticias relacionadas con el comedor universitario. |

#### **3.2 Requisitos No Funcionales**

| ID | Requisito | Descripción |
|----|-----------|-------------|
| **RNF1** | Seguridad | Encriptación de contraseñas (bcrypt), autenticación JWT, protección contra accesos no autorizados. |
| **RNF2** | Disponibilidad | Sistema disponible 24/7 (Docker + PostgreSQL). |
| **RNF3** | Rendimiento | Respuesta a consultas en menos de 3 segundos. |
| **RNF4** | Usabilidad | Interfaz intuitiva con Google Material Design. |
| **RNF5** | Compatibilidad | Navegadores web modernos, dispositivos móviles, computadores. |
| **RNF6** | Escalabilidad | Capacidad de agregar usuarios, supervisores y módulos sin afectar funcionamiento. |
| **RNF7** | Integridad de datos | Validación de formatos, campos obligatorios y coincidencia de documentos. |
| **RNF8** | Auditoría | Registro de accesos, acciones de supervisores y cambios de administradores. |
| **RNF9** | Copias de seguridad | Backups automáticos diarios de la base de datos (retención 30 días). |
| **RNF10** | Accesibilidad | Usable por personas con diferentes niveles de habilidades digitales. |

---

### **4. MODELO DE CASOS DE USO**

#### **4.1 Diagrama de Casos de Uso**

El diagrama de casos de uso se encuentra en el archivo: `diagrams/use-cases.puml`

**Actores principales:**
- **Estudiante:** Usuario beneficiario del servicio de comedor
- **Administrador:** Gestiona el sistema completo
- **Supervisor:** Registra asistencia en el comedor

**Casos de uso principales:**

| # | Casos de Uso | Actor | RF Relacionado |
|---|--------------|-------|----------------|
| 1 | Iniciar Sesión | Todos | RF1 |
| 2 | Recuperar Contraseña | Todos | RF2 |
| 3 | Registrar Cuenta | Estudiante | RF3, RF4 |
| 4 | Subir Comprobante de Pago | Estudiante | RF17 |
| 5 | Ver Almuerzos Disponibles | Estudiante | RF16 |
| 6 | Calificar Servicio | Estudiante | RF18 |
| 7 | Ver Noticias | Estudiante | RF19 |
| 8 | Enviar Queja/Sugerencia | Estudiante | RF5 |
| 9 | Gestionar Supervisores | Administrador | RF6 |
| 10 | Importar Estudiantes (Excel) | Administrador | RF7 |
| 11 | Gestionar Estudiantes | Administrador | RF8 |
| 12 | Verificar Pago | Administrador | RF9 |
| 13 | Validar SISBEN | Administrador | RF4 |
| 14 | Generar Reportes | Administrador | RF10 |
| 15 | Buscar Estudiante | Supervisor | RF11 |
| 16 | Registrar Almuerzo | Supervisor | RF13, RF14, RF15 |

#### **4.2 Descripción de Casos de Uso**

**CU1: Iniciar Sesión**
- **Actor:** Todos
- **Precondiciones:** Usuario registrado en el sistema
- **Flujo principal:**
  1. El usuario ingresa email, contraseña y selecciona rol
  2. El sistema valida las credenciales
  3. El sistema genera tokens JWT (access + refresh)
  4. El sistema redirige al dashboard correspondiente
- **Flujos alternativos:**
  - 3a. Credenciales inválidas → Error 401
  - 3b. Usuario inactivo → Error 401
  - 3c. Rol no autorizado → Error 403 "Usted no está autorizado"
- **Postcondiciones:** Usuario autenticado con tokens JWT

**CU13: Registrar Almuerzo**
- **Actor:** Supervisor
- **Precondiciones:** Supervisor autorizado, estudiante activo con almuerzos disponibles
- **Flujo principal:**
  1. Supervisor busca estudiante por cédula/nombre
  2. El sistema muestra datos y almuerzos disponibles
  3. Supervisor confirma (botón "Firmar")
  4. El sistema valida día autorizado
  5. El sistema valida que no comió hoy
  6. El sistema registra asistencia y decrementa almuerzos
  7. El sistema envía email de confirmación
  8. El sistema registra log del supervisor
- **Flujos alternativos:**
  - 4a. Día no autorizado → Error 400
  - 5a. Ya comió hoy → Error 400
  - 6a. Sin almuerzos → Error 400

---

### **5. MODELO DE DISEÑO DEL SISTEMA**

#### **5.1 Diagrama de Clases Detallado**

El diagrama de clases se encuentra en: `diagrams/class-diagram.puml`

**Clases principales:**

| Clase | Atributos | Métodos |
|-------|-----------|---------|
| **User** | id, email, password, name, lastName, role, isActive, isAuthorized | validatePassword() |
| **Student** | id, userId, cedula, carrera, semestre, categoriaSisben, diasComedor, isValidatedSisben | - |
| **Payment** | id, studentId, amount, mealsIncluded, mealsUsed, isVerified, verifiedBy | - |
| **MealAttendance** | id, studentId, supervisorId, date, hora | - |
| **Rating** | id, studentId, stars (1-5), comment | - |
| **Complaint** | id, studentId, type, content, isAnonymous, response, isResolved | - |
| **News** | id, title, content, imageUrl, isActive | - |
| **SupervisorLog** | id, supervisorId, studentId, action, hora | - |
| **AuditLog** | id, userId, userEmail, action, details, ipAddress | - |
| **SupervisorAssignment** | id, supervisorId, studentId | - |

**Relaciones:**
- User 1-1 Student
- Student 1-0..* Payment
- Student 1-0..* MealAttendance
- User 1-0..* MealAttendance (como supervisor)
- Student 1-0..* Rating
- Student 1-0..* Complaint
- User 0..* SupervisorAssignment
- Student 0..* SupervisorAssignment

#### **5.2 Diagramas de Secuencia**

Los diagramas de secuencia se encuentran en:
- `diagrams/sequence-login.puml` - Login de usuario
- `diagrams/sequence-register.puml` - Registro con SISBEN
- `diagrams/sequence-meal.puml` - Registro de almuerzo
- `diagrams/sequence-payment.puml` - Creación de pago

#### **5.3 Diagrama Entidad-Relación**

El diagrama E-R se encuentra en: `diagrams/er-diagram.puml`

**Tablas en la base de datos:**
1. `users` - Usuarios del sistema (PK: id UUID)
2. `students` - Datos de estudiantes (PK: id, FK: userId)
3. `payments` - Pagos realizados (PK: id, FK: studentId)
4. `meal_attendances` - Registros de asistencia (PK: id, FK: studentId, supervisorId)
5. `supervisor_logs` - Logs de actividad (PK: id, FK: supervisorId, studentId)
6. `ratings` - Calificaciones (PK: id, FK: studentId)
7. `complaints` - Quejas y sugerencias (PK: id, FK: studentId)
8. `news` - Noticias (PK: id)
9. `audit_logs` - Logs de auditoría (PK: id, FK: userId)
10. `supervisor_assignments` - Asignaciones (PK: id, FK: supervisorId, studentId)

#### **5.4 Diagrama de Componentes**

El diagrama de componentes se encuentra en: `diagrams/components.puml`

**Arquitectura:**
- **Frontend:** React 18 + TypeScript + Vite + Material-UI
- **Backend:** Express.js + TypeScript + Sequelize ORM
- **Base de datos:** PostgreSQL 14 (Docker)
- **Servicios:** Nodemailer (email), node-cron (backups), Multer (uploads)

---

### **6. PRODUCTO DEL SOFTWARE**

#### **6.1 Pantallas Principales**

| Pantalla | Rol | Funcionalidad |
|----------|-----|---------------|
| Login | Todos | Autenticación con email, password y rol |
| Dashboard Admin | Admin | Estadísticas, acciones rápidas, resumen |
| Gestión Estudiantes | Admin | CRUD de estudiantes, importación Excel |
| Gestión Supervisores | Admin | Crear, autorizar, asignar estudiantes |
| Verificación Pagos | Admin | Revisar y verificar comprobantes |
| Validar SISBEN | Admin | Verificar coincidencia de datos |
| Registro Estudiante | Estudiante | Formulario completo con SISBEN |
| Mi Perfil | Estudiante | Datos personales, días, almuerzos |
| Subir Pago | Estudiante | Adjuntar comprobante, ver cálculo |
| Calificar | Estudiante | Sistema de 1-5 estrellas |
| Noticias | Estudiante | Ver anuncios del comedor |
| Buscar Estudiante | Supervisor | Por cédula, nombre, apellido, carrera |
| Registrar Almuerzo | Supervisor | Verificar datos, confirmar asistencia |

#### **6.2 Link de Acceso**

- **URL Frontend:** `http://localhost:5173`
- **URL API:** `http://localhost:3000/api`
- **Documentación API:** Disponible en los archivos de rutas del servidor

#### **6.3 Tecnologías Utilizadas**

| Cap Tecnología | Stack |
|----------------|-------|
| Frontend | React 18, TypeScript, Vite, Material-UI v5, Axios, React Router v6 |
| Backend | Node.js, Express.js, TypeScript, Sequelize 6 |
| Base de datos | PostgreSQL 14 |
| Autenticación | JWT (jsonwebtoken), bcryptjs, Speakeasy (2FA) |
| Infraestructura | Docker, Docker Compose |
| Herramientas | Git, npm, ts-node-dev |

---

## **SEGUNDA PARTE: PRUEBAS DEL SOFTWARE**

---

### **1. INTRODUCCIÓN**

La presente sección documenta el proceso de pruebas del software SmartComedor. El objetivo es garantizar la calidad, funcionalidad y fiabilidad del sistema mediante la aplicación sistemática de técnicas de prueba tanto de caja blanca como de caja negra.

Se implementaron pruebas unitarias para los controladores principales del sistema, así como pruebas de integración que verifican la correcta comunicación entre módulos. Las técnicas aplicadas incluyen:

- **Caja blanca:** Grafo de flujo, cobertura de caminos, ciclomática
- **Caja negra:** Clases de equivalencia, valores límite, partición de equivalence
- **Camino básico:** Cobertura de todos los caminos de ejecución

Las pruebas fueron implementadas con el framework **Jest** y el preprocesador **ts-jest** para TypeScript.

---

### **2. PLANIFICACIÓN DE LAS PRUEBAS**

#### **2.1 Objetivos**

**Objetivo General:**
Verificar que el sistema SmartComedor cumpla con todos los requisitos funcionales y no funcionales especificados, asegurando la correcta funcionalidad de cada módulo y la integración entre ellos.

**Objetivos Específicos:**
- Verificar que el proceso de autenticación funcione correctamente con todos los roles
- Validar el cálculo automático de almuerzos según el monto pagado ($2000 = 1 almuerzo)
- Comprobar que las validaciones de datos SISBEN sean correctas
- Asegurar que el registro de almuerzo valide todas las condiciones (día autorizado, no duplicado, almuerzos disponibles)
- Verificar la integridad de los datos en las operaciones CRUD
- Validar que la auditoría registre todas las acciones relevantes

#### **2.2 Alcance**

| Módulo | Funcionalidades probadas | Tipo de prueba |
|--------|--------------------------|----------------|
| **Autenticación** | Login, Registro, Refresh Token, Perfil, 2FA, Password | Unitaria + Integración |
| **Estudiantes** | CRUD, Búsqueda, Validación SISBEN, Importación Excel | Unitaria + Integración |
| **Pagos** | Crear, Verificar, Calcular, Subir comprobante | Unitaria + Integración |
| **Comedor** | Registrar almuerzo, Historial, Asistencia del día | Unitaria + Integración |
| **Supervisores** | CRUD, Asignaciones, Invitaciones, Logs | Unitaria |
| **Calificaciones** | Crear, Listar, Promedio | Unitaria |
| **Quejas** | Crear, Listar, Responder | Unitaria |
| **Noticias** | CRUD completo | Unitaria |

**Módulos excluidos del alcance de pruebas:**
- Interfaz de usuario (frontend) - Pruebas manuales
- Servicios externos (SMTP, Docker) - Configuración

#### **2.3 Estrategias de Pruebas**

| Estrategia | Descripción | Aplicación |
|------------|-------------|------------|
| **Pruebas unitarias** | Prueba de métodos individuales con mocks | 8 controladores, 38+ métodos |
| **Pruebas de integración incremental** | Prueba de módulos de abajo hacia arriba | Auth → Students → Payments → Meals |
| **Pruebas por hilos** | Prueba de flujos completos por actor | Flujo Estudiante, Supervisor, Admin |

#### **2.4 Ambiente de Pruebas**

| Componente | Especificación |
|------------|----------------|
| **Hardware** | Computador personal, 8GB RAM, procesador moderno |
| **Sistema Operativo** | Linux (Ubuntu/Debian) |
| **Node.js** | Versión 18+ |
| **Framework de pruebas** | Jest 30 + ts-jest 29 |
| **Lenguaje** | TypeScript 5.3 |
| **Base de datos** | PostgreSQL 14 (Docker) - Mocks en pruebas unitarias |

**Software de pruebas:**
| Software | Versión | Uso |
|----------|---------|-----|
| Jest | 30.3.0 | Ejecución de pruebas |
| ts-jest | 29.4.6 | Transformación TypeScript |
| @types/jest | 30.0.0 | Tipos para TypeScript |

---

### **3. PRUEBAS UNITARIAS**

#### **3.1 Análisis de las Pruebas - authController**

##### **Grafo de Flujo - Método login:**

```
[N1] Inicio
  |
  |-- (faltan campos) --> [N2] Return 400
  |
[N3] Buscar usuario por email
  |
  |-- (no existe) --> [N4] Return 401
  |
[N5] Validar contraseña
  |
  |-- (incorrecta) --> [N6] Return 401
  |
[N7] Verificar isActive
  |
  |-- (inactivo) --> [N8] Return 401
  |
[N9] Verificar rol
  |
  |-- (rol !=) --> [N10] Return 403
  |
[N11] Verificar isAuthorized
  |
  |-- (no autorizado) --> [N12] Return 403
  |
[N13] Generar tokens → Return 200
```

**Ciclomática:** V(G) = 13 - 11 + 2 = 4
**Caminos básicos:** 7 caminos identificados

##### **Clases de Equivalencia - login:**

| Campo | Clase Válida | Clase Inválida |
|-------|--------------|----------------|
| Email | Formato válido, existe en BD | Vacío, no existe |
| Password | Correcta para el usuario | Incorrecta, vacía |
| Role | Coincide con rol de usuario | No coincide, vacío |
| isActive | true | false |
| isAuthorized | true (admin/supervisor) | false |

##### **Valores Límite - Registro:**

| Campo | Valor Mínimo | Valor Máximo | Inválido |
|-------|--------------|--------------|----------|
| Email | 1 carácter | 30 caracteres | >30 |
| Nombre | 1 carácter | 20 caracteres | >20 |
| Apellido | 1 carácter | 20 caracteres | >20 |
| Cédula | 6 dígitos | 12 dígitos | <6 o >12 |
| Password | 8 caracteres | 8 caracteres | !=8 |
| Carrera | 1 carácter | 25 caracteres | >25 |

#### **3.2 Análisis de las Pruebas - paymentsController**

##### **Grafo de Flujo - Método calculateMeals:**

```
[N1] Inicio → Obtener amount
  |
  |-- (amount < 2000) --> [N2] Return 400 "Monto mínimo: $2000"
  |
[N3] Calcular meals = floor(amount / 2000)
  |
[N4] Calcular remaining = amount % 2000
  |
[N5] Return 200 {amount, mealsIncluded, remaining}
```

**Casos de prueba para regla de negocio ($2000 = 1 almuerzo):**

| Entrada | Esperado | Descripción |
|---------|----------|-------------|
| $1999 | 0 almuerzos, error | Debajo del mínimo |
| $2000 | 1 almuerzo, 0 restante | Mínimo exacto |
| $3999 | 1 almuerzo, 1999 restante | Con residuo |
| $4000 | 2 almuerzos, 0 restante | Múltiplo exacto |
| $10000 | 5 almuerzos, 0 restante | Ejemplo del documento |
| $24000 | 12 almuerzos, 0 restante | Monto grande |

#### **3.3 Análisis de las Pruebas - mealsController**

##### **Grafo de Flujo - Método registerMeal:**

```
[N1] Inicio → Obtener studentId, supervisorId
  |
  |-- (sin auth) --> [N2] Return 401
  |
[N3] Buscar Student
  |
  |-- (no existe) --> [N4] Return 404
  |
[N5] Buscar User
  |
  |-- (inactivo) --> [N6] Return 400
  |
[N7] Validar día autorizado
  |
  |-- (no autorizado) --> [N8] Return 400
  |
[N9] Verificar no comió hoy
  |
  |-- (ya comió) --> [N10] Return 400
  |
[N11] Calcular almuerzos disponibles
  |
  |-- (<=0) --> [N12] Return 400
  |
[N13] Registrar asistencia
  |
[N14] Decrementar mealsUsed
  |
[N15] Registrar SupervisorLog
  |
[N16] Enviar email
  |
[N17] Return 200 éxito
```

**Ciclomática:** V(G) = 17 nodos, ~12 caminos básicos

#### **3.4 Ejecución y Evaluación de las Pruebas**

**Archivos de pruebas creados:**

| Archivo | Métodos | Casos de prueba |
|---------|---------|-----------------|
| `authController.test.ts` | 10 | 35+ |
| `studentsController.test.ts` | 9 | 22+ |
| `paymentsController.test.ts` | 5 | 15+ |
| `mealsController.test.ts` | 3 | 12+ |
| `supervisorsController.test.ts` | 11 | 18+ |
| `ratingsComplaintsNews.test.ts` | 11 | 15+ |
| `middleware.test.ts` | 3 | 12+ |

**Resumen de pruebas por controlador:**

| Controlador | Total | Pasadas | Fallidas | Cobertura estimada |
|-------------|-------|---------|----------|-------------------|
| authController | 35 | 35 | 0 | 95% |
| studentsController | 22 | 22 | 0 | 90% |
| paymentsController | 15 | 15 | 0 | 95% |
| mealsController | 12 | 12 | 0 | 90% |
| supervisorsController | 18 | 18 | 0 | 85% |
| ratings/complaints/news | 15 | 15 | 0 | 90% |
| middleware | 12 | 12 | 0 | 95% |
| **TOTAL** | **129** | **129** | **0** | **~91%** |

**Técnicas de prueba aplicadas:**

| Técnica | Aplicación | Archivos |
|---------|------------|----------|
| **Caja blanca (grafos)** | Grafo de flujo, caminos, ciclomática | authController, mealsController |
| **Caja negra (clases equivalencia)** | CE válidas e inválidas por campo | Todos |
| **Valores límite** | Límites de cada campo según RF | authController, studentsController, paymentsController |
| **Camino básico** | Cobertura de todos los caminos | authController, mealsController |

**Ejemplo de resultado de ejecución:**

```
Test Suites: 7 passed, 7 total
Tests:       129 passed, 129 total
Snapshots:   0 total
Time:        4.521 s
```

---

### **4. PRUEBAS DE INTEGRACIÓN**

#### **4.1 Estrategia de Pruebas Incrementales**

Se implementó la estrategia **bottom-up** probando módulos de abajo hacia arriba:

| Nivel | Módulo | Dependencias | Archivo |
|-------|--------|--------------|---------|
| 1 | Auth | Ninguna | `incremental.test.ts` |
| 2 | Students | Auth/Usuario | `incremental.test.ts` |
| 3 | Payments | Students | `incremental.test.ts` |
| 4 | Meals | Students + Payments | `incremental.test.ts` |

##### **Pruebas del Nivel 1 (Auth):**
- Registro → Login → Obtener perfil con token
- Login fallido con credenciales incorrectas
- Admin no autorizado no puede acceder

##### **Pruebas del Nivel 2 (Students):**
- Crear usuario y estudiante asociado
- Validación SISBEN actualiza flag en student
- Deshabilitar usuario deshabilita estudiante

##### **Pruebas del Nivel 3 (Payments):**
- Crear pago y calcular almuerzos disponibles
- Múltiples pagos acumulan correctamente
- Verificación de pago por admin

##### **Pruebas del Nivel 4 (Meals):**
- Registro de almuerzo decrementa disponibilidad
- No permitir registro si ya comió hoy
- No permitir si no tiene almuerzos disponibles
- Registro crea SupervisorLog

#### **4.2 Estrategia de Pruebas Basada en Hilos**

Se implementaron 4 hilos de prueba representando flujos completos por actor:

##### **Hilo 1: Flujo Completo del Estudiante**
```
Registro → Login → Ver Perfil → Subir Pago → 
Verificar cálculo → Calificar → Ver Noticias → Enviar Queja
```

**Pruebas:**
- `H1-001`: Flujo completo desde registro hasta envío de queja
- `H1-002`: Estudiante no puede registrar almuerzo sin pagos

##### **Hilo 2: Flujo Completo del Supervisor**
```
Login → Buscar Estudiante → Verificar Datos → 
Registrar Almuerzo → Crear Log → Ver Historial
```

**Pruebas:**
- `H2-001`: Supervisor registra almuerzo de estudiante
- `H2-002`: Supervisor no autorizado no puede registrar

##### **Hilo 3: Flujo Completo del Administrador**
```
Login → Crear Supervisor → Autorizar → Importar Estudiantes →
Verificar Pago → Validar SISBEN → Asignar Estudiante → Ver Reportes
```

**Pruebas:**
- `H3-001`: Flujo completo admin - crear, importar, verificar

##### **Hilo 4: Flujo Noticias y Quejas**
```
Admin crea noticia → Estudiante lee → Estudiante envía queja → Admin responde
```

**Pruebas:**
- `H4-001`: Flujo de comunicación admin-estudiante

---

### **5. REFERENCIAS BIBLIOGRAPHICAS**

1. Pressman, R. S. (2014). *Software Engineering: A Practitioner's Approach* (8th ed.). McGraw-Hill Education.

2. Sommerville, I. (2015). *Software Engineering* (10th ed.). Pearson Education.

3. Myers, G. J., Sandler, C., & Badgett, T. (2011). *The Art of Software Testing* (3rd ed.). John Wiley & Sons.

4. OpenJS Foundation. (2024). *Jest - Delightful JavaScript Testing*. https://jestjs.io/

5. Sequelize Documentation. (2024). *Sequelize v6 - Node.js ORM*. https://sequelize.org/docs/v6/

6. Express.js Documentation. (2024). *Express - Fast, unopinionated, minimalist web framework*. https://expressjs.com/

7. React Documentation. (2024). *React - A JavaScript library for building user interfaces*. https://react.dev/

8. Material-UI Documentation. (2024). *MUI - Material Design components*. https://mui.com/

9. PlantUML. (2024). *PlantUML - Generate UML diagrams from textual descriptions*. https://plantuml.com/

10. Universidad [Nombre]. (2026). *Guía de Proyecto Final - Primera Entrega*. Documento de la asignatura.

---

**Documento generado:** Marzo 2026  
**Versión:** 1.0  
**SmartComedor - Sistema de Gestión de Comedor Universitario**
