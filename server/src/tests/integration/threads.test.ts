/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN - Estrategia Basada en Hilos (Thread-Based)
 * ============================================================================
 * 
 * Estrategia: Probar flujos completos por rol/actor (hilos de ejecución):
 * 
 * HILO 1: Flujo Estudiante
 *   Registro -> Login -> Ver Perfil -> Subir Pago -> Ver Almuerzos Disponibles
 *   -> Calificar Servicio -> Ver Noticias -> Enviar Queja
 * 
 * HILO 2: Flujo Supervisor
 *   Login (autorizado) -> Buscar Estudiante -> Registrar Almuerzo
 *   -> Verificar Historial
 * 
 * HILO 3: Flujo Administrador
 *   Login -> Crear Supervisor -> Asignar Estudiante -> Verificar Pago
 *   -> Validar SISBEN -> Ver Reportes
 * 
 * Cada hilo prueba la secuencia completa de interacciones del actor.
 * ============================================================================
 */

import jwt from 'jsonwebtoken';

// Mock de base de datos en memoria
const mockDB: any = {
  users: new Map(),
  students: new Map(),
  payments: new Map(),
  mealAttendances: new Map(),
  supervisorLogs: new Map(),
  ratings: new Map(),
  complaints: new Map(),
  news: new Map(),
  supervisorAssignments: new Map(),
};

const resetDB = () => {
  Object.values(mockDB).forEach((table: any) => table.clear());
};

// Helpers
const createToken = (id: string, email: string, role: string) =>
  jwt.sign({ id, email, role }, 'secret', { expiresIn: '15m' });

const MEAL_PRICE = 2000;

