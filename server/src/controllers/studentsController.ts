import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Student, User, Payment, MealAttendance, UserRole } from '../models';
import { Op } from 'sequelize';
import * as XLSX from 'xlsx';
import { logAction } from '../services/auditService';
import { validateSisbenAgainstCedula } from '../services/sisbenValidationService';

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = 1, limit = 10, onlyActive } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { '$Student.cedula$': { [Op.iLike]: `%${search}%` } },
        { '$User.name$': { [Op.iLike]: `%${search}%` } },
        { '$User.lastName$': { [Op.iLike]: `%${search}%` } },
        { '$Student.carrera$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const userWhere: any = { role: 'student' };
    if (onlyActive === 'true') {
      userWhere.isActive = true;
    }

    const { count, rows } = await User.findAndCountAll({
      where: userWhere,
      include: [{
        model: Student,
        as: 'student',
        where,
        required: true
      }],
      limit: Number(limit),
      offset
    });

    res.json({
      students: rows,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit))
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await User.findOne({
      where: { id, role: 'student' },
      include: ['student']
    });

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const payments = await Payment.findAll({
      where: { studentId: (student as any).student.id, isVerified: true }
    });

    const totalMeals = payments.reduce((sum, p) => sum + p.mealsIncluded, 0);
    const usedMeals = payments.reduce((sum, p) => sum + p.mealsUsed, 0);
    const availableMeals = totalMeals - usedMeals;

    res.json({
      student,
      availableMeals
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      lastName,
      cedula,
      carrera,
      semestre,
      categoriaSisben,
      direccion,
      barrio,
      telefono,
      trabaja,
      etnia,
      desplazado,
      trabajadorUniversitario,
      diasComedor
    } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const user = await User.create({
      email,
      password,
      name,
      lastName,
      role: UserRole.STUDENT,
      isActive: true,
      isAuthorized: true
    });

    await Student.create({
      userId: user.id,
      cedula,
      carrera,
      semestre,
      categoriaSisben,
      archivoSisben: '',
      direccion,
      barrio,
      telefono,
      trabaja: trabaja || false,
      etnia,
      desplazado: desplazado || false,
      trabajadorUniversitario: trabajadorUniversitario || false,
      diasComedor: diasComedor || []
    });

    logAction(req.user!.id, req.user!.email, 'CREATE_STUDENT', `Email: ${email}`, req).catch(() => {});
    res.status(201).json({ message: 'Estudiante creado', user });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const {
      name,
      lastName,
      email,
      cedula,
      carrera,
      semestre,
      categoriaSisben,
      direccion,
      barrio,
      telefono,
      trabaja,
      etnia,
      desplazado,
      trabajadorUniversitario,
      diasComedor,
      isActive
    } = req.body;

    await user.update({ name, lastName, email, isActive });

    const student = await Student.findOne({ where: { userId: id } });
    if (student) {
      await student.update({
        cedula,
        carrera,
        semestre,
        categoriaSisben,
        direccion,
        barrio,
        telefono,
        trabaja,
        etnia,
        desplazado,
        trabajadorUniversitario,
        diasComedor
      });
    }

    logAction(req.user!.id, req.user!.email, 'UPDATE_STUDENT', `StudentId: ${id}`, req).catch(() => {});
    res.json({ message: 'Estudiante actualizado' });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    await user.update({ isActive: false });
    logAction(req.user!.id, req.user!.email, 'DISABLE_STUDENT', `StudentId: ${id}`, req).catch(() => {});
    res.json({ message: 'Estudiante deshabilitado' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const importStudentsFromExcel = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    const MEAL_PRICE = 2000;

    for (const row of data as any[]) {
      try {
        const existingUser = await User.findOne({
          where: { email: row.email }
        });

        if (existingUser) {
          const student = await Student.findOne({ where: { userId: existingUser.id } });
          if (student) {
            await student.update({
              carrera: row.carrera ?? student.carrera,
              cedula: row.cedula ? String(row.cedula) : student.cedula,
              diasComedor: row.dias ? row.dias.split(',').map((d: string) => d.trim()) : student.diasComedor
            });
            await existingUser.update({
              name: row.nombre ?? existingUser.name,
              lastName: row.apellido ?? existingUser.lastName
            });

            const pagoRaw = row.pago ?? row.Pago;
            if (pagoRaw && Number(pagoRaw) > 0) {
              const amount = Number(pagoRaw);
              const mealsIncluded = Math.floor(amount / MEAL_PRICE);
              await Payment.create({
                studentId: student.id,
                amount,
                mealsIncluded,
                mealsUsed: 0,
                comprobantePath: 'importado-excel',
                isVerified: true
              });
            }

            results.updated++;
          }
        } else {
          const password = row.cedula?.toString() ?? 'password123';
          const user = await User.create({
            email: row.email,
            password,
            name: row.nombre,
            lastName: row.apellido,
            role: UserRole.STUDENT,
            isActive: true,
            isAuthorized: true
          });

          const diasComedor = row.dias
            ? row.dias.split(',').map((d: string) => d.trim())
            : [];

          const student = await Student.create({
            userId: user.id,
            cedula: row.cedula?.toString() ?? '',
            carrera: row.carrera ?? '',
            semestre: 1,
            categoriaSisben: 'A',
            archivoSisben: '',
            direccion: '',
            barrio: '',
            telefono: '',
            trabaja: false,
            etnia: 'Ninguna',
            desplazado: false,
            trabajadorUniversitario: false,
            diasComedor
          });

          const pagoRaw = row.pago ?? row.Pago;
          if (pagoRaw && Number(pagoRaw) > 0) {
            const amount = Number(pagoRaw);
            const mealsIncluded = Math.floor(amount / MEAL_PRICE);
            await Payment.create({
              studentId: student.id,
              amount,
              mealsIncluded,
              mealsUsed: 0,
              comprobantePath: 'importado-excel',
              isVerified: true
            });
          }

          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Error con fila: ${err.message}`);
      }
    }

    logAction(req.user!.id, req.user!.email, 'IMPORT_EXCEL', `Creados: ${results.created}, Actualizados: ${results.updated}`, req).catch(() => {});
    res.json(results);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Error al importar archivo' });
  }
};

export const searchStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { cedula, nombre, apellido, carrera, dia, uid, q } = req.query;

    const where: any = { role: 'student' };
    const studentWhere: any = {};

    if (cedula) studentWhere.cedula = { [Op.iLike]: `%${cedula}%` };
    if (carrera) studentWhere.carrera = { [Op.iLike]: `%${carrera}%` };
    if (dia) studentWhere.diasComedor = { [Op.contains]: [dia] };
    if (uid) {
      where.id = uid;
    }

    if (q) {
      const query = String(q);
      where[Op.or] = [
        { uid: { [Op.iLike]: `%${query}%` } },
        { id: { [Op.iLike]: `%${query}%` } },
        { name: { [Op.iLike]: `%${query}%` } },
        { lastName: { [Op.iLike]: `%${query}%` } }
      ];
      studentWhere[Op.or] = [
        { cedula: { [Op.iLike]: `%${query}%` } },
        { id: { [Op.iLike]: `%${query}%` } }
      ];
    }

    if (nombre) {
      where.name = { [Op.iLike]: `%${nombre}%` };
    }
    if (apellido) {
      where.lastName = { [Op.iLike]: `%${apellido}%` };
    }

    const students = await User.findAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        where: Object.keys(studentWhere).length ? studentWhere : undefined,
        required: true
      }]
    });

    const results = await Promise.all(students.map(async (student) => {
      const studentData = (student as any).student;
      const payments = await Payment.findAll({
        where: { studentId: studentData.id, isVerified: true }
      });

      const totalMeals = payments.reduce((sum, p) => sum + p.mealsIncluded, 0);
      const usedMeals = payments.reduce((sum, p) => sum + p.mealsUsed, 0);

      return {
        id: student.id,
        uid: student.uid,
        studentId: studentData.id,
        nombre: student.name,
        apellido: student.lastName,
        cedula: studentData.cedula,
        carrera: studentData.carrera,
        diasAutorizados: studentData.diasComedor,
        almuerzosDisponibles: totalMeals - usedMeals
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const validateSisben = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { id, role: 'student' },
      include: ['student']
    });

    if (!user) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const student = (user as any).student;
    if (!student.archivoSisben || !student.cedulaFrontalPath) {
      return res.status(400).json({ message: 'El estudiante no tiene evidencias SISBEN y cédula frontal completas' });
    }

    const comparison = await validateSisbenAgainstCedula(student.archivoSisben, student.cedulaFrontalPath, {
      cedula: student.cedula,
      name: user.name,
      lastName: user.lastName
    });

    await student.update({
      isValidatedSisben: comparison.validated,
      sisbenAutoValidated: comparison.validated,
      sisbenValidationDetails: comparison
    });

    if (comparison.validated) {
      return res.json({ validated: true, message: 'Documento aprobado por administrador con validación automática consistente', mismatches: comparison.mismatches });
    }

    res.json({
      validated: false,
      message: 'La revisión automática detecta inconsistencias entre SISBEN y cédula',
      mismatches: comparison.mismatches
    });
  } catch (error) {
    console.error('Validate SISBEN error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const getAvailableMeals = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = await Student.findOne({
      where: {
        [Op.or]: [
          { userId: id },
          { id }
        ]
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const payments = await Payment.findAll({
      where: { studentId: student.id, isVerified: true }
    });

    const totalMeals = payments.reduce((sum, p) => sum + p.mealsIncluded, 0);
    const usedMeals = payments.reduce((sum, p) => sum + p.mealsUsed, 0);

    res.json({
      totalMeals,
      usedMeals,
      availableMeals: totalMeals - usedMeals
    });
  } catch (error) {
    console.error('Get available meals error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const updateStudentCycle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { currentCycle, cycleRevalidationDueAt, cycleDisabledAt } = req.body;
    const student = await Student.findOne({ where: { userId: id } });
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    await student.update({
      currentCycle: currentCycle ?? student.currentCycle,
      cycleRevalidationDueAt: cycleRevalidationDueAt ?? student.cycleRevalidationDueAt,
      cycleDisabledAt: cycleDisabledAt ?? student.cycleDisabledAt
    });

    if (cycleDisabledAt && new Date(cycleDisabledAt).getTime() <= Date.now()) {
      const user = await User.findByPk(id);
      if (user) {
        await user.update({ isActive: false });
      }
    }

    return res.json({ message: 'Ciclo actualizado', student });
  } catch (error) {
    console.error('Update student cycle error:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
};
