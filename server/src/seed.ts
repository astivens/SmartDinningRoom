import bcrypt from 'bcryptjs';
import { sequelize } from './config/database';
import { User, UserRole, Student } from './models';

async function createInitialUsers() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    const adminPassword = 'admin123';
    const supervisorPassword = 'supervisor123';
    const studentPassword = 'estudiante123';

    const admin = await User.create({
      email: 'admin@smartcomedor.edu',
      password: adminPassword,
      name: 'Administrador',
      lastName: 'Principal',
      role: UserRole.ADMIN,
      isActive: true,
      isAuthorized: true
    });

    const supervisor = await User.create({
      email: 'supervisor@smartcomedor.edu',
      password: supervisorPassword,
      name: 'Juan',
      lastName: 'Supervisor',
      role: UserRole.SUPERVISOR,
      isActive: true,
      isAuthorized: true
    });

    const student = await User.create({
      email: 'estudiante@smartcomedor.edu',
      password: studentPassword,
      name: 'Carlos',
      lastName: 'Estudiante',
      role: UserRole.STUDENT,
      isActive: true,
      isAuthorized: true
    });

    await Student.create({
      userId: student.id,
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
      diasComedor: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
    });

    console.log('Users created successfully:');
    console.log('- Admin: admin@smartcomedor.edu / admin123');
    console.log('- Supervisor: supervisor@smartcomedor.edu / supervisor123');
    console.log('- Estudiante: estudiante@smartcomedor.edu / estudiante123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

createInitialUsers();
