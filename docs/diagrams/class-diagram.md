# Diagrama de Clases — SmartDiningRoom (SmartComedor)

```mermaid
classDiagram
    direction TB

    %% ── Enums ──
    class UserRole {
        <<enumeration>>
        ADMIN
        SUPERVISOR
        STUDENT
        EXTERNAL_AUDITOR
    }
    class ComplaintType {
        <<enumeration>>
        QUEJA
        SUGERENCIA
        COMENTARIO
    }
    class CycleStatus {
        <<enumeration>>
        Activo
        Cerrado
    }

    %% ── User ──
    class User {
        +UUID id
        +String uid «USR-...»
        +String email
        +String password
        +String name
        +String lastName
        +String telefono?
        +UserRole role
        +Boolean isActive
        +Boolean isAuthorized
        +String resetPasswordToken?
        +Date resetPasswordExpires?
        +Date createdAt
        +Date updatedAt
        --
        +validatePassword(password: String) Promise~Boolean~
    }

    %% ── Student ──
    class Student {
        +UUID id
        +String uid «STD-...»
        +UUID userId FK
        +String cedula
        +String carrera
        +Integer semestre
        +String categoriaSisben
        +String archivoSisben
        +String cedulaFrontalPath?
        +String horarioPdfPath?
        +String reciboPagoPath?
        +String direccion?
        +String barrio
        +String telefono
        +Boolean trabaja
        +Boolean trabajaEstudia
        +Boolean estudiaSolo
        +String etnia
        +Boolean desplazado
        +Boolean trabajadorUniversitario
        +String[] diasComedor
        +String qrCode?
        +String qrCodeSecret?
        +Boolean isValidatedSisben
        +Boolean sisbenAutoValidated
        +JSON sisbenValidationDetails?
        +String currentCycle
        +Date cycleRevalidationDueAt?
        +Date cycleDisabledAt?
        +Date createdAt
        +Date updatedAt
    }

    %% ── Cycle ──
    class Cycle {
        +UUID id
        +String uid «CYC-...»
        +String name
        +Date startDate
        +Date endDate
        +String status
        +Date createdAt
        +Date updatedAt
    }

    %% ── Payment ──
    class Payment {
        +UUID id
        +String uid «PAY-...»
        +UUID studentId FK
        +Integer amount
        +Integer mealsIncluded
        +Integer mealsUsed
        +String comprobantePath
        +String universityReceiptPath?
        +String bankReceiptPath?
        +Boolean isVerified
        +UUID verifiedBy?
        +Date verifiedAt?
        +Date createdAt
        +Date updatedAt
    }

    %% ── MealAttendance ──
    class MealAttendance {
        +UUID id
        +String uid «MLA-...»
        +UUID studentId FK
        +UUID supervisorId FK
        +Date date
        +String hora
        +Date createdAt
        +Date updatedAt
    }

    %% ── SupervisorAssignment ──
    class SupervisorAssignment {
        +UUID id
        +String uid «SPA-...»
        +UUID supervisorId FK
        +UUID studentId FK
        +Date createdAt
        +Date updatedAt
    }

    %% ── SupervisorLog ──
    class SupervisorLog {
        +UUID id
        +String uid «SPL-...»
        +UUID supervisorId FK
        +UUID studentId FK
        +String action
        +String hora
        +Date createdAt
        +Date updatedAt
    }

    %% ── Rating ──
    class Rating {
        +UUID id
        +String uid «RTG-...»
        +UUID studentId FK
        +Integer stars
        +String comment?
        +Date createdAt
        +Date updatedAt
    }

    %% ── Complaint ──
    class Complaint {
        +UUID id
        +String uid «CMP-...»
        +UUID studentId? FK
        +ComplaintType type
        +String content
        +Boolean isAnonymous
        +String response?
        +UUID respondedBy?
        +Boolean isResolved
        +Date createdAt
        +Date updatedAt
    }

    %% ── News ──
    class News {
        +UUID id
        +String uid «NWS-...»
        +String title
        +String content
        +String imageUrl?
        +Boolean isActive
        +Date createdAt
        +Date updatedAt
    }

    %% ── AuditLog ──
    class AuditLog {
        +UUID id
        +String uid «AUD-...»
        +UUID userId
        +String userEmail
        +String action
        +String details?
        +String ipAddress?
        +Date createdAt
        +Date updatedAt
    }

    %% ── Services ──
    class EmailService {
        +transport: Transporter
        --
        +sendEmail(to, subject, html) Promise~void~
        +sendMealConfirmation(user, student, date) Promise~void~
        +sendPasswordResetEmail(user, token) Promise~void~
        +sendWelcomeEmail(user) Promise~void~
        +sendRevalidationEmail(user, student) Promise~void~
    }

    class AuditService {
        --
        +logAction(userId, userEmail, action, details?, req?) Promise~void~
        +logSystemAction(action, details?, req?, userId?, userEmail?) Promise~void~
    }

    class SisbenValidationService {
        --
        +validateSisbenAgainstCedula(sisbenPath, cedulaPath, userData) Promise~ValidationResult~
        +extractSisbenText(filePath) Promise~String~
    }

    class CycleAutomationService {
        +schedule: CronJob
        --
        (ejecuta diariamente a las 01:00)
        +closeExpiredCycles() Promise~void~
        +disableExpiredStudents() Promise~void~
        +sendRevalidationEmails() Promise~void~
    }

    class BackupService {
        +schedule: CronJob
        --
        (ejecuta diariamente a las 02:00)
        +performBackup() Promise~void~
        +pruneOldBackups() Promise~void~
    }

    %% ── Controllers ──
    class AuthController {
        --
        +login(req, res)
        +register(req, res)
        +refreshToken(req, res)
        +getProfile(req, res)
        +updateProfile(req, res)
        +forgotPassword(req, res)
        +resetPassword(req, res)
        +changePassword(req, res)
        +setupTwoFactor(req, res)
        +verifyTwoFactor(req, res)
    }

    class StudentsController {
        --
        +getStudents(req, res)
        +getStudentById(req, res)
        +createStudent(req, res)
        +updateStudent(req, res)
        +deleteStudent(req, res)
        +importStudentsFromExcel(req, res)
        +searchStudents(req, res)
        +validateSisben(req, res)
        +getAvailableMeals(req, res)
        +updateStudentCycle(req, res)
    }

    class CycleController {
        --
        +createCycle(req, res)
        +getCycles(req, res)
        +getCycleById(req, res)
        +closeCycle(req, res)
    }

    class MealsController {
        --
        +registerMeal(req, res)
        +getMealHistory(req, res)
        +getTodayAttendance(req, res)
        +getDashboardAnalytics(req, res)
    }

    class PaymentsController {
        --
        +createPayment(req, res)
        +verifyPayment(req, res)
        +getPayments(req, res)
        +uploadPaymentComprobante(req, res)
        +calculateMeals(req, res)
    }

    class SupervisorsController {
        --
        +getSupervisors(req, res)
        +createSupervisor(req, res)
        +updateSupervisor(req, res)
        +deleteSupervisor(req, res)
        +toggleSupervisorStatus(req, res)
        +generateInviteLink(req, res)
        +joinSupervisor(req, res)
        +assignStudent(req, res)
        +removeStudent(req, res)
        +getSupervisorStudents(req, res)
        +getSupervisorLogs(req, res)
    }

    class NewsController {
        --
        +getNews(req, res)
        +getNewsById(req, res)
        +createNews(req, res)
        +updateNews(req, res)
        +deleteNews(req, res)
    }

    class ComplaintsController {
        --
        +createComplaint(req, res)
        +getComplaints(req, res)
        +respondComplaint(req, res)
    }

    class RatingsController {
        --
        +createRating(req, res)
        +getRatings(req, res)
        +getAverageRating(req, res)
    }

    %% ── Middleware ──
    class AuthMiddleware {
        --
        +authenticate(req, res, next)
        +authorize(...roles)
        +optionalAuth(req, res, next)
    }
    class UploadMiddleware {
        --
        multer instance (PDF/JPEG/PNG, 10 MB)
    }
    class EventAuditMiddleware {
        --
        +auditHttpEvents(req, res, next)
    }

    %% ═══════════════════════════════════════════
    %% RELACIONES
    %% ═══════════════════════════════════════════

    User "1" --> "0..1" Student : hasOne ▶
    Student "0..*" --> "1" User : belongsTo

    User "1" --> "0..*" MealAttendance : hasMany (supervisor)
    MealAttendance "0..*" --> "1" User : belongsTo (supervisor)

    User "1" --> "0..*" SupervisorAssignment : hasMany (assignments)
    SupervisorAssignment "0..*" --> "1" User : belongsTo (supervisor)

    User "1" --> "0..*" SupervisorLog : (supervisor)
    SupervisorLog "0..*" --> "1" User : belongsTo

    Student "1" --> "0..*" Payment : hasMany (payments)
    Payment "0..*" --> "1" Student : belongsTo

    Student "1" --> "0..*" MealAttendance : hasMany (attendances)
    MealAttendance "0..*" --> "1" Student : belongsTo

    Student "1" --> "0..*" Rating : hasMany (ratings)
    Rating "0..*" --> "1" Student : belongsTo

    Student "1" --> "0..*" Complaint : hasMany (complaints)
    Complaint "0..*" --> "0..1" Student : belongsTo

    Student "1" --> "0..*" SupervisorAssignment : hasMany
    SupervisorAssignment "0..*" --> "1" Student : belongsTo

    Student "1" --> "0..*" SupervisorLog : (student)
    SupervisorLog "0..*" --> "1" Student : belongsTo

    Student "0..*" --> "0..1" Cycle : currentCycle (name FK)

    Payment "0..*" --> "0..1" User : verifiedBy (FK)

    %% Dependencias entre capas
    AuthController ..> User : usa
    AuthController ..> Student : usa
    AuthController ..> AuditService : usa
    AuthController ..> SisbenValidationService : usa
    AuthController ..> EmailService : usa

    StudentsController ..> User : usa
    StudentsController ..> Student : usa
    StudentsController ..> Payment : usa
    StudentsController ..> AuditService : usa
    StudentsController ..> SisbenValidationService : usa

    MealsController ..> Student : usa
    MealsController ..> User : usa
    MealsController ..> Payment : usa
    MealsController ..> MealAttendance : usa
    MealsController ..> SupervisorLog : usa
    MealsController ..> EmailService : usa
    MealsController ..> AuditService : usa

    PaymentsController ..> Payment : usa
    PaymentsController ..> Student : usa
    PaymentsController ..> User : usa
    PaymentsController ..> AuditService : usa

    SupervisorsController ..> User : usa
    SupervisorsController ..> Student : usa
    SupervisorsController ..> SupervisorLog : usa
    SupervisorsController ..> SupervisorAssignment : usa
    SupervisorsController ..> AuditService : usa

    CycleController ..> Cycle : usa
    CycleController ..> Student : usa
    CycleController ..> User : usa

    NewsController ..> News : usa
    ComplaintsController ..> Complaint : usa
    ComplaintsController ..> Student : usa
    RatingsController ..> Rating : usa

    EventAuditMiddleware ..> AuditService : usa
    CycleAutomationService ..> Cycle : usa
    CycleAutomationService ..> Student : usa
    CycleAutomationService ..> User : usa
    CycleAutomationService ..> EmailService : usa

    AuditService ..> AuditLog : escribe
```

## Resumen de Relaciones

| Origen | Relación | Destino | FK |
|--------|----------|---------|-----|
| User | 1 ── 0..1 | Student | `userId` |
| Student | 1 ── 0..* | Payment | `studentId` |
| Student | 1 ── 0..* | MealAttendance | `studentId` |
| Student | 1 ── 0..* | Rating | `studentId` |
| Student | 1 ── 0..* | Complaint | `studentId` (nullable) |
| Student | 1 ── 0..* | SupervisorAssignment | `studentId` |
| Student | 1 ── 0..* | SupervisorLog | `studentId` |
| Student | * ── 0..1 | Cycle | `currentCycle` → `cycles.name` |
| User (supervisor) | 1 ── 0..* | MealAttendance | `supervisorId` |
| User (supervisor) | 1 ── 0..* | SupervisorAssignment | `supervisorId` |
| User (supervisor) | 1 ── 0..* | SupervisorLog | `supervisorId` |
| User (admin) | 1 ── 0..* | Payment | `verifiedBy` (nullable) |
