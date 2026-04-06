/**
 * ============================================================================
 * PRUEBAS UNITARIAS - studentsController
 * ============================================================================
 * 
 * Técnicas de prueba aplicadas:
 * - CAJA BLANCA: Grafo de flujo, cobertura de caminos
 * - CAJA NEGRA: Clases de equivalencia
 * - VALORES LÍMITE: Cédula (6-12), Nombre (20), Carrera (25)
 * - CAMINO BÁSICO: Cobertura de todos los caminos
 * ============================================================================
 */

import { Response } from 'express';
import {
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent,
  searchStudents, validateSisben, getAvailableMeals, importStudentsFromExcel
} from '../../controllers/studentsController';
import { User, Student, Payment, UserRole } from '../../models';
import { AuthRequest } from '../../middleware/auth';

// Mock modelos
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
  },
  Student: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Payment: {
    findAll: jest.fn(),
  },
  MealAttendance: {},
  UserRole: { STUDENT: 'student' },
}));

jest.mock('../../services/auditService', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('xlsx', () => ({
  readFile: jest.fn(),
  utils: { sheet_to_json: jest.fn() },
}));

const mockResponse = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
};

const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user?: any, file?: any): any => ({
  body, params, query, user, file,
});

describe('studentsController', () => {
  beforeEach(() => jest.clearAllMocks());

  // =========================================================================
  // MÉTODO: getStudents
  // =========================================================================
  /**
   * Grafo de flujo:
   * [N1] Inicio -> Obtener query params (search, page, limit)
   *  |
   * [N2] Construir where con Op.iLike si search existe
   *  |
   * [N3] Ejecutar findAndCountAll
   *  |
   * [N4] Retornar 200 con paginación
   */

  describe('getStudents', () => {
    it('TC-GET-STU-001: Obtener lista de estudiantes exitosamente', async () => {
      const mockStudents = {
        count: 2,
        rows: [
          { id: 'u1', name: 'Juan', student: { cedula: '123' } },
          { id: 'u2', name: 'Maria', student: { cedula: '456' } },
        ],
      };
      (User.findAndCountAll as jest.Mock).mockResolvedValue(mockStudents);

      const req = mockRequest({}, {}, { page: '1', limit: '10' }, { id: 'admin-1', role: 'admin' });
      const res = mockResponse();

      await getStudents(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        students: mockStudents.rows,
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });

    it('TC-GET-STU-002: Paginación correcta', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ count: 25, rows: [] });

      const req = mockRequest({}, {}, { page: '2', limit: '10' }, { role: 'admin' });
      const res = mockResponse();

      await getStudents(req as AuthRequest, res as Response);

      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 10 })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ totalPages: 3 }));
    });

    it('TC-GET-STU-003: Búsqueda por texto (search)', async () => {
      (User.findAndCountAll as jest.Mock).mockResolvedValue({ count: 1, rows: [] });

      const req = mockRequest({}, {}, { search: 'Juan' }, { role: 'admin' });
      const res = mockResponse();

      await getStudents(req as AuthRequest, res as Response);

      // Verifica que se llamó con where condicional para búsqueda
      expect(User.findAndCountAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 1 }));
    });
  });

  // =========================================================================
  // MÉTODO: getStudentById
  // =========================================================================
  describe('getStudentById', () => {
    /**
     * Grafo de flujo:
     * [N1] Inicio -> Buscar User por id con role=student
     *  |
     * --[N2]-- No encontrado -> 404
     * |        |
     * [N3]    return
     *  |
     * [N4] Buscar pagos verificados
     *  |
     * [N5] Calcular almuerzos disponibles (total - usados)
     *  |
     * [N6] Retornar 200 con student y availableMeals
     */

    it('TC-BY-ID-001: Obtener estudiante por ID exitosamente', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Juan',
        lastName: 'Perez',
        role: 'student',
        student: { id: 'student-1', cedula: '123456' },
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (Payment.findAll as jest.Mock).mockResolvedValue([
        { mealsIncluded: 10, mealsUsed: 3 },
        { mealsIncluded: 5, mealsUsed: 2 },
      ]);

      const req = mockRequest({}, { id: 'user-1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await getStudentById(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        student: mockUser,
        availableMeals: 10, // (10+5) - (3+2) = 10
      });
    });

    it('TC-BY-ID-002: Error 404 - Estudiante no encontrado', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'user-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await getStudentById(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('TC-BY-ID-003: Sin pagos verificados - availableMeals = 0', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        id: 'user-1', student: { id: 'student-1' },
      });
      (Payment.findAll as jest.Mock).mockResolvedValue([]);

      const req = mockRequest({}, { id: 'user-1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await getStudentById(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ availableMeals: 0 }));
    });
  });

  // =========================================================================
  // MÉTODO: createStudent
  // =========================================================================
  describe('createStudent', () => {
    /**
     * Grafo de flujo:
     * [N1] Inicio -> Validar body
     *  |
     * [N2] Verificar email existente
     *  |
     * --[N3]-- Existe -> 400
     * |        |
     * [N4]    return
     *  |
     * [N5] Crear User (role=STUDENT)
     *  |
     * [N6] Crear Student
     *  |
     * [N7] Log auditoría
     *  |
     * [N8] Return 201
     */

    // ==================== VALORES LÍMITE ====================
    describe('Valores Límite', () => {
      const validData = {
        email: 'test@test.com', password: 'password123', name: 'Juan', lastName: 'Perez',
        cedula: '12345678', carrera: 'Ing Sistemas', semestre: 5,
        categoriaSisben: 'A1', barrio: 'Centro', telefono: '3001234567', etnia: 'Ninguna',
      };

      // Cédula: min 6, max 12
      it('VL-CEDULA: Cédula de 6 dígitos (mínimo)', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ id: 'u1', ...validData });
        (Student.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest({ ...validData, cedula: '123456' }, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
        const res = mockResponse();
        await createStudent(req as AuthRequest, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('VL-CEDULA: Cédula de 12 dígitos (máximo)', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ id: 'u1', ...validData });
        (Student.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest({ ...validData, cedula: '123456789012' }, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
        const res = mockResponse();
        await createStudent(req as AuthRequest, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      // Nombre: max 20 caracteres
      it('VL-NOMBRE: Nombre de 20 caracteres (máximo)', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ id: 'u1' });
        (Student.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest({ ...validData, name: 'A'.repeat(20) }, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
        const res = mockResponse();
        await createStudent(req as AuthRequest, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      // Carrera: max 25 caracteres
      it('VL-CARRERA: Carrera de 25 caracteres (máximo)', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ id: 'u1' });
        (Student.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest({ ...validData, carrera: 'A'.repeat(25) }, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
        const res = mockResponse();
        await createStudent(req as AuthRequest, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    // ==================== CAJA NEGRA ====================
    describe('Caja Negra - Clases de Equivalencia', () => {
      const validData = {
        email: 'nuevo@test.com', password: 'pass1234', name: 'Maria', lastName: 'Lopez',
        cedula: '87654321', carrera: 'Medicina', semestre: 3,
        categoriaSisben: 'B2', barrio: 'Norte', telefono: '3109876543', etnia: 'Ninguna',
      };

      it('TC-CREATE-001: Creación exitosa con datos válidos', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ id: 'u1', email: validData.email });
        (Student.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest(validData, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
        const res = mockResponse();

        await createStudent(req as AuthRequest, res as Response);

        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
          email: validData.email,
          role: 'student',
          isActive: true,
          isAuthorized: true,
        }));
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('TC-CREATE-002: Error 400 - Email ya registrado', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing-user' });

        const req = mockRequest(validData, {}, {}, { id: 'admin-1' });
        const res = mockResponse();

        await createStudent(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'El correo ya está registrado' });
      });

      it('TC-CREATE-003: DiasComedor se asigna correctamente', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ id: 'u1' });
        (Student.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest(
          { ...validData, diasComedor: ['Lunes', 'Miercoles'] },
          {}, {}, { id: 'admin-1', email: 'admin@test.com' }
        );
        const res = mockResponse();

        await createStudent(req as AuthRequest, res as Response);

        expect(Student.create).toHaveBeenCalledWith(expect.objectContaining({
          diasComedor: ['Lunes', 'Miercoles'],
        }));
      });
    });
  });

  // =========================================================================
  // MÉTODO: updateStudent
  // =========================================================================
  describe('updateStudent', () => {
    it('TC-UPDATE-001: Actualización exitosa', async () => {
      const mockUser = {
        id: 'user-1', role: 'student',
        update: jest.fn().mockResolvedValue(true),
      };
      const mockStudent = { update: jest.fn().mockResolvedValue(true) };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (Student.findOne as jest.Mock).mockResolvedValue(mockStudent);

      const req = mockRequest({ name: 'Nuevo Nombre' }, { id: 'user-1' }, {}, { id: 'admin-1', email: 'admin@test.com' });
      const res = mockResponse();

      await updateStudent(req as AuthRequest, res as Response);

      expect(mockUser.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Estudiante actualizado' });
    });

    it('TC-UPDATE-002: Error 404 - Estudiante no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'user-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await updateStudent(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('TC-UPDATE-003: Error 404 - Usuario no es estudiante (es admin)', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'admin' });

      const req = mockRequest({}, { id: 'admin-1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await updateStudent(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: deleteStudent
  // =========================================================================
  describe('deleteStudent', () => {
    it('TC-DELETE-001: Deshabilitación exitosa (soft delete)', async () => {
      const mockUser = {
        id: 'user-1', role: 'student',
        update: jest.fn().mockResolvedValue(true),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({}, { id: 'user-1' }, {}, { id: 'admin-1', email: 'admin@test.com' });
      const res = mockResponse();

      await deleteStudent(req as AuthRequest, res as Response);

      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false });
      expect(res.json).toHaveBeenCalledWith({ message: 'Estudiante deshabilitado' });
    });

    it('TC-DELETE-002: Error 404 - Estudiante no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'user-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await deleteStudent(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: validateSisben
  // =========================================================================
  /**
   * Grafo de flujo validateSisben:
   * [N1] Inicio -> Buscar usuario por id
   *  |
   * --[N2]-- No encontrado -> 404
     * |        |
   * [N3]    return
   *  |
   * [N4] Comparar cédula, nombre, apellido (trim, lowercase)
   *  |
   * --[N5]-- Todos coinciden -> Actualizar isValidatedSisben=true -> 200 {validated:true}
   * |        |
   * --[N6]-- Alguno no coincide -> 200 {validated:false, mismatches}
   */

  describe('validateSisben', () => {
    it('TC-SISBEN-001: Validación exitosa - todos los datos coinciden', async () => {
      const mockUser = {
        id: 'user-1',
        name: ' Juan ',
        lastName: 'Perez',
        student: { cedula: '12345678', update: jest.fn().mockResolvedValue(true) },
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest(
        { cedula: '12345678', name: 'juan', lastName: 'PEREZ' },
        { id: 'user-1' }, {}, { id: 'admin-1' }
      );
      const res = mockResponse();

      await validateSisben(req as AuthRequest, res as Response);

      expect(mockUser.student.update).toHaveBeenCalledWith({ isValidatedSisben: true });
      expect(res.json).toHaveBeenCalledWith({
        validated: true,
        message: 'Datos SISBEN validados correctamente',
      });
    });

    it('TC-SISBEN-002: Validación fallida - cédula no coincide', async () => {
      const mockUser = {
        id: 'user-1', name: 'Juan', lastName: 'Perez',
        student: { cedula: '12345678', update: jest.fn() },
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest(
        { cedula: '99999999', name: 'Juan', lastName: 'Perez' },
        { id: 'user-1' }, {}, { id: 'admin-1' }
      );
      const res = mockResponse();

      await validateSisben(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        validated: false,
        mismatches: expect.objectContaining({ cedula: true }),
      }));
    });

    it('TC-SISBEN-003: Error 404 - Estudiante no encontrado', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ cedula: '123', name: 'J', lastName: 'P' }, { id: 'user-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await validateSisben(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: getAvailableMeals
  // =========================================================================
  describe('getAvailableMeals', () => {
    it('TC-MEALS-001: Calcular almuerzos disponibles correctamente', async () => {
      const mockStudent = { id: 'student-1' };
      (Student.findOne as jest.Mock).mockResolvedValue(mockStudent);
      (Payment.findAll as jest.Mock).mockResolvedValue([
        { mealsIncluded: 20, mealsUsed: 5 },
        { mealsIncluded: 10, mealsUsed: 8 },
      ]);

      const req = mockRequest({}, { id: 'user-1' }, {}, { id: 'user-1' });
      const res = mockResponse();

      await getAvailableMeals(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        totalMeals: 30,    // 20 + 10
        usedMeals: 13,     // 5 + 8
        availableMeals: 17, // 30 - 13
      });
    });

    it('TC-MEALS-002: Error 404 - Estudiante no encontrado', async () => {
      (Student.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'user-999' }, {}, { id: 'user-999' });
      const res = mockResponse();

      await getAvailableMeals(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: searchStudents (Supervisor)
  // =========================================================================
  describe('searchStudents', () => {
    it('TC-SEARCH-001: Búsqueda por cédula', async () => {
      (User.findAll as jest.Mock).mockResolvedValue([{
        id: 'u1', name: 'Juan', lastName: 'Perez',
        student: { id: 's1', cedula: '123456', carrera: 'Ing', diasComedor: ['Lunes'] },
      }]);
      (Payment.findAll as jest.Mock).mockResolvedValue([
        { mealsIncluded: 10, mealsUsed: 3 },
      ]);

      const req = mockRequest({}, {}, { cedula: '123' }, { id: 'sup-1', role: 'supervisor' });
      const res = mockResponse();

      await searchStudents(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith([expect.objectContaining({
        nombre: 'Juan',
        cedula: '123456',
        almuerzosDisponibles: 7,
      })]);
    });

    it('TC-SEARCH-002: Búsqueda sin filtros retorna todos', async () => {
      (User.findAll as jest.Mock).mockResolvedValue([]);
      (Payment.findAll as jest.Mock).mockResolvedValue([]);

      const req = mockRequest({}, {}, {}, { id: 'sup-1', role: 'supervisor' });
      const res = mockResponse();

      await searchStudents(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  // =========================================================================
  // MÉTODO: importStudentsFromExcel
  // =========================================================================
  describe('importStudentsFromExcel', () => {
    const XLSX = require('xlsx');

    it('TC-IMPORT-001: Error 400 - No se envió archivo', async () => {
      const req = mockRequest({}, {}, {}, { id: 'admin-1' }, undefined);
      const res = mockResponse();

      await importStudentsFromExcel(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-IMPORT-002: Importar archivo Excel correctamente', async () => {
      const mockFile = { path: 'uploads/students.xlsx' };
      const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: {} };
      
      (XLSX.readFile as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        { email: 'nuevo@test.com', nombre: 'Pedro', apellido: 'Gomez', cedula: '9999', carrera: 'Ing', dias: 'Lunes,Martes', pago: 10000 },
      ]);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({ id: 'u1', email: 'nuevo@test.com' });
      (Student.create as jest.Mock).mockResolvedValue({ id: 's1' });
      (Payment.create as any) = jest.fn().mockResolvedValue({});

      const req = mockRequest({}, {}, {}, { id: 'admin-1', email: 'admin@test.com' }, mockFile);
      const res = mockResponse();

      await importStudentsFromExcel(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        created: 1,
        updated: 0,
        errors: [],
      }));
    });

    it('TC-IMPORT-003: Actualizar estudiante existente con pago', async () => {
      const mockFile = { path: 'uploads/students.xlsx' };
      const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: {} };
      const mockUser = { id: 'u1', name: 'Viejo', lastName: 'Apellido', update: jest.fn().mockResolvedValue(true) };
      const mockStudent = { id: 's1', carrera: 'Vieja', cedula: '111', diasComedor: [], update: jest.fn().mockResolvedValue(true) };
      
      (XLSX.readFile as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        { email: 'exist@test.com', nombre: 'Nuevo', apellido: 'Nombre', cedula: '2222', carrera: 'Nueva', dias: 'Lunes', pago: 20000 },
      ]);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (User.update as any) = jest.fn().mockResolvedValue(true);
      (Student.findOne as jest.Mock).mockResolvedValue(mockStudent);
      (Payment.create as any) = jest.fn().mockResolvedValue({});

      const req = mockRequest({}, {}, {}, { id: 'admin-1', email: 'admin@test.com' }, mockFile);
      const res = mockResponse();

      await importStudentsFromExcel(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        updated: 1,
        created: 0,
      }));
    });
  });
});
