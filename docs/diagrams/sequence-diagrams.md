# Diagramas de Secuencia — SmartDiningRoom

## 1. Login de Usuario (con validación de rol y generación de JWT)

```mermaid
sequenceDiagram
    actor Cliente
    participant :AuthController
    participant :User (Model)
    participant :Student (Model)
    participant :AuditService
    participant :AuditLog (Model)

    Cliente->>:AuthController: POST /api/auth/login { email, password, role }

    alt Campos faltantes
        :AuthController-->>Cliente: 400 "Email, contraseña y rol son requeridos"
    end

    :AuthController->>:User (Model): findOne({ where: { email } })

    alt Usuario no existe
        :AuthController-->>Cliente: 401 "Credenciales inválidas"
    end

    :AuthController->>:User (Model): validatePassword(password)

    alt Contraseña incorrecta
        :AuthController-->>Cliente: 401 "Credenciales inválidas"
    end

    alt Usuario inactivo
        :AuthController-->>Cliente: 401 "Usuario inactivo"
    end

    alt Rol no coincide (user.role !== role)
        :AuthController-->>Cliente: 403 "Usted no está autorizado"
    end

    alt Admin/Supervisor/Auditor no autorizado (isAuthorized=false)
        :AuthController-->>Cliente: 403 "Usted no está autorizado"
    end

    alt Rol es STUDENT con 2FA habilitado
        :AuthController->>:Student (Model): findOne({ where: { userId } })
        :Student (Model)-->>:AuthController: student (qrCode, qrCodeSecret)

        alt Sin twoFactorToken
            :AuthController-->>Cliente: 200 { requiresTwoFactor: true, twoFactorToken }
            Cliente->>:AuthController: POST /api/auth/login { ..., twoFactorCode, twoFactorToken }
            :AuthController->>:AuthController: jwt.verify(twoFactorToken)
            :AuthController->>:AuthController: speakeasy.totp.verify(code, secret)
            alt Código 2FA inválido
                :AuthController-->>Cliente: 400 "Código 2FA inválido o expirado"
            end
        end
    end

    :AuthController->>:AuthController: generateTokens(user) → { accessToken (15m), refreshToken (7d) }
    :AuthController->>:AuditService: logAction(userId, email, 'LOGIN', details, req)
    :AuditService->>:AuditLog (Model): create({ userId, userEmail, action, details, ipAddress })

    :AuthController-->>Cliente: 200 { message, user, accessToken, refreshToken }
```

---

## 2. Registro de Almuerzo por Supervisor

```mermaid
sequenceDiagram
    actor Supervisor
    participant :MealsController
    participant :Student (Model)
    participant :User (Model)
    participant :MealAttendance (Model)
    participant :Payment (Model)
    participant :SupervisorLog (Model)
    participant :EmailService
    participant :AuditService

    Supervisor->>:MealsController: POST /api/meals/register { studentId }

    alt No autenticado (sin supervisorId)
        :MealsController-->>Supervisor: 401 "No autenticado"
    end

    :MealsController->>:Student (Model): findByPk(studentId)

    alt Estudiante no encontrado
        :MealsController-->>Supervisor: 404 "Estudiante no encontrado"
    end

    :MealsController->>:User (Model): findByPk(student.userId)

    alt Usuario inactivo
        :MealsController-->>Supervisor: 400 "Estudiante inactivo"
    end

    :MealsController->>:MealsController: Obtener día actual en español (Lunes..Viernes)

    alt Día no autorizado (no está en diasComedor)
        :MealsController-->>Supervisor: 400 "El estudiante no tiene autorización para este día"
    end

    :MealsController->>:MealAttendance (Model): findOne({ studentId, date: today })

    alt Ya asistió hoy
        :MealsController-->>Supervisor: 400 "El estudiante ya usó el comedor hoy"
    end

    :MealsController->>:Payment (Model): findAll({ studentId, isVerified: true })
    :Payment (Model)-->>:MealsController: payments[]
    :MealsController->>:MealsController: totalMeals = sum(mealsIncluded) - sum(mealsUsed)

    alt Sin almuerzos disponibles (availableMeals <= 0)
        :MealsController-->>Supervisor: 400 "El estudiante no tiene almuerzos disponibles"
    end

    :MealsController->>:MealAttendance (Model): create({ studentId, supervisorId, date, hora })
    :MealAttendance (Model)-->>:MealsController: attendance

    :MealsController->>:Payment (Model): latestPayment.update({ mealsUsed: mealsUsed + 1 })

    :MealsController->>:SupervisorLog (Model): create({ supervisorId, studentId, action: 'Registro de almuerzo', hora })

    :MealsController->>:EmailService: sendMealConfirmation(user, student, date)
    EmailService-->>:MealsController: (async, no bloquea)

    :MealsController->>:AuditService: logAction(userId, email, 'REGISTER_MEAL', details, req)

    :MealsController-->>Supervisor: 200 { message, attendance, mealsRemaining }
```

---

## 3. Creación y Validación de Pago por Administrador

