import { sequelize } from './config/database';
import {
  User,
  UserRole,
  Student,
  Payment,
  MealAttendance,
  SupervisorLog,
  Rating,
  Complaint,
  ComplaintType,
  News,
  SupervisorAssignment,
  Cycle
} from './models';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Base de datos sincronizada (force).');

  const adminPassword = 'admin123';
  const supervisorPassword = 'supervisor123';
  const studentPassword = 'estudiante123';
  const auditorPassword = 'auditor123';

  const admin = await User.create({
    email: 'admin@smartcomedor.edu',
    password: adminPassword,
    name: 'Administrador',
    lastName: 'Principal',
    role: UserRole.ADMIN,
    isActive: true,
    isAuthorized: true,
  });

  const supervisor = await User.create({
    email: 'supervisor@smartcomedor.edu',
    password: supervisorPassword,
    name: 'Juan',
    lastName: 'Supervisor',
    role: UserRole.SUPERVISOR,
    isActive: true,
    isAuthorized: true,
  });

  const supervisor2 = await User.create({
    email: 'sup2@smartcomedor.edu',
    password: supervisorPassword,
    name: 'Ana',
    lastName: 'Ríos Mendoza',
    role: UserRole.SUPERVISOR,
    isActive: true,
    isAuthorized: true,
  });

  await User.create({
    email: 'auditor@smartcomedor.edu',
    password: auditorPassword,
    name: 'Elena',
    lastName: 'Auditoría',
    role: UserRole.EXTERNAL_AUDITOR,
    isActive: true,
    isAuthorized: true,
  });

  const mainStudentUser = await User.create({
    email: 'estudiante@smartcomedor.edu',
    password: studentPassword,
    name: 'Carlos',
    lastName: 'Estudiante',
    role: UserRole.STUDENT,
    isActive: true,
    isAuthorized: true,
  });

  const extraStudentDefs = [
    { email: 's01@smartcomedor.edu', name: 'María', lastName: 'García López', cedula: '10000101', carrera: 'Ing. Sistemas', sem: 5, sis: 'A1', barrio: 'La Candelaria' },
    { email: 's02@smartcomedor.edu', name: 'Luis', lastName: 'Martínez Ruiz', cedula: '10000102', carrera: 'Medicina', sem: 3, sis: 'B2', barrio: 'Chapinero' },
    { email: 's03@smartcomedor.edu', name: 'Laura', lastName: 'Fernández', cedula: '10000103', carrera: 'Derecho', sem: 7, sis: 'A2', barrio: 'Teusaquillo' },
    { email: 's04@smartcomedor.edu', name: 'Diego', lastName: 'Torres', cedula: '10000104', carrera: 'Contaduría', sem: 4, sis: 'B1', barrio: 'Kennedy' },
    { email: 's05@smartcomedor.edu', name: 'Valentina', lastName: 'Soto Díaz', cedula: '10000105', carrera: 'Psicología', sem: 6, sis: 'C1', barrio: 'Suba' },
    { email: 's06@smartcomedor.edu', name: 'Andrés', lastName: 'Mejía', cedula: '10000106', carrera: 'Arquitectura', sem: 8, sis: 'A1', barrio: 'Usaquén' },
    { email: 's07@smartcomedor.edu', name: 'Camila', lastName: 'Rojas Vega', cedula: '10000107', carrera: 'Trabajo Social', sem: 2, sis: 'B3', barrio: 'Bosa' },
    { email: 's08@smartcomedor.edu', name: 'Santiago', lastName: 'Luna', cedula: '10000108', carrera: 'Economía', sem: 5, sis: 'A2', barrio: 'Engativá' },
  ] as const;

  const currentCycle = await Cycle.create({
    name: '2026-1',
    startDate: new Date('2026-01-15'),
    endDate: new Date('2026-06-30'),
    status: 'Activo' as const,
  });

  const students: Student[] = [];

  const mainStudent = await Student.create({
    userId: mainStudentUser.id,
    cedula: '12345678',
    carrera: 'Ingeniería de Sistemas',
    semestre: 5,
    categoriaSisben: 'A1',
    archivoSisben: '',
    direccion: 'Calle 123',
    barrio: 'Centro',
    telefono: '3001234567',
    trabaja: false,
    etnia: 'Ninguna',
    desplazado: false,
    trabajadorUniversitario: false,
    diasComedor: DIAS,
    isValidatedSisben: true,
  });
  students.push(mainStudent);

  for (const def of extraStudentDefs) {
    const u = await User.create({
      email: def.email,
      password: studentPassword,
      name: def.name,
      lastName: def.lastName,
      role: UserRole.STUDENT,
      isActive: true,
      isAuthorized: true,
    });
    const st = await Student.create({
      userId: u.id,
      cedula: def.cedula,
      carrera: def.carrera,
      semestre: def.sem,
      categoriaSisben: def.sis,
      archivoSisben: '',
      direccion: `Carrera ${def.cedula.slice(-2)} # 10-20`,
      barrio: def.barrio,
      telefono: `300${def.cedula.slice(-7)}`,
      trabaja: def.sem % 2 === 0,
      etnia: 'Mestizo',
      desplazado: false,
      trabajadorUniversitario: false,
      diasComedor: DIAS,
      isValidatedSisben: def.sem % 3 !== 0,
    });
    students.push(st);
  }

  const assign = async (supervisorId: string, student: Student) => {
    await SupervisorAssignment.create({ supervisorId, studentId: student.id });
  };

  for (const st of students.slice(0, 6)) {
    await assign(supervisor.id, st);
  }
  for (const st of students.slice(3)) {
    await assign(supervisor2.id, st);
  }

  const syntheticPayments: Array<{
    studentId: string;
    amount: number;
    mealsIncluded: number;
    mealsUsed: number;
    isVerified: boolean;
    createdAt: Date;
  }> = [];

  students.forEach((st, studentIndex) => {
    const paymentsPerStudent = randomInt(2, 4);
    for (let paymentIndex = 0; paymentIndex < paymentsPerStudent; paymentIndex++) {
      const amount = pickOne([4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000]);
      const mealsIncluded = Math.floor(amount / 2000);
      const mealsUsed = randomInt(Math.floor(mealsIncluded * 0.2), mealsIncluded);
      const isVerified = Math.random() > 0.12;
      syntheticPayments.push({
        studentId: st.id,
        amount,
        mealsIncluded,
        mealsUsed: isVerified ? mealsUsed : 0,
        isVerified,
        createdAt: new Date(`${daysAgoIso(randomInt(5, 120))}T09:00:00`),
      });
      if (studentIndex < 4 && paymentIndex === 0) {
        syntheticPayments.push({
          studentId: st.id,
          amount: 20000,
          mealsIncluded: 10,
          mealsUsed: randomInt(6, 10),
          isVerified: true,
          createdAt: new Date(`${daysAgoIso(randomInt(1, 30))}T10:00:00`),
        });
      }
    }
  });

  for (let i = 0; i < syntheticPayments.length; i++) {
    const payment = syntheticPayments[i]!;
    await Payment.create({
      studentId: payment.studentId,
      amount: payment.amount,
      mealsIncluded: payment.mealsIncluded,
      mealsUsed: payment.mealsUsed,
      comprobantePath: `seed/comprobante-${i + 1}.pdf`,
      isVerified: payment.isVerified,
      verifiedBy: payment.isVerified ? admin.id : undefined,
      verifiedAt: payment.isVerified ? payment.createdAt : undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.createdAt,
    });
  }

  const attendanceByStudent = new Map<string, Set<string>>();
  for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
    const dateStr = daysAgoIso(dayOffset);
    const currentDate = new Date(`${dateStr}T12:00:00`);
    const weekDay = currentDate.getDay();
    if (weekDay === 0 || weekDay === 6) {
      continue;
    }

    const expectedMeals = randomInt(3, Math.max(6, Math.floor(students.length * 0.8)));
    for (let i = 0; i < expectedMeals; i++) {
      const st = students[randomInt(0, students.length - 1)]!;
      const usedDates = attendanceByStudent.get(st.id) ?? new Set<string>();
      if (usedDates.has(dateStr)) {
        continue;
      }
      usedDates.add(dateStr);
      attendanceByStudent.set(st.id, usedDates);

      const sup = Math.random() > 0.45 ? supervisor : supervisor2;
      const minute = randomInt(0, 59).toString().padStart(2, '0');
      const hour = randomInt(11, 14).toString().padStart(2, '0');
      const hora = `${hour}:${minute}`;

      await MealAttendance.create({
        studentId: st.id,
        supervisorId: sup.id,
        date: currentDate,
        hora,
        createdAt: new Date(`${dateStr}T${hora}:00`),
        updatedAt: new Date(`${dateStr}T${hora}:00`),
      });
      await SupervisorLog.create({
        supervisorId: sup.id,
        studentId: st.id,
        action: 'Registro de almuerzo',
        hora,
        createdAt: new Date(`${dateStr}T${hora}:00`),
        updatedAt: new Date(`${dateStr}T${hora}:00`),
      });
    }
  }

  const ratingComments = [
    'Excelente servicio y variedad.',
    'Buen menú, colas un poco largas.',
    'Muy limpio el salón.',
    'Aceptable, más opciones vegetarianas.',
    'Mejoró mucho la atención en caja.',
    'La porción fue adecuada y el menú balanceado.',
    'Podría mejorar la temperatura de la comida.',
  ];

  for (let i = 0; i < 80; i++) {
    const st = students[randomInt(0, students.length - 1)]!;
    const weightedStars = pickOne([5, 5, 4, 4, 4, 3, 3, 2]);
    await Rating.create({
      studentId: st.id,
      stars: weightedStars,
      comment: Math.random() > 0.35 ? pickOne(ratingComments) : undefined,
      createdAt: new Date(`${daysAgoIso(randomInt(0, 90))}T15:00:00`),
      updatedAt: new Date(`${daysAgoIso(randomInt(0, 90))}T15:00:00`),
    });
  }

  await News.create({
    title: 'Horario especial en semana de parciales',
    content:
      'Durante la próxima semana el comedor ampliará el horario de almuerzo de 11:30 a 14:30. ' +
      'Se recomienda reservar turno desde la app.',
    isActive: true,
  });
  await News.create({
    title: 'Menú saludable: nuevo plato vegetariano',
    content: 'Incorporamos opción vegetariana diaria elaborada con productos de la región. Consulta el menú en recepción.',
    isActive: true,
  });
  await News.create({
    title: 'Cierre por mantenimiento — sábado',
    content: 'El sábado indicado el comedor permanecerá cerrado por mantenimiento de cocina. Disculpen las molestias.',
    isActive: false,
  });

  await Complaint.create({
    studentId: students[1]!.id,
    type: ComplaintType.SUGERENCIA,
    content: 'Sería útil mostrar el menú semanal en la pantalla de entrada.',
    isAnonymous: false,
    isResolved: true,
    response: 'Gracias. Lo implementaremos el próximo mes.',
    respondedBy: admin.id,
  });
  await Complaint.create({
    studentId: students[4]!.id,
    type: ComplaintType.QUEJA,
    content: 'Un día el acompañamiento llegó frío.',
    isAnonymous: false,
    isResolved: false,
  });
  await Complaint.create({
    type: ComplaintType.COMENTARIO,
    content: 'Felicitaciones al personal de cocina.',
    isAnonymous: true,
    isResolved: false,
  });

  console.log('\n--- Usuarios principales (misma contraseña de siempre) ---');
  console.log('Admin:       admin@smartcomedor.edu / admin123');
  console.log('Supervisor:  supervisor@smartcomedor.edu / supervisor123');
  console.log('Supervisor2: sup2@smartcomedor.edu / supervisor123');
  console.log('Auditor:     auditor@smartcomedor.edu / auditor123');
  console.log('Estudiante:  estudiante@smartcomedor.edu / estudiante123');
  console.log('\n--- Más estudiantes (todos: estudiante123) ---');
  for (const def of extraStudentDefs) {
    console.log(`  ${def.email}`);
  }
  console.log('\nDatos ficticios: asignaciones, pagos, asistencias, noticias, valoraciones y quejas.');
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exit(1);
  });