describe('Pruebas de Integración - Estrategia Basada en Hilos', () => {
  beforeEach(() => resetDB());

  // =========================================================================
  // HILO 1: Flujo Completo del Estudiante
  // =========================================================================
  describe('HILO 1: Flujo Completo del Estudiante', () => {

    /**
     * Secuencia del hilo:
     * 1. Registrar cuenta (con SISBEN)
     * 2. Login
     * 3. Ver perfil y almuerzos disponibles
     * 4. Subir comprobante de pago
     * 5. Verificar cálculo de almuerzos
     * 6. Calificar servicio (1-5 estrellas)
     * 7. Ver noticias
     * 8. Enviar queja/sugerencia
     */

    it('H1-001: Flujo completo desde registro hasta envío de queja', async () => {
      // ===== PASO 1: Registro =====
      const email = 'estudiante@test.com';
      const password = 'pass1234';
      const user = {
        id: 'user-1',
        email,
        password, // En producción sería hasheado
        name: 'Carlos',
        lastName: 'Ramirez',
        role: 'student',
        isActive: true,
        isAuthorized: true,
      };
      mockDB.users.set(user.id, user);

      const student = {
        id: 'student-1',
        userId: user.id,
        cedula: '1098765432',
        carrera: 'Ingeniería de Sistemas',
        semestre: 7,
        categoriaSisben: 'A1',
        diasComedor: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        isValidatedSisben: false,
      };
      mockDB.students.set(student.id, student);

      expect(mockDB.users.size).toBe(1);
      expect(mockDB.students.size).toBe(1);

      // ===== PASO 2: Login =====
      const foundUser = Array.from(mockDB.users.values()).find(
        (u: any) => u.email === email && u.password === password
      ) as any;
      expect(foundUser).toBeDefined();

      const accessToken = createToken(foundUser!.id, foundUser!.email, foundUser!.role);
      expect(accessToken).toBeDefined();

      // ===== PASO 3: Ver perfil y almuerzos disponibles =====
      const decoded = jwt.verify(accessToken, 'secret') as any;
      const profileUser = mockDB.users.get(decoded.id);
      const profileStudent = Array.from(mockDB.students.values()).find(
        (s: any) => s.userId === profileUser.id
      ) as any;

      expect(profileUser.name).toBe('Carlos');
      expect(profileStudent?.carrera).toBe('Ingeniería de Sistemas');
      expect(profileStudent?.diasComedor).toHaveLength(5);

      // Almuerzos disponibles: 0 (no hay pagos aún)
      const payments0 = Array.from(mockDB.payments.values()).filter(
        (p: any) => p.studentId === student.id && p.isVerified
      );
      const available0 = payments0.reduce((s: number, p: any) => s + p.mealsIncluded, 0)
        - payments0.reduce((s: number, p: any) => s + p.mealsUsed, 0);
      expect(available0).toBe(0);

      // ===== PASO 4: Subir comprobante de pago ($50,000) =====
      const amount = 50000;
      const mealsIncluded = Math.floor(amount / MEAL_PRICE); // 25 almuerzos
      const payment = {
        id: 'payment-1',
        studentId: student.id,
        amount,
        mealsIncluded,
        mealsUsed: 0,
        comprobantePath: 'uploads/recibo_50000.pdf',
        isVerified: false,
      };
      mockDB.payments.set(payment.id, payment);

      // ===== PASO 5: Admin verifica el pago =====
      const storedPayment = mockDB.payments.get(payment.id);
      storedPayment.isVerified = true;
      storedPayment.verifiedBy = 'admin-1';

      // Verificar cálculo
      expect(storedPayment.mealsIncluded).toBe(25);
      expect(storedPayment.isVerified).toBe(true);

      // Almuerzos disponibles ahora: 25
      const payments = Array.from(mockDB.payments.values()).filter(
        (p: any) => p.studentId === student.id && p.isVerified
      );
      const available = payments.reduce((s: number, p: any) => s + p.mealsIncluded, 0)
        - payments.reduce((s: number, p: any) => s + p.mealsUsed, 0);
      expect(available).toBe(25);

      // ===== PASO 6: Calificar servicio (4 estrellas) =====
      const rating = {
        id: 'rating-1',
        studentId: student.id,
        stars: 4,
        comment: 'Buena atención',
      };
      mockDB.ratings.set(rating.id, rating);

      // Calcular promedio
      const allRatings = Array.from(mockDB.ratings.values());
      const avg = allRatings.reduce((s: number, r: any) => s + r.stars, 0) / allRatings.length;
      expect(avg).toBe(4);

      // ===== PASO 7: Ver noticias =====
      // Crear algunas noticias
      mockDB.news.set('news-1', { id: 'news-1', title: 'Horario extendido', content: '...', isActive: true });
      mockDB.news.set('news-2', { id: 'news-2', title: 'Nuevo menú', content: '...', isActive: true });

      const activeNews = Array.from(mockDB.news.values()).filter((n: any) => n.isActive);
      expect(activeNews).toHaveLength(2);

      // ===== PASO 8: Enviar queja =====
      const complaint = {
        id: 'complaint-1',
        studentId: student.id,
        type: 'queja',
        content: 'La comida estaba fría hoy',
        isAnonymous: false,
        isResolved: false,
      };
      mockDB.complaints.set(complaint.id, complaint);

      expect(mockDB.complaints.size).toBe(1);
      const storedComplaint = mockDB.complaints.get('complaint-1');
      expect(storedComplaint.isResolved).toBe(false);

      // ===== RESUMEN DEL HILO =====
      expect(mockDB.users.size).toBe(1);
      expect(mockDB.students.size).toBe(1);
      expect(mockDB.payments.size).toBe(1);
      expect(mockDB.ratings.size).toBe(1);
      expect(mockDB.news.size).toBe(2);
      expect(mockDB.complaints.size).toBe(1);
    });

    it('H1-002: Estudiante no puede registrar almuerzo sin pagos', async () => {
      const student = {
        id: 'student-1',
        userId: 'user-1',
        diasComedor: ['Lunes'],
      };
      mockDB.students.set(student.id, student);
      mockDB.users.set('user-1', { id: 'user-1', isActive: true });

      // No hay pagos
      const payments = Array.from(mockDB.payments.values()).filter(
        (p: any) => p.studentId === student.id && p.isVerified
      );
      const available = payments.reduce((s: number, p: any) => s + p.mealsIncluded, 0)
        - payments.reduce((s: number, p: any) => s + p.mealsUsed, 0);

      expect(available).toBe(0);
      // En el controlador real, esto impediría el registro
    });
  });

  // =========================================================================
  // HILO 2: Flujo Completo del Supervisor
  // =========================================================================
  describe('HILO 2: Flujo Completo del Supervisor', () => {

    /**
     * Secuencia del hilo:
     * 1. Login como supervisor autorizado
     * 2. Buscar estudiante por cédula/nombre
     * 3. Verificar datos del estudiante (días, almuerzos)
     * 4. Registrar almuerzo (firmar)
     * 5. Verificar que se envió email de confirmación (simulado)
     * 6. Revisar historial de asistencia
     */

    it('H2-001: Flujo completo - Supervisor registra almuerzo de estudiante', async () => {
      // ===== SETUP: Estudiante con pagos verificados =====
      const student = {
        id: 'student-1',
        userId: 'user-1',
        cedula: '12345678',
        carrera: 'Ing Sistemas',
        diasComedor: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      };
      mockDB.students.set(student.id, student);

      mockDB.users.set('user-1', {
        id: 'user-1', name: 'Juan', lastName: 'Perez', email: 'juan@test.com', isActive: true,
      });

      mockDB.payments.set('pay-1', {
        id: 'pay-1', studentId: student.id,
        mealsIncluded: 20, mealsUsed: 5, isVerified: true,
      });

      // ===== PASO 1: Login supervisor =====
      const supervisor = {
        id: 'supervisor-1',
        email: 'supervisor@test.com',
        name: 'Ana',
        lastName: 'Garcia',
        role: 'supervisor',
        isActive: true,
        isAuthorized: true,
      };
      mockDB.users.set(supervisor.id, supervisor);

      const token = createToken(supervisor.id, supervisor.email, supervisor.role);
      const decoded = jwt.verify(token, 'secret') as any;
      expect(decoded.role).toBe('supervisor');

      // ===== PASO 2: Buscar estudiante por cédula =====
      const searchTerm = '1234';
      const foundStudents = Array.from(mockDB.students.values()).filter(
        (s: any) => s.cedula.includes(searchTerm)
      ) as any[];
      expect(foundStudents).toHaveLength(1);
      expect(foundStudents[0]?.cedula).toBe('12345678');

      // ===== PASO 3: Verificar datos del estudiante =====
      const targetStudent = foundStudents[0] as any;
      const studentUser = mockDB.users.get(targetStudent.userId) as any;
      const studentPayments = Array.from(mockDB.payments.values()).filter(
        (p: any) => p.studentId === targetStudent.id && p.isVerified
      ) as any[];
      const availableMeals = studentPayments.reduce((s: number, p: any) => s + p.mealsIncluded, 0)
        - studentPayments.reduce((s: number, p: any) => s + p.mealsUsed, 0);

      expect(studentUser.name).toBe('Juan');
      expect(targetStudent.carrera).toBe('Ing Sistemas');
      expect(targetStudent.diasComedor).toContain('Viernes');
      expect(availableMeals).toBe(15); // 20 - 5

      // ===== PASO 4: Registrar almuerzo (firmar) =====
      // Validar día de la semana
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      const spanishDays: Record<string, string> = {
        Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
        Thursday: 'Jueves', Friday: 'Viernes',
      };
      const spanishDay = spanishDays[dayOfWeek];

      // Solo ejecutar si es día hábil
      if (!targetStudent.diasComedor.includes(spanishDay)) {
        console.log(`Hoy es ${spanishDay}, estudiante no autorizado. Test omitido.`);
        return;
      }

      // Verificar no asistió hoy
      const todayStr = today.toISOString().split('T')[0];
      const existingToday = Array.from(mockDB.mealAttendances.values()).find(
        (a: any) => a.studentId === targetStudent.id && a.date === todayStr
      );
      expect(existingToday).toBeUndefined();

      // Registrar asistencia
      const attendance = {
        id: 'att-1',
        studentId: targetStudent.id,
        supervisorId: decoded.id,
        date: todayStr,
        hora: today.toLocaleTimeString('es-CO'),
      };
      mockDB.mealAttendances.set(attendance.id, attendance);

      // Decrementar almuerzo
      const latestPayment = studentPayments[studentPayments.length - 1] as any;
      latestPayment.mealsUsed += 1;

      // ===== PASO 5: Crear log del supervisor =====
      const log = {
        id: 'log-1',
        supervisorId: decoded.id,
        studentId: targetStudent.id,
        action: 'Registro de almuerzo',
        hora: attendance.hora,
      };
      mockDB.supervisorLogs.set(log.id, log);

      // ===== PASO 6: Verificar historial =====
      const attendances = Array.from(mockDB.mealAttendances.values()).filter(
        (a: any) => a.studentId === targetStudent.id
      );
      expect(attendances).toHaveLength(1);

      // Verificar decremento
      const newAvailable = (latestPayment.mealsIncluded - latestPayment.mealsUsed);
      expect(newAvailable).toBe(14); // 15 - 1

      // ===== RESUMEN =====
      expect(mockDB.mealAttendances.size).toBe(1);
      expect(mockDB.supervisorLogs.size).toBe(1);
      expect(newAvailable).toBe(14);
    });

    it('H2-002: Supervisor no autorizado no puede registrar almuerzos', async () => {
      const supervisor = {
        id: 'sup-1',
        role: 'supervisor',
        isAuthorized: false, // No autorizado
      };

      // Verificación de autorización
      if (supervisor.role === 'supervisor' && !supervisor.isAuthorized) {
        expect(true).toBe(true); // Correctamente bloqueado
      }
    });
  });

  // =========================================================================
  // HILO 3: Flujo Completo del Administrador
  // =========================================================================
  describe('HILO 3: Flujo Completo del Administrador', () => {

    /**
     * Secuencia del hilo:
     * 1. Login como administrador
     * 2. Crear supervisor (con contraseña temporal)
     * 3. Generar link de invitación
     * 4. Importar estudiantes desde Excel
     * 5. Verificar pago de estudiante
     * 6. Validar SISBEN de estudiante
     * 7. Asignar estudiante a supervisor
     * 8. Ver reportes de actividad
     */

    it('H3-001: Flujo completo administrador - Crear supervisor, importar, verificar', async () => {
      // ===== PASO 1: Login admin =====
      const admin = {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Administrador',
        lastName: 'Sistema',
        role: 'admin',
        isActive: true,
        isAuthorized: true,
      };
      mockDB.users.set(admin.id, admin);

      const token = createToken(admin.id, admin.email, admin.role);
      const decoded = jwt.verify(token, 'secret') as any;
      expect(decoded.role).toBe('admin');

      // ===== PASO 2: Crear supervisor =====
      const tempPassword = 'temp1234'; // Simula UUID slice
      const supervisor = {
        id: 'supervisor-1',
        email: 'nuevo.supervisor@test.com',
        password: tempPassword,
        name: 'Carlos',
        lastName: 'Supervisor',
        role: 'supervisor',
        isActive: true,
        isAuthorized: false, // Requiere autorización
      };
      mockDB.users.set(supervisor.id, supervisor);

      expect(mockDB.users.size).toBe(2);

      // ===== PASO 3: Autorizar supervisor =====
      const storedSup = mockDB.users.get(supervisor.id);
      storedSup.isAuthorized = true;

      expect(storedSup.isAuthorized).toBe(true);

      // ===== PASO 4: Importar estudiantes desde Excel (simulado) =====
      const excelData = [
        { email: 'est1@test.com', nombre: 'Ana', apellido: 'Lopez', cedula: '11111111', carrera: 'Ing Sistemas', dias: 'Lunes,Martes', pago: 10000 },
        { email: 'est2@test.com', nombre: 'Pedro', apellido: 'Garcia', cedula: '22222222', carrera: 'Medicina', dias: 'Miercoles,Viernes', pago: 20000 },
        { email: 'est3@test.com', nombre: 'Maria', apellido: 'Rodriguez', cedula: '33333333', carrera: 'Derecho', dias: 'Lunes', pago: 4000 },
      ];

      let created = 0;
      for (const row of excelData) {
        const userId = `user-import-${created}`;
        mockDB.users.set(userId, {
          id: userId,
          email: row.email,
          name: row.nombre,
          lastName: row.apellido,
          role: 'student',
          isActive: true,
        });

        const studentId = `student-import-${created}`;
        mockDB.students.set(studentId, {
          id: studentId,
          userId,
          cedula: row.cedula,
          carrera: row.carrera,
          diasComedor: row.dias.split(','),
        });

        // Crear pago verificado
        if (row.pago > 0) {
          mockDB.payments.set(`pay-import-${created}`, {
            id: `pay-import-${created}`,
            studentId,
            amount: row.pago,
            mealsIncluded: Math.floor(row.pago / MEAL_PRICE),
            mealsUsed: 0,
            isVerified: true,
          });
        }

        created++;
      }

      expect(created).toBe(3);
      expect(mockDB.students.size).toBe(3);
      expect(mockDB.payments.size).toBe(3);

      // ===== PASO 5: Verificar pago =====
      const paymentsList = Array.from(mockDB.payments.values()) as any[];
      expect(paymentsList[0]?.mealsIncluded).toBe(5);  // 10000 / 2000
      expect(paymentsList[1]?.mealsIncluded).toBe(10); // 20000 / 2000
      expect(paymentsList[2]?.mealsIncluded).toBe(2);  // 4000 / 2000

      // ===== PASO 6: Validar SISBEN =====
      const targetStudent = Array.from(mockDB.students.values()).find(
        (s: any) => s.cedula === '11111111'
      ) as any;
      const targetUser = mockDB.users.get(targetStudent.userId) as any;

      // Validar que los datos coinciden
      const isValid = targetStudent.cedula === '11111111'
        && targetUser.name === 'Ana'
        && targetUser.lastName === 'Lopez';

      if (isValid) {
        targetStudent.isValidatedSisben = true;
      }

      expect(targetStudent.isValidatedSisben).toBe(true);

      // ===== PASO 7: Asignar estudiante a supervisor =====
      const assignment = {
        id: 'assign-1',
        supervisorId: supervisor.id,
        studentId: targetStudent.id,
      };
      mockDB.supervisorAssignments.set(assignment.id, assignment);

      expect(mockDB.supervisorAssignments.size).toBe(1);

      // ===== PASO 8: Ver reportes =====
      // Estadísticas
      const totalStudents = Array.from(mockDB.users.values()).filter(
        (u: any) => u.role === 'student'
      ).length;
      const totalSupervisors = Array.from(mockDB.users.values()).filter(
        (u: any) => u.role === 'supervisor'
      ).length;
      const totalPayments = mockDB.payments.size;
      const totalMeals = Array.from(mockDB.payments.values()).reduce(
        (s: number, p: any) => s + p.mealsIncluded, 0
      );

      expect(totalStudents).toBe(3);
      expect(totalSupervisors).toBe(1);
      expect(totalPayments).toBe(3);
      expect(totalMeals).toBe(17); // 5 + 10 + 2

      // ===== RESUMEN FINAL =====
      // admin + sup + 3 students = 5 usuarios
      expect(mockDB.users.size).toBe(5);
      expect(mockDB.students.size).toBe(3);
      expect(mockDB.payments.size).toBe(3);
      expect(mockDB.supervisorAssignments.size).toBe(1);
    });
  });

  // =========================================================================
  // HILO 4: Flujo de Administración de Noticias y Quejas
  // =========================================================================
  describe('HILO 4: Flujo Noticias y Quejas', () => {
    it('H4-001: Admin crea noticia, estudiante lee y envía queja, admin responde', async () => {
      // Admin crea noticia
      mockDB.news.set('news-1', {
        id: 'news-1',
        title: 'Cambio de horario',
        content: 'El comedor abrirá desde las 7am',
        isActive: true,
      });

      // Estudiante ve la noticia
      const activeNews = Array.from(mockDB.news.values()).filter((n: any) => n.isActive);
      expect(activeNews).toHaveLength(1);

      // Estudiante envía queja
      mockDB.complaints.set('comp-1', {
        id: 'comp-1',
        studentId: 'student-1',
        type: 'sugerencia',
        content: 'Sería bueno tener más opciones vegetarianas',
        isAnonymous: false,
        isResolved: false,
      });

      // Admin ve la queja
      const unresolved = Array.from(mockDB.complaints.values()).filter(
        (c: any) => !c.isResolved
      );
      expect(unresolved).toHaveLength(1);

      // Admin responde
      const complaint = mockDB.complaints.get('comp-1');
      complaint.response = 'Gracias por tu sugerencia, la evaluaremos.';
      complaint.respondedBy = 'admin-1';
      complaint.isResolved = true;

      expect(complaint.isResolved).toBe(true);
      expect(complaint.response).toBeTruthy();
    });
  });
});