```mermaid
sequenceDiagram
    actor Admin
    participant :PaymentsController
    participant :Student (Model)
    participant :User (Model)
    participant :Payment (Model)
    participant :FileSystem (fs)
    participant :AuditService

    Note over Admin,:PaymentsController: ─── Flujo: Subir comprobante ───

    Admin->>:PaymentsController: POST /api/payments/upload { studentId, amount } + files

    alt No autenticado
        :PaymentsController-->>Admin: 401 "No autenticado"
    end

    alt Sin archivos (ni comprobante ni recibos)
        :PaymentsController-->>Admin: 400 "Archivo requerido"
    end

    :PaymentsController->>:User (Model): findByPk(requesterId)

    alt Requester es STUDENT
        :PaymentsController->>:Student (Model): findOne({ userId: requesterId })
    else Requester es ADMIN con studentId
        :PaymentsController->>:Student (Model): findByPk(studentId)
    end

    alt Estudiante no encontrado
        :PaymentsController-->>Admin: 404 "Estudiante no encontrado"
    end

    :PaymentsController->>:PaymentsController: mealsIncluded = floor(amount / 2000)
    :PaymentsController->>:Payment (Model): create({ studentId, amount, mealsIncluded, mealsUsed: 0, comprobantePath, ..., isVerified: false })
    :Payment (Model)-->>:PaymentsController: payment

    :PaymentsController->>:AuditService: logAction(id, email, 'UPLOAD_PAYMENT_RECEIPT', details, req)

    :PaymentsController-->>Admin: 201 { message, payment }

    Note over Admin,:PaymentsController: ─── Flujo: Verificar pago ───

    Admin->>:PaymentsController: PUT /api/payments/:id/verify

    :PaymentsController->>:Payment (Model): findByPk(id)

    alt Pago no encontrado
        :PaymentsController-->>Admin: 404 "Pago no encontrado"
    end

    :PaymentsController->>:Payment (Model): update({ isVerified: true, verifiedBy: adminId, verifiedAt: now })

    Note over :PaymentsController,:FileSystem (fs): Eliminar archivos de recibos (ya verificados)

    loop Por cada path (comprobantePath, universityReceiptPath, bankReceiptPath)
        alt Path no vacío
            :PaymentsController->>:FileSystem (fs): unlink(path)
            :FileSystem (fs)-->>:PaymentsController: (ok o ENOENT ignorado)
        end
    end

    :PaymentsController->>:Payment (Model): update({ comprobantePath: '', universityReceiptPath: '', bankReceiptPath: '' })

    :PaymentsController->>:AuditService: logAction(id, email, 'VERIFY_PAYMENT', details, req)

    :PaymentsController-->>Admin: 200 { message: 'Pago verificado', payment }
```

---

## 4. Registro de Estudiante con SISBEN

```mermaid
sequenceDiagram
    actor Estudiante
    participant :AuthController
    participant :User (Model)
    participant :Student (Model)
    participant :SisbenValidationService
    participant :EmailService
    participant :AuditService

    Estudiante->>:AuthController: POST /api/auth/register (multipart) { email, password, name, ..., diasComedor } + archivoSisben + cedulaFrontal + horarioPdf + reciboPago

    alt Faltan archivos obligatorios (SISBEN, cédula, horario)
        :AuthController-->>Estudiante: 400 "SISBEN, cédula frontal y horario PDF son obligatorios"
    end

    :AuthController->>:AuthController: Validar email (max 30), name (max 20), lastName (max 20)
    :AuthController->>:AuthController: Validar cédula (6-12 dígitos), password (exactamente 8)
    :AuthController->>:AuthController: Validar carrera ∈ VALID_CARRERAS, semestre ∈ 1..12
    :AuthController->>:AuthController: Validar categoriaSisben ∈ VALID_SISBEN_CATEGORIES

    alt Validación fallida
        :AuthController-->>Estudiante: 400 "mensaje descriptivo del campo inválido"
    end

    :AuthController->>:User (Model): findOne({ where: { email } })

    alt Email ya registrado
        :AuthController-->>Estudiante: 400 "El correo ya está registrado"
    end

    :AuthController->>:User (Model): create({ email, password, name, lastName, role: STUDENT, isActive: true, isAuthorized: true })
    :User (Model)-->>:AuthController: user

    Note over :AuthController,:SisbenValidationService: ─── OCR / Validación SISBEN ───

    :AuthController->>:SisbenValidationService: validateSisbenAgainstCedula(archivoSisben, cedulaFrontal, { cedula, name, lastName })

    Note over :SisbenValidationService: 1. pdf-parse extrae texto del SISBEN PDF
    Note over :SisbenValidationService: 2. tesseract.js (OCR) procesa imagen de cédula
    Note over :SisbenValidationService: 3. Compara cédula + nombre + apellido entre documentos

    :SisbenValidationService-->>:AuthController: { validated: boolean, mismatches: { cedula, name, lastName } }

    alt Error en validación (catch)
        :AuthController->>:AuthController: console.error → sisbenValidation = default (no validado)
    end

    :AuthController->>:SisbenValidationService: extractSisbenText(horarioPdf)
    :SisbenValidationService-->>:AuthController: horarioExtract (texto del PDF)

    Note over :AuthController: Parsear diasComedor (JSON string → array)

    :AuthController->>:Student (Model): create({ userId, cedula, carrera, semestre, categoriaSisben, archivoSisben, cedulaFrontalPath, horarioPdfPath, ..., isValidatedSisben: false, sisbenAutoValidated: sisbenValidation.validated, sisbenValidationDetails: { ...sisbenValidation, horarioExtract } })
    :Student (Model)-->>:AuthController: student

    :AuthController->>:AuthController: generateTokens(user) → { accessToken, refreshToken }

    :AuthController-->>Estudiante: 201 { message: 'Registro exitoso', user, sisbenValidation, tokens }

    Note over Estudiante,:Student (Model): Estado inicial del estudiante:
    Note over Estudiante,:Student (Model): • isValidatedSisben = false (pendiente validación manual)
    Note over Estudiante,:Student (Model): • sisbenAutoValidated = resultado del OCR
    Note over Estudiante,:Student (Model): • El administrador debe validar manualmente luego
```
