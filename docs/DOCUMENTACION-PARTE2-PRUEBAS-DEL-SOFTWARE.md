# SmartComedor — Documentación Técnica

## SEGUNDA PARTE: Pruebas del Software

> Plan, diseño, ejecución y evaluación de las pruebas del Sistema de Gestión del
> Comedor Universitario (SmartComedor / SmartDiningRoom).

---

## Tabla de contenido

1. [Introducción](#1-introducción)
2. [Planificación de las pruebas](#2-planificación-de-las-pruebas)
   1. [Objetivos de las pruebas](#21-objetivos-de-las-pruebas)
   2. [Alcance de las pruebas](#22-alcance-de-las-pruebas)
   3. [Estrategias de pruebas](#23-estrategias-de-pruebas)
   4. [Ambiente de pruebas](#24-ambiente-de-pruebas)
3. [Pruebas unitarias](#3-pruebas-unitarias)
   1. [Análisis de las pruebas](#31-análisis-de-las-pruebas)
   2. [Diseño de casos de prueba](#32-diseño-de-casos-de-prueba)
   3. [Ejecución y evaluación](#33-ejecución-y-evaluación-de-las-pruebas)
4. [Pruebas de integración](#4-pruebas-de-integración)
   1. [Estrategia incremental](#41-estrategia-de-pruebas-incrementales)
   2. [Estrategia basada en hilos](#42-estrategia-de-pruebas-basadas-en-hilos)
5. [Pruebas de sistema](#5-pruebas-de-sistema)
   1. [Seguridad](#51-pruebas-de-seguridad)
   2. [Rendimiento](#52-pruebas-de-rendimiento)
   3. [Usabilidad](#53-pruebas-de-usabilidad)
   4. [Portabilidad](#54-pruebas-de-portabilidad)
6. [Pruebas de aceptación](#6-pruebas-de-aceptación)
7. [Conclusiones](#7-conclusiones)

---

# 1. Introducción

Este documento describe el proceso de **verificación y validación (V&V)** del sistema
SmartComedor. Las pruebas garantizan que el software cumple los requisitos funcionales
y no funcionales definidos en la Primera Parte, y que las reglas de negocio críticas
(elegibilidad SISBÉN, cálculo de almuerzos, control de asistencia, control de acceso,
auditoría) se comportan de forma correcta, segura y predecible.

La estrategia de pruebas combina varios niveles, de lo más granular a lo más global:

- **Pruebas unitarias** — verifican controladores, *middleware* y servicios de forma
  aislada (mocks), aplicando técnicas de caja negra (clases de equivalencia, valores
  límite) y de caja blanca (cobertura de caminos / grafo de flujo).
- **Pruebas de integración** — verifican la colaboración entre módulos, con dos
  estrategias: **incremental (bottom-up)** y **basada en hilos (por actor)**.
- **Pruebas de sistema** — verifican atributos de calidad: **seguridad**,
  **rendimiento** (carga/estrés con JMeter), **usabilidad** y **portabilidad**
  (cross-browser con BrowserStack/Playwright).
- **Pruebas de aceptación** — validan, desde la perspectiva del usuario, que los flujos
  de negocio completos satisfacen las necesidades reales.

> **Resumen de resultados (suite automatizada):** 10 suites de prueba, **196 pruebas
> ejecutadas, 196 aprobadas (100 %)**, con una **cobertura global de ~80,4 % de
> sentencias** medida con Jest. El detalle se presenta en la sección 3.3.

---

# 2. Planificación de las pruebas

## 2.1 Objetivos de las pruebas

| ID | Objetivo |
|----|----------|
| OBJ-01 | Verificar que cada requisito funcional (RF-01 … RF-45) está implementado y se comporta según lo especificado. |
| OBJ-02 | Verificar las reglas de negocio críticas: cálculo de almuerzos (`floor(monto/2000)`), monto mínimo (`$2000`), un almuerzo por día, día autorizado, disponibilidad de almuerzos, validación SISBÉN. |
| OBJ-03 | Verificar el control de acceso: autenticación (JWT), autorización por rol y manejo de cuentas inactivas/no autorizadas. |
| OBJ-04 | Detectar defectos lo antes posible mediante pruebas unitarias y de integración automatizadas. |
| OBJ-05 | Validar atributos de calidad (seguridad, rendimiento, usabilidad, portabilidad). |
| OBJ-06 | Asegurar una cobertura de código adecuada y trazable mediante reportes. |
| OBJ-07 | Validar, con criterios de aceptación, que el sistema satisface las necesidades de los usuarios finales. |

## 2.2 Alcance de las pruebas

### 2.2.1 Dentro del alcance

- Controladores del backend (auth, students, supervisors, meals, payments, ratings,
  complaints, news, cycle).
- *Middleware* de seguridad (`authenticate`, `authorize`, `optionalAuth`).
- Servicios (validación SISBÉN, auditoría).
- Flujos de integración entre módulos (auth → students → payments → meals).
- Atributos de calidad: cabeceras de seguridad, control de acceso, carga/estrés,
  portabilidad cross-browser, usabilidad/accesibilidad básica.

### 2.2.2 Fuera del alcance (o cubierto indirectamente)

- Pruebas exhaustivas de la capa de presentación (componentes React unitarios).
- Pruebas de proveedores externos (SMTP de Gmail, infraestructura de BrowserStack).
- Penetration testing avanzado más allá del escaneo automatizado (ZAP) y JMeter.

## 2.3 Estrategias de pruebas

| Nivel | Técnica | Herramienta | Ubicación |
|-------|---------|-------------|-----------|
| Unitario | Caja negra (equivalencia, valores límite) + caja blanca (caminos) | Jest + ts-jest | `server/src/tests/unit/` |
| Integración | Incremental (bottom-up) | Jest | `server/src/tests/integration/incremental.test.ts` |
| Integración | Basada en hilos (por actor) | Jest | `server/src/tests/integration/threads.test.ts` |
| Sistema — Seguridad | Verificación de cabeceras, control de acceso, escaneo | Playwright + OWASP ZAP + JMeter | `tests/security/` |
| Sistema — Rendimiento | Carga y estrés | Apache JMeter (Docker) | `tests/security/jmeter/` |
| Sistema — Portabilidad | Cross-browser | Playwright + BrowserStack | `tests/security/browserstack/portability.test.ts` |
| Sistema — Usabilidad | Inspección heurística + accesibilidad | Playwright + revisión MUI | `tests/security/browserstack/` |
| Aceptación | Escenarios de usuario (Gherkin) | Manual / Playwright | Sección 6 |

### 2.3.1 Técnicas de diseño de casos

- **Particiones de equivalencia:** se agrupan entradas en clases válidas e inválidas
  (p. ej. credenciales correctas vs. incorrectas, roles válidos vs. no permitidos).
- **Análisis de valores límite:** se prueban fronteras de los rangos (p. ej. cédula de
  6 y 12 dígitos, contraseña de exactamente 8 caracteres, monto = 2000 vs. 1999).
- **Cobertura de caminos (grafo de flujo):** para el login se ejercitan los 7 caminos
  independientes del flujo de decisión.
- **Pruebas basadas en estado:** verificación → disponibilidad de almuerzos → consumo.

## 2.4 Ambiente de pruebas

### 2.4.1 Software

| Elemento | Versión / Detalle |
|----------|-------------------|
| Node.js | 20+ (probado con v22) |
| Framework de pruebas | Jest 29 + ts-jest 29 |
| Lenguaje | TypeScript 5 |
| Base de datos en pruebas unitarias/integración | **Mock en memoria** (sin PostgreSQL real) |
| Pruebas de sistema | Docker (JMeter), Playwright 1.44, BrowserStack, OWASP ZAP |

### 2.4.2 Scripts de ejecución (backend)

```bash
cd server
npm test                  # toda la suite
npm run test:unit         # solo unitarias  (jest --testPathPattern=tests/unit)
npm run test:integration  # solo integración(jest --testPathPattern=tests/integration)
npm run test:coverage     # con reporte de cobertura
```

### 2.4.3 Scripts de pruebas de sistema

```bash
# Rendimiento / seguridad con JMeter (Docker)
tests/security/jmeter/run-jmeter.sh          # plan de seguridad
tests/security/jmeter/run-load-stress.sh     # carga y estrés (200 hilos por defecto)

# Portabilidad y seguridad frontend (Playwright/BrowserStack)
cd tests/security/browserstack && npm test
```

### 2.4.4 Datos de prueba

Los datos se generan en memoria por cada caso (aislamiento total) y, para el entorno
de aplicación, mediante `npm run db:seed`. Credenciales de ejemplo usadas en los
planes de carga: `admin@test.com` / `Admin1234!`.

---

# 3. Pruebas unitarias

## 3.1 Análisis de las pruebas

Las pruebas unitarias aíslan la unidad bajo prueba (controlador, *middleware* o
servicio) mediante **mocks** de los modelos Sequelize, de `jsonwebtoken`, de `bcrypt`,
de `nodemailer` y del sistema de archivos. Esto permite ejecutar la suite **sin una
base de datos real** y de forma determinista y veloz.

Se priorizaron las unidades de mayor riesgo:

| Unidad | Riesgo cubierto |
|--------|-----------------|
| `authController` | Seguridad de acceso, emisión de tokens, recuperación de contraseña, 2FA |
| `middleware/auth` | Control de acceso (authenticate/authorize/optionalAuth) |
| `paymentsController` | Cálculo monetario de almuerzos (regla de negocio crítica) |
| `mealsController` | Reglas de asistencia (día, duplicado, disponibilidad) |
| `studentsController` | CRUD, importación, validación SISBÉN, almuerzos |
| `supervisorsController` | Invitaciones, asignaciones, estados |
| `ratings/complaints/news` | Retroalimentación y publicación |
| `sisbenValidationService` | Extracción de texto (PDF/OCR) y cotejo de elegibilidad |

### 3.1.1 Distribución de casos por suite

| Suite (archivo) | Casos `it()` |
|-----------------|-------------:|
| `unit/authController.test.ts` | 59 |
| `unit/studentsController.test.ts` | 28 |
| `unit/paymentsController.test.ts` | 21 |
| `unit/supervisorsController.test.ts` | 19 |
| `unit/ratingsComplaintsNews.test.ts` | 17 |
| `unit/middleware.test.ts` | 15 |
| `unit/mealsController.test.ts` | 13 |
| `unit/sisbenValidationService.test.ts` | 6 |
| `integration/incremental.test.ts` | 16 |
| `integration/threads.test.ts` | 8 |
| **Total** | **202** declarados (196 ejecutados/aprobados) |

## 3.2 Diseño de casos de prueba

### 3.2.1 Caja negra — Clases de equivalencia (Login, `authController`)

| Caso | Entrada | Clase | Resultado esperado |
|------|---------|-------|--------------------|
| TC-LOGIN-001 | admin válido | Válida | 200 + tokens |
| TC-LOGIN-002 | estudiante válido | Válida | 200 + tokens |
| TC-LOGIN-003 | supervisor autorizado | Válida | 200 + tokens |
| TC-LOGIN-004 | sin email | Inválida (campos) | 400 |
| TC-LOGIN-005 | sin password | Inválida (campos) | 400 |
| TC-LOGIN-006 | sin role | Inválida (campos) | 400 |
| TC-LOGIN-007 | usuario inexistente | Inválida (credenciales) | 401 |
| TC-LOGIN-008 | contraseña incorrecta | Inválida (credenciales) | 401 |
| TC-LOGIN-009 | usuario inactivo | Inválida (estado) | 401 |
| TC-LOGIN-010 | rol no coincide | Inválida (rol) | 403 |
| TC-LOGIN-011 | admin no autorizado | Inválida (autorización) | 403 |
| TC-LOGIN-012 | supervisor no autorizado | Inválida (autorización) | 403 |
| TC-LOGIN-013 | excepción del servidor | Error interno | 500 |

### 3.2.2 Caja blanca — Cobertura de caminos (grafo de flujo del login)

El método `login` tiene un grafo de flujo con 7 caminos independientes. Cada camino se
ejercita con un caso:

| Camino | Descripción | Esperado |
|--------|-------------|----------|
| Camino 1 | Campos faltantes | 400 |
| Camino 2 | Campos OK → usuario no existe | 401 |
| Camino 3 | Campos OK → contraseña incorrecta | 401 |
| Camino 4 | Campos OK → pass OK → inactivo | 401 |
| Camino 5 | Campos OK → pass OK → activo → rol incorrecto | 403 |
| Camino 6 | Camino completo hasta no autorizado | 403 |
| Camino 7 | Camino completo exitoso | 200 |

> Complejidad ciclomática del flujo = 7 ⇒ 7 caminos linealmente independientes, todos
> cubiertos.

### 3.2.3 Caja negra — Valores límite (registro y montos)

| Caso | Atributo | Valor | Resultado |
|------|----------|-------|-----------|
| VL-EMAIL-001 | email | 30 caracteres | válido |
| VL-CEDULA-001 | cédula | 6 dígitos (mínimo) | válido |
| VL-CEDULA-002 | cédula | 12 dígitos (máximo) | válido |
| VL-CEDULA-003 | cédula | 5 dígitos | inválido |
| VL-NOMBRE-001 | nombre | 20 caracteres | válido |
| VL-NOMBRE-002 | nombre | 21 caracteres | inválido |
| VL-MONTO-001 | monto | 2000 | 1 almuerzo |
| VL-MONTO-002 | monto | 1999 | 0 almuerzos |
| VL-MONTO-003 | monto | 10000 | 5 almuerzos |
| VL-MONTO-004 | monto | 4500 | 2 almuerzos (residuo 500) |
| VL-CALC-002 | calcular | 1999 | 400 (debajo del mínimo) |
| VL-CALC-005 | calcular | 10000 | 5 almuerzos |
| VL-CALC-006 | calcular | 24000 | 12 almuerzos |
| VL-CALC-007 | calcular | ≤ 0 | 400 |

### 3.2.4 Casos del registro de almuerzo (`mealsController`)

| Caso | Escenario | Esperado |
|------|-----------|----------|
| TC-MEAL-001 | Registro exitoso (camino completo) | 201 |
| TC-MEAL-002 | Supervisor no autenticado | 401 |
| TC-MEAL-003 | Estudiante no encontrado | 404 |
| TC-MEAL-004 | Estudiante inactivo | 400 |
| TC-MEAL-005 | Día no autorizado | 400 |
| TC-MEAL-006 | Ya usó el comedor hoy | 400 |
| TC-MEAL-007 | Sin almuerzos disponibles | 400 |
| TC-MEAL-008 | Actualiza `mealsUsed` en el último pago | OK |
| TC-MEAL-009 | Registra `SupervisorLog` | OK |

### 3.2.5 Casos del *middleware* de seguridad

| Caso | Escenario | Esperado |
|------|-----------|----------|
| TC-AUTH-MW-001 | Token válido | `next()` |
| TC-AUTH-MW-002 | Sin header Authorization | 401 |
| TC-AUTH-MW-003 | Header sin Bearer | 401 |
| TC-AUTH-MW-004 | Token JWT inválido | 401 |
| TC-AUTH-MW-005 | Usuario no existe en BD | 401 |
| TC-AUTH-MW-006 | Usuario inactivo | 401 |
| TC-AUTHZ-001 | Rol permitido | `next()` |
| TC-AUTHZ-002 | Sin `req.user` | 401 |
| TC-AUTHZ-003 | Rol no permitido | 403 |
| TC-AUTHZ-004 | Solo ADMIN accede a rutas admin | OK |
| TC-AUTHZ-005 | ADMIN o SUPERVISOR acceden | OK |
| TC-OPT-001 | Sin token | `next()` sin error |
| TC-OPT-002 | Token válido | `req.user` asignado |
| TC-OPT-003 | Token inválido | `next()` (swallow) |
| TC-OPT-004 | Usuario inactivo | `next()` sin asignar user |

> El catálogo completo de los 202 casos (incluyendo refresh token, perfil, recuperación
> de contraseña, 2FA, estudiantes, supervisores, pagos, ratings, quejas y noticias)
> está implementado en `server/src/tests/unit/` con identificadores `TC-*` / `VL-*`.

## 3.3 Ejecución y evaluación de las pruebas

### 3.3.1 Resultado de ejecución

Ejecución de `npm run test:coverage` en `server/`:

```
Test Suites: 10 passed, 10 total
Tests:       196 passed, 196 total
Snapshots:   0 total
Time:        ~4.7 s
```

| Suite | Resultado |
|-------|-----------|
| `unit/authController.test.ts` | PASS |
| `unit/studentsController.test.ts` | PASS |
| `unit/supervisorsController.test.ts` | PASS |
| `unit/mealsController.test.ts` | PASS |
| `unit/paymentsController.test.ts` | PASS |
| `unit/ratingsComplaintsNews.test.ts` | PASS |
| `unit/middleware.test.ts` | PASS |
| `unit/sisbenValidationService.test.ts` | PASS |
| `integration/incremental.test.ts` | PASS |
| `integration/threads.test.ts` | PASS |

### 3.3.2 Cobertura de código (Jest / Istanbul)

| Ámbito | % Sentencias | % Ramas | % Funciones | % Líneas |
|--------|-------------:|--------:|------------:|---------:|
| **Total** | **80,44** | **70,25** | **76,41** | **79,91** |
| constants | 100 | 100 | 100 | 100 |
| middleware (`auth.ts`) | 97,50 | 91,66 | 100 | 97,29 |
| services | 96,66 | 78,94 | 87,50 | 96,36 |
| services/`sisbenValidationService.ts` | 100 | 93,33 | 100 | 100 |
| services/`auditService.ts` | 83,33 | 25 | 50 | 80 |
| controllers (global) | 78,47 | 67,75 | 74,19 | 77,90 |
| `authController.ts` | 83,33 | 81,19 | 84,61 | 82,93 |
| `ratingsController.ts` | 85 | 66,66 | 100 | 82,85 |
| `complaintsController.ts` | 80 | 60 | 100 | 82,85 |
| `supervisorsController.ts` | 79,54 | 80 | 78,57 | 77,68 |
| `paymentsController.ts` | 78,94 | 70,45 | 66,66 | 77,27 |
| `studentsController.ts` | 78,50 | 62,02 | 78,26 | 77,34 |
| `newsController.ts` | 77,55 | 66,66 | 100 | 75 |
| `mealsController.ts` | 63 | 31,81 | 31,25 | 65,11 |

### 3.3.3 Evaluación

- **Tasa de éxito: 100 %** (196/196). No se detectaron defectos abiertos en la suite
  automatizada.
- La **lógica de seguridad** (`middleware/auth.ts`) y la **validación SISBÉN** alcanzan
  cobertura muy alta (≥ 97 % y 100 % de sentencias respectivamente), lo cual es
  apropiado por ser componentes críticos.
- Áreas con **menor cobertura** (oportunidades de mejora):
  - `mealsController.ts` (63 % sentencias / 31,8 % ramas): faltan ramas de la analítica
    del tablero (`getDashboardAnalytics`) y algunos caminos del historial.
  - `auditService.ts` (25 % ramas): el manejo de error del *logging* está poco cubierto.
- **Acción recomendada:** añadir casos para `getDashboardAnalytics` y para los caminos
  de error de `auditService` para elevar la cobertura de ramas por encima del 80 %.

---

# 4. Pruebas de integración

Las pruebas de integración verifican que los módulos colaboran correctamente. Se
aplicaron **dos estrategias complementarias**, ambas con una base de datos simulada en
memoria que reproduce las asociaciones reales entre entidades.

## 4.1 Estrategia de pruebas incrementales

### 4.1.1 Descripción (bottom-up)

Implementada en `server/src/tests/integration/incremental.test.ts`. Se integran los
módulos **de abajo hacia arriba**, verificando la comunicación entre ellos:

```
1. Módulo Auth (base)        — Login, Register
2. Módulo Students (usa Auth)— CRUD, Validación SISBÉN
3. Módulo Payments (usa Students) — Crear pagos, Calcular almuerzos
4. Módulo Meals (usa Students + Payments) — Registro de almuerzos
```

Cada nivel se prueba solo cuando el nivel inferior ya está integrado, de modo que un
fallo se localiza en el módulo recién incorporado.

### 4.1.2 Diseño de casos de prueba

| Caso | Módulos integrados | Escenario | Esperado |
|------|--------------------|-----------|----------|
| INT-AUTH-001 | Auth | Register → Login → Get Profile | Perfil correcto |
| INT-AUTH-002 | Auth | Login con credenciales incorrectas | Falla controlada |
| INT-AUTH-003 | Auth | Admin no autorizado no puede loguearse | 403 |
| INT-STU-001 | Auth + Students | Crear usuario y estudiante, obtener con almuerzos | OK |
| INT-STU-002 | Students | Validar SISBÉN actualiza flag en student | flag = true |
| INT-STU-003 | Auth + Students | Deshabilitar usuario deshabilita estudiante | inactivo |
| INT-PAY-001 | Students + Payments | Crear pago y calcular almuerzos disponibles | OK |
| INT-PAY-002 | Payments | Múltiples pagos acumulan almuerzos | suma correcta |
| INT-PAY-003 | Payments | Verificar pago lo marca como verificado | isVerified=true |
| INT-MEAL-001 | Students + Payments + Meals | Registrar almuerzo decrementa disponibilidad | -1 |
| INT-MEAL-002 | Meals | No permitir registrar si ya comió hoy | rechazo |
| INT-MEAL-003 | Meals | No permitir registrar sin almuerzos disponibles | rechazo |
| INT-MEAL-004 | Meals | Registrar almuerzo crea `SupervisorLog` | log creado |

### 4.1.3 Ejecución y evaluación

- Resultado: **PASS** (16 casos).
- Se confirma que las **interfaces entre módulos** funcionan: el flag de SISBÉN se
  propaga al estudiante, la verificación de pagos habilita almuerzos disponibles y el
  registro de almuerzo actualiza correctamente la disponibilidad y la bitácora.
- La integración bottom-up permitió validar que la regla acumulativa de almuerzos
  (varios pagos) y la regla de consumo (un almuerzo por día) operan en conjunto.

## 4.2 Estrategia de pruebas basadas en hilos

### 4.2.1 Descripción (thread-based, por actor)

Implementada en `server/src/tests/integration/threads.test.ts`. Cada "hilo" prueba la
**secuencia completa de interacciones de un actor** de principio a fin:

```
HILO 1 — Estudiante:
  Registro → Login → Ver Perfil → Subir Pago → Ver Almuerzos Disponibles
  → Calificar Servicio → Ver Noticias → Enviar Queja

HILO 2 — Supervisor:
  Login (autorizado) → Buscar Estudiante → Registrar Almuerzo → Verificar Historial

HILO 3 — Administrador:
  Login → Crear Supervisor → Asignar Estudiante → Verificar Pago
  → Validar SISBÉN → Ver Reportes
```

### 4.2.2 Diseño de casos de prueba

| Caso | Hilo | Escenario | Esperado |
|------|------|-----------|----------|
| H1-001 | Estudiante | Flujo completo desde registro hasta envío de queja | Todos los pasos OK |
| H1-002 | Estudiante | No puede registrar almuerzo sin pagos | rechazo |
| H2-001 | Supervisor | Flujo completo: supervisor registra almuerzo de estudiante | almuerzo registrado |
| H3-xxx | Administrador | Login → crear supervisor → asignar → verificar pago → validar SISBÉN | flujo administrativo OK |

### 4.2.3 Ejecución y evaluación

- Resultado: **PASS** (8 casos).
- Las pruebas por hilo validan los **recorridos de usuario reales** end-to-end a nivel
  de lógica de negocio (sin UI), confirmando que la composición de operaciones de cada
  rol produce el estado esperado del sistema.
- Complementan a las incrementales: mientras las incrementales validan **interfaces
  entre capas**, las de hilos validan **flujos completos por actor**.

---

# 5. Pruebas de sistema

Las pruebas de sistema evalúan atributos de calidad sobre el sistema desplegado.

## 5.1 Pruebas de seguridad

### 5.1.1 Diseño

Se diseñaron pruebas automatizadas de seguridad en dos frentes:

1. **API y frontend (Playwright)** — `tests/security/browserstack/security.test.ts`.
2. **Escaneo dinámico (OWASP ZAP)** — `tests/security/zap/` (DAST).
3. **Inyección y fuzzing (JMeter)** — `tests/security/jmeter/security-plan.jmx` y
   `sql-payloads.csv`.

Casos de prueba de seguridad (Playwright):

| Grupo | Caso | Verificación |
|-------|------|--------------|
| Cabeceras | `X-Powered-By` no expuesto | La API no revela tecnología |
| Cabeceras | `X-Content-Type-Options: nosniff` | Evita MIME sniffing |
| Cabeceras | Protección anti-clickjacking | `X-Frame-Options`/CSP |
| Cabeceras | `Content-Type: application/json` | Tipo correcto |
| Acceso | `GET /api/students` sin token | 401 |
| Acceso | `GET /api/audit` sin token | 401 |
| Acceso | `GET /api/supervisors` sin token | 401 |
| Acceso | `POST /api/auth/login` credenciales inválidas | 401 |
| Errores | Login no filtra stack traces | Mensaje genérico |
| Rutas | Endpoint inexistente | 404 (no 200) |
| Frontend | Redirige a login si no autenticado | Redirección |
| Frontend | Campo password con `autocomplete='off'` | No autocompleta |
| Frontend | No expone tokens en la URL tras login | URL limpia |
| Frontend | Bundle no expone variables sensibles | Sin secretos |
| Frontend | Cookies de sesión con `HttpOnly` | No accesibles por JS |
| Frontend | Sin errores críticos de consola | Limpio |

### 5.1.2 Ejecución y evaluación

- El diseño valida los requisitos **RNF-01 … RNF-08**.
- El control de acceso por token y rol queda corroborado tanto a nivel unitario
  (TC-AUTH-MW-*, TC-AUTHZ-*) como de sistema (rechazos 401 en endpoints protegidos).
- La política de **no filtrar stack traces** y de **mensaje genérico** en recuperación
  de contraseña (TC-FORGOT-003) reduce la fuga de información.
- Los filtros de auditoría usan **listas blancas** (método, código, ruta, rol),
  mitigando inyección por parámetros (verificado en `auditRoutes.ts`).
- Para inyección SQL, el uso de **Sequelize con consultas parametrizadas** y el plan
  JMeter con `sql-payloads.csv` permiten comprobar que los payloads no alteran el
  comportamiento ni exponen datos.

> **Nota de ejecución:** las pruebas de seguridad de sistema requieren la app desplegada
> (frontend en `:5174`, backend en `:3002`) y, para BrowserStack/ZAP, credenciales y
> túnel local. Los scripts y configuraciones están versionados y listos para ejecutarse.

## 5.2 Pruebas de rendimiento

### 5.2.1 Diseño

Implementadas con **Apache JMeter** ejecutado en Docker (`justb4/jmeter`):

| Plan | Archivo | Propósito |
|------|---------|-----------|
| Carga | `tests/security/jmeter/load-test.jmx` | Comportamiento bajo carga sostenida |
| Estrés | `tests/security/jmeter/stress-test.jmx` | Punto de quiebre con carga creciente |
| Seguridad | `tests/security/jmeter/security-plan.jmx` | Aserciones de seguridad/inyección |

Parámetros por defecto del script `run-load-stress.sh`:

| Parámetro | Valor por defecto | Significado |
|-----------|------------------:|-------------|
| `LOAD_THREADS` | 200 | usuarios virtuales concurrentes |
| `LOAD_RAMP_SECS` | 60 | tiempo de rampa de subida |
| `LOAD_DURATION_SECS` | 300 | duración de la prueba |
| `THRESHOLD_MS` | 500 | umbral de tiempo de respuesta aceptable |

El plan primero verifica disponibilidad (`GET /api/health`) antes de inyectar carga.

### 5.2.2 Ejecución y evaluación

- **Objetivo (RNF-09/RNF-10):** la autenticación y las consultas críticas deben
  responder dentro del umbral (objetivo < 3 s; umbral estricto configurado en 500 ms).
- El reporte HTML de JMeter (`results/html-report/index.html`) entrega métricas de
  tiempo de respuesta (media, percentiles), *throughput* y tasa de error.
- **Criterio de aceptación:** tasa de error ≈ 0 % y percentil 95 por debajo del umbral
  bajo la carga objetivo. El script marca como atención cualquier aserción fallida.
- La **paginación** de los listados (RNF-11) acota el tamaño de respuesta y favorece el
  rendimiento bajo volumen alto de datos.

## 5.3 Pruebas de usabilidad

### 5.3.1 Diseño

La usabilidad se evaluó mediante **inspección heurística** (heurísticas de Nielsen) y
verificaciones automatizadas de accesibilidad básica, alineadas con la regla de diseño
**Material Design 3 / MUI** del proyecto.

| Heurística / criterio | Verificación |
|-----------------------|--------------|
| Visibilidad del estado del sistema | Estados de carga/disabled/success/error (componente `FeedbackState`) |
| Correspondencia con el mundo real | Copys en español, terminología del dominio (comedor, ciclo, SISBÉN) |
| Prevención de errores | Validación de formularios, `labels` visibles, campos requeridos |
| Reconocer antes que recordar | Navegación por rol, `Layout` y `DataSectionCard` reutilizables |
| Flexibilidad y eficiencia | Asistente virtual (`VirtualAssistant`), búsqueda y paginación |
| Diseño estético y minimalista | Componentes MUI responsive, jerarquía tipográfica |
| Accesibilidad | `label`/`aria-label` en inputs, landmark `main`, foco visible |

Casos automatizados relacionados (Playwright):

| Caso | Verificación |
|------|--------------|
| Inputs del login con labels o `aria-label` | Accesibilidad de formularios |
| El documento tiene `<main>` o `role='main'` | Estructura semántica |
| Botón de submit presente y clickeable | Affordance de acción |
| El formulario muestra error con credenciales inválidas | Retroalimentación al usuario |

### 5.3.2 Ejecución y evaluación

- La interfaz por rol y los componentes reutilizables (`Layout`, `DataSectionCard`,
  `FileUploadField`, `FeedbackState`) garantizan **consistencia** y reducen la carga
  cognitiva (RNF-16/RNF-17/RNF-18).
- Las verificaciones de accesibilidad básica (labels, landmark, foco) pasan en el
  formulario de login.
- **Recomendación:** complementar con pruebas de usabilidad con usuarios reales (tareas
  cronometradas y cuestionario SUS) para obtener una métrica cuantitativa de
  satisfacción.

## 5.4 Pruebas de portabilidad

### 5.4.1 Diseño

Implementadas con **Playwright sobre BrowserStack** (`tests/security/browserstack/`).
La matriz de navegadores/plataformas definida en `browserstack.yml`:

| Navegador | Versión | SO |
|-----------|---------|-----|
| Chrome | latest | Windows 11 |
| Firefox | latest | macOS Sonoma |
| Edge | latest | Windows 10 |
| Safari | latest | macOS Ventura |

Suites de portabilidad (`portability.test.ts`):

| Suite | Casos representativos |
|-------|-----------------------|
| Carga y renderizado | App carga sin errores JS; título definido; viewport ≥ 1024 px; recursos críticos sin 404 |
| Navegación y routing | `/login` carga; ruta protegida redirige; History API (atrás) funciona; 404 manejado por la SPA |
| Formulario de login | Acepta input; botón submit clickeable; muestra error con credenciales inválidas |
| APIs del navegador | `localStorage`, `fetch`, `Promise`, CSS variables, Flexbox soportados |
| Conectividad API | El navegador alcanza `/api/health`; CORS no bloquea el frontend |
| Accesibilidad básica | `main`/`role='main'`; inputs con labels |

### 5.4.2 Ejecución y evaluación

- Valida **RNF-19/RNF-20/RNF-21**: el frontend funciona en los cuatro navegadores
  principales sin necesidad de polyfills (APIs ES2015+ disponibles).
- La SPA maneja correctamente *routing*, History API y rutas 404, garantizando una
  experiencia consistente cross-browser.
- La portabilidad de **despliegue** se garantiza con Docker Compose (independiente del
  SO anfitrión).

> **Nota de ejecución:** requiere `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` y
> el túnel BrowserStack Local activo, con la app corriendo localmente.

---

# 6. Pruebas de aceptación

## 6.1 Diseño de casos de prueba

Las pruebas de aceptación validan, desde la perspectiva del usuario, que los flujos de
negocio completos satisfacen las necesidades reales. Se expresan como criterios de
aceptación en formato **Gherkin (Dado–Cuando–Entonces)**.

### CA-01 — Registro y validación de un estudiante elegible

```
Dado que soy un estudiante con categoría SISBÉN válida (grupo A/B/C)
  Y dispongo de mi documento SISBÉN, cédula frontal y horario
Cuando me registro y el administrador valida mi SISBÉN
Entonces mi cuenta queda creada
  Y mi estado de validación SISBÉN pasa a "validado"
  Y puedo iniciar sesión como estudiante
```
**Criterio de aceptación:** registro 201; validación automática cotejada; login 200.

### CA-02 — Recarga y verificación de almuerzos

```
Dado que soy un estudiante autenticado
Cuando subo un comprobante de pago por $10.000
  Y el administrador verifica el pago
Entonces el sistema me acredita 5 almuerzos disponibles
```
**Criterio de aceptación:** `mealsIncluded = floor(10000/2000) = 5`; tras la
verificación, almuerzos disponibles = 5.

### CA-03 — Registro de asistencia al comedor

```
Dado que soy un supervisor autorizado
  Y el estudiante tiene almuerzos disponibles y hoy es un día autorizado
Cuando registro su almuerzo
Entonces se descuenta un almuerzo
  Y queda registrada la asistencia con fecha y hora
  Y se crea un registro en la bitácora del supervisor
```
**Criterio de aceptación:** 201; disponibilidad −1; `SupervisorLog` y `AuditLog`
creados.

### CA-04 — Prevención de doble consumo

```
Dado que un estudiante ya registró su almuerzo hoy
Cuando el supervisor intenta registrar otro almuerzo el mismo día
Entonces el sistema rechaza la operación con un mensaje claro
```
**Criterio de aceptación:** 400 “ya usó el comedor hoy”.

### CA-05 — Retroalimentación del servicio

```
Dado que soy un estudiante autenticado
Cuando califico el servicio con 4 estrellas y envío una sugerencia anónima
Entonces la calificación se contabiliza en el promedio
  Y la sugerencia queda registrada sin asociar mi identidad
```
**Criterio de aceptación:** rating creado; promedio actualizado; queja con
`isAnonymous = true` y sin `studentId`.

### CA-06 — Control de acceso por rol

```
Dado que soy un estudiante autenticado
Cuando intento acceder a la consulta de auditoría
Entonces el sistema deniega el acceso (403)
```
**Criterio de aceptación:** 403 para rol no permitido; 200 solo para admin/auditor.

### CA-07 — Auditoría y trazabilidad

```
Dado que soy administrador o auditor externo
Cuando consulto la auditoría filtrando por fecha y ruta
Entonces obtengo los eventos correspondientes paginados
  Y los filtros inválidos son rechazados
```
**Criterio de aceptación:** 200 con paginación; 400 ante filtros fuera de lista blanca.

## 6.2 Ejecución y evaluación de la prueba

| Caso | Soporte de verificación | Resultado |
|------|-------------------------|-----------|
| CA-01 | INT-STU-002, TC-SISBEN-001, INT-AUTH-001 | Aceptado |
| CA-02 | VL-CALC-005, INT-PAY-001/003 | Aceptado |
| CA-03 | TC-MEAL-001/008/009, INT-MEAL-001/004 | Aceptado |
| CA-04 | TC-MEAL-006, INT-MEAL-002 | Aceptado |
| CA-05 | TC-RAT-001, TC-COMP-001, TC-AVG-001 | Aceptado |
| CA-06 | TC-AUTHZ-003, pruebas de seguridad de acceso | Aceptado |
| CA-07 | RF-45, validación de listas blancas (`auditRoutes`) | Aceptado |

- Todos los criterios de aceptación quedan respaldados por pruebas automatizadas
  (unitarias y de integración) y por las pruebas de sistema (seguridad/acceso).
- **Conclusión de aceptación:** el sistema satisface los flujos de negocio esperados de
  los cuatro actores y cumple las reglas críticas de elegibilidad, recarga, consumo,
  retroalimentación, control de acceso y trazabilidad.

---

# 7. Conclusiones

1. **Calidad funcional verificada.** La suite automatizada ejecuta **196 pruebas con
   100 % de éxito** (10 suites), cubriendo controladores, *middleware*, servicios y
   flujos de integración. Las reglas de negocio críticas (cálculo de almuerzos, monto
   mínimo, un almuerzo por día, día autorizado, disponibilidad y validación SISBÉN)
   están probadas con técnicas de caja negra y caja blanca.

2. **Cobertura sólida con áreas de mejora.** La cobertura global es de **~80,4 % de
   sentencias** y **70,3 % de ramas**. Los componentes más críticos para la seguridad
   (`middleware/auth`) y la elegibilidad (`sisbenValidationService`) alcanzan cobertura
   muy alta (≥ 97 % y 100 %). Se recomienda elevar la cobertura de ramas de
   `mealsController` (analítica) y de `auditService` (manejo de errores).

3. **Estrategias de integración complementarias.** La estrategia **incremental
   (bottom-up)** valida las interfaces entre capas (Auth → Students → Payments → Meals)
   y la estrategia **basada en hilos** valida los recorridos completos por actor
   (estudiante, supervisor, administrador). Ambas pasan al 100 %.

4. **Atributos de calidad cubiertos.** Se dispone de planes ejecutables para
   **seguridad** (Playwright + OWASP ZAP + JMeter con listas blancas y cabeceras),
   **rendimiento** (carga/estrés con JMeter, 200 hilos, umbrales configurables),
   **usabilidad** (heurísticas + accesibilidad básica sobre MUI/Material Design 3) y
   **portabilidad** (cross-browser Chrome/Firefox/Edge/Safari con BrowserStack + Docker).

5. **Seguridad y trazabilidad por diseño.** El control de acceso por JWT y rol, el 2FA
   para estudiantes, el cifrado de contraseñas, la no exposición de stack traces, los
   mensajes genéricos en recuperación de contraseña y la auditoría completa
   (`audit_logs`, `supervisor_logs`) constituyen una base de seguridad robusta y
   verificada.

6. **Aceptación del usuario.** Los siete criterios de aceptación definidos quedan
   respaldados por pruebas automatizadas y de sistema, confirmando que SmartComedor
   satisface las necesidades reales de los actores del comedor universitario.

### 7.1 Recomendaciones

- Incrementar la cobertura de ramas en `mealsController` y `auditService`.
- Añadir pruebas unitarias de componentes React (frontend) con Testing Library.
- Ejecutar periódicamente los planes de JMeter y BrowserStack en CI para detectar
  regresiones de rendimiento y portabilidad.
- Realizar pruebas de usabilidad con usuarios reales (cuestionario SUS) para
  cuantificar la satisfacción.

---

> **Documento complementario:** PRIMERA PARTE — Descripción del Sistema
> (`docs/DOCUMENTACION-PARTE1-DESCRIPCION-DEL-SISTEMA.md`).
