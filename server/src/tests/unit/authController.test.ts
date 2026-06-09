/**
 * ============================================================================
 * PRUEBAS UNITARIAS - authController
 * ============================================================================
 * 
 * Técnicas de prueba aplicadas:
 * - CAJA BLANCA: Grafo de flujo, cobertura de caminos, ciclomática
 * - CAJA NEGRA: Clases de equivalencia válidas/inválidas
 * - VALORES LÍMITE: Email (30), Nombre (20), Apellido (20), Cédula (6-12), Password (8)
 * - CAMINO BÁSICO: Cobertura de todos los caminos del grafo de flujo
 * ============================================================================
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import {
  login, register, refreshToken, getProfile, updateProfile,
  forgotPassword, resetPassword, changePassword, setupTwoFactor, verifyTwoFactor
} from '../../controllers/authController';
import { User, UserRole, Student } from '../../models';
import { AuthRequest } from '../../middleware/auth';

// Mock de modelos y servicios
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Student: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  UserRole: {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    STUDENT: 'student',
  },
}));

jest.mock('../../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/auditService', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/sisbenValidationService', () => ({
  extractSisbenText: jest.fn().mockResolvedValue('Horario extraído'),
  validateSisbenAgainstCedula: jest.fn().mockResolvedValue({
    validated: true,
    mismatches: { cedula: false, name: false, lastName: false, cedulaDocument: false },
  }),
}));

jest.mock('speakeasy');
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}));

// Helper para crear mock de response
const mockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

// Helper para crear mock de request
const mockRequest = (body: any = {}, user?: any, file?: any): any => {
  const files = file
    ? {
        archivoSisben: [file],
        cedulaFrontal: [file],
        horarioPdf: [file],
        reciboPago: [file],
      }
    : undefined;

  return {
    body,
    user,
    file,
    files,
    headers: {},
  };
};

describe('authController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    (Student.findOne as jest.Mock).mockResolvedValue(null);
  });

  // =========================================================================
  // MÉTODO: login
  // =========================================================================
  // Grafo de flujo del método login:
  //
  //  [N1] Inicio -> Validar campos (email, password, role)
  //    |-> [N2] Faltan campos -> 400 "Email, contraseña y rol son requeridos"
  //    |-> [N3] Buscar usuario por email
  //         |-> [N4] Usuario no existe -> 401 "Credenciales inválidas"
  //         |-> [N5] Validar contraseña
  //              |-> [N6] Contraseña incorrecta -> 401 "Credenciales inválidas"
  //              |-> [N7] Verificar isActive
  //                   |-> [N8] Usuario inactivo -> 401 "Usuario inactivo"
  //                   |-> [N9] Verificar rol
  //                        |-> [N10] Rol no coincide -> 403 "Usted no está autorizado"
  //                        |-> [N11] Verificar isAuthorized (admin/supervisor)
  //                             |-> [N12] No autorizado -> 403 "Usted no está autorizado"
  //                             |-> [N13] Generar tokens -> 200 "Login exitoso"
  //
  // Ciclomática: V(G) = E - N + 2P = 14 - 13 + 2 = 3 (pero hay más branching)
  // Total caminos: 6 caminos básicos identificados
  // =========================================================================

  describe('login', () => {

    /**
     * Grafo de flujo - Método login:
     * 
     *         [N1]
     *          |
     *         [N2] --faltan campos--> 400
     *          |
     *         [N3]
     *          |
     *     ----[N4]----  --no existe--> 401
     *     |           |
     *    [N5]        401
     *     |
     * ----[N6]---- --incorrecta--> 401
     * |           |
     * [N7]       401
     *  |
     * --[N8]---- --inactivo--> 401
     * |         |
     * [N9]     401
     *  |
     * --[N10]--- --rol != --> 403
     * |         |
     * [N11]    403
     *  |
     * --[N12]--- --no auth--> 403
     * |         |
     * [N13]    403
     *  |
     * 200 OK
     */

    // ==================== CAJA NEGRA - Clases de equivalencia ====================
    describe('Caja Negra - Clases de Equivalencia', () => {
      /**
       * Clases de equivalencia para login:
       * 
       * Campo Email:
       *   CE1 (válida): email válido con formato correcto
       *   CE2 (inválida): email vacío
       *   CE3 (inválida): email nulo
       * 
       * Campo Password:
       *   CE4 (válida): password con cualquier longitud > 0
       *   CE5 (inválida): password vacío
       *   CE6 (inválida): password nulo
       * 
       * Campo Role:
       *   CE7 (válida): role = 'admin' con usuario autorizado
       *   CE8 (válida): role = 'supervisor' con usuario autorizado
       *   CE9 (válida): role = 'student'
       *   CE10 (inválida): role vacío
       *   CE11 (inválida): role no coincide con rol de usuario
       * 
       * Combinaciones:
       *   TC1: CE1 + CE4 + CE7 = Login exitoso (admin)
       *   TC2: CE2 + CE4 + CE7 = Error 400 campos requeridos
       *   TC3: CE1 + CE5 + CE7 = Error 400 campos requeridos
       *   TC4: CE1 + CE4 + CE10 = Error 400 campos requeridos
       *   TC5: Email inexistente = Error 401 credenciales inválidas
       *   TC6: Email válido + password incorrecta = Error 401
       *   TC7: Email válido + password correcta + usuario inactivo = Error 401
       *   TC8: Email válido + password correcta + rol incorrecto = Error 403
       *   TC9: Admin no autorizado = Error 403
       *   TC10: Login exitoso (student)
       *   TC11: Login exitoso (supervisor autorizado)
       */

      it('TC-LOGIN-001: Login exitoso como administrador', async () => {
        // Precondición: Usuario admin existe, activo y autorizado
        const mockUser = {
          id: 'user-1',
          email: 'admin@test.com',
          password: 'hashedPassword',
          name: 'Admin',
          lastName: 'Test',
          role: UserRole.ADMIN,
          isActive: true,
          isAuthorized: true,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'admin@test.com',
          password: 'password123',
          role: 'admin',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'admin@test.com' } });
        expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Login exitoso',
            user: expect.objectContaining({
              id: 'user-1',
              email: 'admin@test.com',
              role: 'admin',
            }),
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          })
        );
      });

      it('TC-LOGIN-002: Login exitoso como estudiante', async () => {
        const mockUser = {
          id: 'user-2',
          email: 'student@test.com',
          password: 'hashedPassword',
          name: 'Juan',
          lastName: 'Perez',
          role: UserRole.STUDENT,
          isActive: true,
          isAuthorized: true,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'student@test.com',
          password: 'password123',
          role: 'student',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Login exitoso',
            user: expect.objectContaining({ role: 'student' }),
          })
        );
      });

      it('TC-LOGIN-003: Login exitoso como supervisor autorizado', async () => {
        const mockUser = {
          id: 'user-3',
          email: 'supervisor@test.com',
          password: 'hashedPassword',
          name: 'Carlos',
          lastName: 'Lopez',
          role: UserRole.SUPERVISOR,
          isActive: true,
          isAuthorized: true,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'supervisor@test.com',
          password: 'password123',
          role: 'supervisor',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Login exitoso' })
        );
      });

      it('TC-LOGIN-004: Error 400 - Campos requeridos faltantes (sin email)', async () => {
        const req = mockRequest({ password: 'pass123', role: 'student' });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Email, contraseña y rol son requeridos',
        });
      });

      it('TC-LOGIN-005: Error 400 - Campos requeridos faltantes (sin password)', async () => {
        const req = mockRequest({ email: 'test@test.com', role: 'student' });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('TC-LOGIN-006: Error 400 - Campos requeridos faltantes (sin role)', async () => {
        const req = mockRequest({ email: 'test@test.com', password: 'pass123' });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('TC-LOGIN-007: Error 401 - Usuario no existe', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);

        const req = mockRequest({
          email: 'noexiste@test.com',
          password: 'pass123',
          role: 'student',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
      });

      it('TC-LOGIN-008: Error 401 - Contraseña incorrecta', async () => {
        const mockUser = {
          id: 'user-1',
          validatePassword: jest.fn().mockResolvedValue(false),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'test@test.com',
          password: 'wrongpassword',
          role: 'student',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
      });

      it('TC-LOGIN-009: Error 401 - Usuario inactivo', async () => {
        const mockUser = {
          id: 'user-1',
          isActive: false,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'test@test.com',
          password: 'pass123',
          role: 'student',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Usuario inactivo' });
      });

      it('TC-LOGIN-010: Error 403 - Rol no coincide (student intenta como admin)', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.STUDENT,
          isActive: true,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'test@test.com',
          password: 'pass123',
          role: 'admin',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Usted no está autorizado' });
      });

      it('TC-LOGIN-011: Error 403 - Admin no autorizado (isAuthorized=false)', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.ADMIN,
          isActive: true,
          isAuthorized: false,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'admin@test.com',
          password: 'pass123',
          role: 'admin',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Usted no está autorizado' });
      });

      it('TC-LOGIN-012: Error 403 - Supervisor no autorizado (isAuthorized=false)', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.SUPERVISOR,
          isActive: true,
          isAuthorized: false,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'sup@test.com',
          password: 'pass123',
          role: 'supervisor',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('TC-LOGIN-013: Error 500 - Excepción del servidor', async () => {
        (User.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const req = mockRequest({
          email: 'test@test.com',
          password: 'pass123',
          role: 'student',
        });
        const res = mockResponse();

        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    // ==================== CAMINO BÁSICO - Cobertura de caminos ====================
    describe('Camino Básico - Cobertura de Caminos (Grafo de Flujo)', () => {
      /**
       * Caminos identificados en el grafo de flujo:
       * 
       * Camino 1: N1 -> N2 (campos faltantes) -> 400
       * Camino 2: N1 -> N3 -> N4 (usuario no existe) -> 401
       * Camino 3: N1 -> N3 -> N5 -> N6 (contraseña incorrecta) -> 401
       * Camino 4: N1 -> N3 -> N5 -> N7 -> N8 (usuario inactivo) -> 401
       * Camino 5: N1 -> N3 -> N5 -> N7 -> N9 -> N10 (rol incorrecto) -> 403
       * Camino 6: N1 -> N3 -> N5 -> N7 -> N9 -> N11 -> N12 (no autorizado) -> 403
       * Camino 7: N1 -> N3 -> N5 -> N7 -> N9 -> N11 -> N13 (éxito) -> 200
       * 
       * V(G) = E - N + 2P = 16 - 13 + 2*1 = 5+
       */

      it('Camino 1: Campos faltantes -> 400', async () => {
        const req = mockRequest({ email: 'test@test.com' }); // Falta password y role
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('Camino 2: Campos OK -> Usuario no existe -> 401', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        const req = mockRequest({ email: 'noexiste@test.com', password: 'pass', role: 'student' });
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(401);
      });

      it('Camino 3: Campos OK -> Usuario existe -> Contraseña incorrecta -> 401', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({
          validatePassword: jest.fn().mockResolvedValue(false),
        });
        const req = mockRequest({ email: 'test@test.com', password: 'wrong', role: 'student' });
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(401);
      });

      it('Camino 4: Campos OK -> Usuario -> Pass OK -> Inactivo -> 401', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({
          isActive: false,
          validatePassword: jest.fn().mockResolvedValue(true),
        });
        const req = mockRequest({ email: 'test@test.com', password: 'pass', role: 'student' });
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(401);
      });

      it('Camino 5: Campos OK -> Usuario -> Pass OK -> Activo -> Rol incorrecto -> 403', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({
          role: UserRole.STUDENT,
          isActive: true,
          validatePassword: jest.fn().mockResolvedValue(true),
        });
        const req = mockRequest({ email: 'test@test.com', password: 'pass', role: 'admin' });
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('Camino 6: Camino completo hasta no autorizado -> 403', async () => {
        (User.findOne as jest.Mock).mockResolvedValue({
          role: UserRole.ADMIN,
          isActive: true,
          isAuthorized: false,
          validatePassword: jest.fn().mockResolvedValue(true),
        });
        const req = mockRequest({ email: 'admin@test.com', password: 'pass', role: 'admin' });
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('Camino 7: Camino completo exitoso -> 200', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'test@test.com',
          name: 'Test',
          lastName: 'User',
          role: UserRole.STUDENT,
          isActive: true,
          isAuthorized: true,
          validatePassword: jest.fn().mockResolvedValue(true),
        };
        (User.findOne as jest.Mock).mockResolvedValue(mockUser);
        const req = mockRequest({ email: 'test@test.com', password: 'pass', role: 'student' });
        const res = mockResponse();
        await login(req as Request, res as Response);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login exitoso' }));
      });
    });
  });

  // =========================================================================
  // MÉTODO: register
  // =========================================================================
  describe('register', () => {
    /**
     * Grafo de flujo register:
     * [N1] Inicio
     *  |
     * [N2] Validar archivo SISBEN -> No existe -> 400
     *  |
     * [N3] Buscar usuario existente por email
     *  |
     * --[N4]-- Existe -> 400 "El correo ya está registrado"
     * |        |
     * [N5]    return
     *  |
     * [N6] Crear User (role=STUDENT)
     *  |
     * [N7] Parsear diasComedor
     *  |
     * [N8] Crear Student
     *  |
     * [N9] Generar tokens
     *  |
     * [N10] Return 201 éxito
     */

    // ==================== VALORES LÍMITE ====================
    describe('Valores Límite - Campos con restricciones', () => {
      /**
       * Límites según requisitos:
       * - Email: max 30 caracteres
       * - Nombre: max 20 caracteres
       * - Apellido: max 20 caracteres
       * - Cédula: min 6, max 12 dígitos
       * - Password: exactamente 8 caracteres
       * - Carrera: max 25 caracteres
       */

      const baseValidData = {
        email: 'test@test.com',
        password: '12345678',
        name: 'Juan',
        lastName: 'Perez',
        cedula: '12345678',
        carrera: 'Ingeniería de Sistemas',
        semestre: '5',
        categoriaSisben: 'A1',
        barrio: 'Centro',
        telefono: '3001234567',
        etnia: 'Ninguna',
      };

      // Valores límite para Email (max 30)
      it('VL-EMAIL-001: Email de exactamente 30 caracteres - válido', async () => {
        const email30 = 'a'.repeat(21) + '@test.com'; // 30 chars total
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
          id: 'user-1',
          email: email30,
          name: 'Juan',
          lastName: 'Perez',
          role: 'student',
        });

        const req = mockRequest({ ...baseValidData, email: email30 }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      // Valores límite para Cédula (min 6, max 12)
      it('VL-CEDULA-001: Cédula de 6 dígitos - válido (mínimo)', async () => {
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
          id: 'user-1', email: 'test@test.com', name: 'Juan', lastName: 'Pez', role: 'student',
        });

        const req = mockRequest({
          ...baseValidData,
          cedula: '123456', // 6 dígitos - mínimo permitido
        }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('VL-CEDULA-002: Cédula de 12 dígitos - válido (máximo)', async () => {
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
          id: 'user-1', email: 'test@test.com', name: 'Juan', lastName: 'Pez', role: 'student',
        });

        const req = mockRequest({
          ...baseValidData,
          cedula: '123456789012', // 12 dígitos - máximo permitido
        }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('VL-CEDULA-003: Cédula de 5 dígitos - inválido (debajo del mínimo)', async () => {
        // Este caso fallaría en la validación de Sequelize (len[6,12])
        // pero el controlador no valida explícitamente - depende del modelo
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockRejectedValue(new Error('Validation error: cedula length'));

        const req = mockRequest({
          ...baseValidData,
          cedula: '12345', // 5 dígitos - inválido
        }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
      });

      // Valores límite para Nombre (max 20)
      it('VL-NOMBRE-001: Nombre de 20 caracteres - válido', async () => {
        const nombre20 = 'A'.repeat(20);
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
          id: 'user-1', email: 'test@test.com', name: nombre20, lastName: 'Pez', role: 'student',
        });

        const req = mockRequest({ ...baseValidData, name: nombre20 }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('VL-NOMBRE-002: Nombre de 21 caracteres - inválido', async () => {
        const nombre21 = 'A'.repeat(21);
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockRejectedValue(new Error('Validation error'));

        const req = mockRequest({ ...baseValidData, name: nombre21 }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    // ==================== CAJA NEGRA ====================
    describe('Caja Negra - Clases de Equivalencia', () => {
      it('TC-REG-001: Registro exitoso con todos los campos válidos', async () => {
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
          id: 'user-1',
          email: 'nuevo@test.com',
          name: 'Juan',
          lastName: 'Perez',
          role: 'student',
        });

        const req = mockRequest({
          email: 'nuevo@test.com',
          password: '12345678',
          name: 'Juan',
          lastName: 'Perez',
          cedula: '12345678',
          carrera: 'Ingeniería de Sistemas',
          semestre: '3',
          categoriaSisben: 'A1',
          barrio: 'Centro',
          telefono: '3001234567',
          etnia: 'Ninguna',
          diasComedor: JSON.stringify(['Lunes', 'Martes']),
        }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Registro exitoso',
            user: expect.objectContaining({ email: 'nuevo@test.com' }),
          })
        );
      });

      it('TC-REG-002: Error 400 - Archivo SISBEN faltante', async () => {
        const req = mockRequest({
          email: 'test@test.com',
          password: '12345678',
          name: 'Juan',
          lastName: 'Perez',
        }, undefined, undefined); // Sin archivo
        const res = mockResponse();

        await register(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'SISBEN, cédula frontal y horario PDF son obligatorios',
        });
      });

      it('TC-REG-003: Error 400 - Email ya registrado', async () => {
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing-user' });

        const req = mockRequest({
          email: 'existe@test.com',
          password: '12345678',
          name: 'Juan',
          lastName: 'Perez',
          cedula: '12345678',
          carrera: 'Ingeniería de Sistemas',
          semestre: '3',
          categoriaSisben: 'A1',
          barrio: 'Centro',
          telefono: '3001234567',
          etnia: 'Ninguna',
        }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'El correo ya está registrado',
        });
      });

      it('TC-REG-004: Parseo correcto de diasComedor desde string JSON', async () => {
        const mockFile = { path: 'uploads/sisben.pdf' };
        (User.findOne as jest.Mock).mockResolvedValue(null);
        const mockUser = { id: 'user-1', email: 'test@test.com', name: 'J', lastName: 'P', role: 'student' };
        (User.create as jest.Mock).mockResolvedValue(mockUser);

        const req = mockRequest({
          email: 'parse@test.com',
          password: '12345678',
          name: 'Juan',
          lastName: 'Perez',
          cedula: '12345678',
          carrera: 'Ingeniería de Sistemas',
          semestre: '1',
          categoriaSisben: 'A1',
          barrio: 'Centro',
          telefono: '300',
          etnia: 'Ninguna',
          diasComedor: '["Lunes","Martes"]',
        }, undefined, mockFile);
        const res = mockResponse();

        await register(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
      });
    });
  });

  // =========================================================================
  // MÉTODO: refreshToken
  // =========================================================================
  describe('refreshToken', () => {
    /**
     * Grafo de flujo refreshToken:
     * [N1] Inicio
     *  |
     * [N2] Validar token -> Vacío -> 400
     *  |
     * [N3] Verificar JWT
     *  |
     * --[N4]-- Token inválido -> 401
     * |        |
     * [N5]    return
     *  |
     * [N6] Buscar usuario por id
     *  |
     * --[N7]-- No existe o inactivo -> 401
     * |        |
     * [N8]    return
     *  |
     * [N9] Generar nuevos tokens -> 200
     */

    it('TC-REFRESH-001: Refresh exitoso con token válido', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        lastName: 'User',
        role: 'student',
        isActive: true,
      };

      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({ refreshToken: 'valid.jwt.token' });
      const res = mockResponse();

      await refreshToken(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        })
      );
    });

    it('TC-REFRESH-002: Error 400 - Token faltante', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await refreshToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token requerido' });
    });

    it('TC-REFRESH-003: Error 401 - Token JWT inválido', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const req = mockRequest({ refreshToken: 'invalid.token' });
      const res = mockResponse();

      await refreshToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('TC-REFRESH-004: Error 401 - Usuario no encontrado', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-999' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ refreshToken: 'valid.token' });
      const res = mockResponse();

      await refreshToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('TC-REFRESH-005: Error 401 - Usuario inactivo', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue({ id: 'user-1', isActive: false });

      const req = mockRequest({ refreshToken: 'valid.token' });
      const res = mockResponse();

      await refreshToken(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // =========================================================================
  // MÉTODO: getProfile
  // =========================================================================
  describe('getProfile', () => {
    it('TC-PROFILE-001: Obtener perfil exitoso', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Juan',
        lastName: 'Perez',
        role: 'student',
        student: { cedula: '12345678' },
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({}, { id: 'user-1', email: 'test@test.com', role: 'student' });
      const res = mockResponse();

      await getProfile(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('TC-PROFILE-002: Error 404 - Usuario no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'user-999' });
      const res = mockResponse();

      await getProfile(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: updateProfile
  // =========================================================================
  describe('updateProfile', () => {
    it('TC-UPDATE-001: Actualización de perfil exitosa', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Juan',
        lastName: 'Perez',
        update: jest.fn().mockResolvedValue(true),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest(
        { name: 'Juan Carlos', lastName: 'Perez', email: 'new@test.com' },
        { id: 'user-1' }
      );
      const res = mockResponse();

      await updateProfile(req as AuthRequest, res as Response);

      expect(mockUser.update).toHaveBeenCalledWith({
        name: 'Juan Carlos',
        lastName: 'Perez',
        email: 'new@test.com',
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Perfil actualizado' }));
    });

    it('TC-UPDATE-002: Error 404 - Usuario no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ name: 'Test' }, { id: 'user-999' });
      const res = mockResponse();

      await updateProfile(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: forgotPassword
  // =========================================================================
  describe('forgotPassword', () => {
    /**
     * Grafo de flujo forgotPassword:
     * [N1] Inicio
     *  |
     * [N2] Validar email -> Vacío -> 400
     *  |
     * [N3] Buscar usuario
     *  |
     * --[N4]-- Existe -> Generar token -> Enviar email
     * |        |
     * [N5]    (continúa)
     *  |
     * [N6] Return mensaje genérico 200 (siempre 200 por seguridad)
     */

    it('TC-FORGOT-001: Email enviado cuando usuario existe', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        update: jest.fn().mockResolvedValue(true),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({ email: 'test@test.com' });
      const res = mockResponse();

      await forgotPassword(req as Request, res as Response);

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        message: 'Si el correo está registrado, recibirás un enlace de recuperación',
      });
    });

    it('TC-FORGOT-002: Error 400 - Email faltante', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await forgotPassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-FORGOT-003: Mensaje genérico cuando usuario NO existe (seguridad)', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ email: 'noexiste@test.com' });
      const res = mockResponse();

      await forgotPassword(req as Request, res as Response);

      // Por seguridad, siempre retorna el mismo mensaje
      expect(res.json).toHaveBeenCalledWith({
        message: 'Si el correo está registrado, recibirás un enlace de recuperación',
      });
    });
  });

  // =========================================================================
  // MÉTODO: resetPassword
  // =========================================================================
  describe('resetPassword', () => {
    /**
     * Valores límite para password:
     * - Mínimo: 8 caracteres
     * - Máximo: 8 caracteres (exactamente 8 según el código)
     */

    it('TC-RESET-001: Contraseña restablecida exitosamente', async () => {
      const mockUser = {
        id: 'user-1',
        update: jest.fn().mockResolvedValue(true),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({ token: 'valid-token', newPassword: '12345678' }); // Exactamente 8
      const res = mockResponse();

      await resetPassword(req as Request, res as Response);

      expect(mockUser.update).toHaveBeenCalledWith({
        password: '12345678',
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña restablecida exitosamente' });
    });

    it('TC-RESET-002: Error 400 - Token faltante', async () => {
      const req = mockRequest({ newPassword: '12345678' });
      const res = mockResponse();

      await resetPassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-RESET-003: Error 400 - Contraseña nueva faltante', async () => {
      const req = mockRequest({ token: 'valid-token' });
      const res = mockResponse();

      await resetPassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-RESET-004: Error 400 - Contraseña NO tiene exactamente 8 caracteres (7)', async () => {
      const req = mockRequest({ token: 'valid-token', newPassword: '1234567' }); // 7 chars
      const res = mockResponse();

      await resetPassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La contraseña debe tener exactamente 8 caracteres',
      });
    });

    it('TC-RESET-005: Error 400 - Contraseña NO tiene exactamente 8 caracteres (9)', async () => {
      const req = mockRequest({ token: 'valid-token', newPassword: '123456789' }); // 9 chars
      const res = mockResponse();

      await resetPassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La contraseña debe tener exactamente 8 caracteres',
      });
    });

    it('TC-RESET-006: Error 400 - Token inválido o expirado', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ token: 'expired-token', newPassword: '12345678' });
      const res = mockResponse();

      await resetPassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
    });
  });

  // =========================================================================
  // MÉTODO: changePassword
  // =========================================================================
  describe('changePassword', () => {
    it('TC-CHANGE-001: Contraseña cambiada exitosamente', async () => {
      const mockUser = {
        id: 'user-1',
        validatePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest(
        { currentPassword: 'oldpass8', newPassword: 'newpass8' },
        { id: 'user-1' }
      );
      const res = mockResponse();

      await changePassword(req as AuthRequest, res as Response);

      expect(mockUser.validatePassword).toHaveBeenCalledWith('oldpass8');
      expect(mockUser.update).toHaveBeenCalledWith({ password: 'newpass8' });
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña actualizada' });
    });

    it('TC-CHANGE-002: Error 404 - Usuario no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ currentPassword: 'old', newPassword: 'new12345' }, { id: 'user-999' });
      const res = mockResponse();

      await changePassword(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('TC-CHANGE-003: Error 400 - Contraseña actual incorrecta', async () => {
      const mockUser = {
        id: 'user-1',
        validatePassword: jest.fn().mockResolvedValue(false),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest(
        { currentPassword: 'wrongpass', newPassword: 'newpass8' },
        { id: 'user-1' }
      );
      const res = mockResponse();

      await changePassword(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña actual incorrecta' });
    });
  });

  // =========================================================================
  // MÉTODO: setupTwoFactor
  // =========================================================================
  describe('setupTwoFactor', () => {
    it('TC-2FA-SETUP-001: Configuración 2FA exitosa para estudiante', async () => {
      const mockStudent = {
        id: 'student-1',
        update: jest.fn().mockResolvedValue(true),
      };
      const mockUser = {
        id: 'user-1',
        email: 'student@test.com',
        student: mockStudent,
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'BASE32SECRET',
        otpauth_url: 'otpauth://...',
      });

      const req = mockRequest({}, { id: 'user-1' });
      const res = mockResponse();

      await setupTwoFactor(req as AuthRequest, res as Response);

      expect(speakeasy.generateSecret).toHaveBeenCalled();
      expect(mockStudent.update).toHaveBeenCalledWith({ qrCodeSecret: 'BASE32SECRET' });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          qrCode: 'data:image/png;base64,mockqrcode',
          secret: 'BASE32SECRET',
        })
      );
    });

    it('TC-2FA-SETUP-002: Error 404 - Usuario no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'user-999' });
      const res = mockResponse();

      await setupTwoFactor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('TC-2FA-SETUP-003: Error 400 - Solo estudiantes (admin no puede)', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        student: null, // Admin no tiene student
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({}, { id: 'user-1' });
      const res = mockResponse();

      await setupTwoFactor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Solo los estudiantes pueden configurar 2FA',
      });
    });
  });

  // =========================================================================
  // MÉTODO: verifyTwoFactor
  // =========================================================================
  describe('verifyTwoFactor', () => {
    it('TC-2FA-VERIFY-001: Verificación 2FA exitosa', async () => {
      const mockStudent = {
        id: 'student-1',
        qrCodeSecret: 'BASE32SECRET',
        qrCode: null,
        update: jest.fn().mockResolvedValue(true),
      };
      const mockUser = {
        id: 'user-1',
        student: mockStudent,
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const req = mockRequest({ token: '123456' }, { id: 'user-1' });
      const res = mockResponse();

      await verifyTwoFactor(req as AuthRequest, res as Response);

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'BASE32SECRET',
        encoding: 'base32',
        token: '123456',
        window: 1,
      });
      expect(mockStudent.update).toHaveBeenCalledWith({ qrCode: 'enabled' });
      expect(res.json).toHaveBeenCalledWith({
        message: '2FA verificado y habilitado exitosamente',
      });
    });

    it('TC-2FA-VERIFY-002: Error 400 - Token 2FA faltante', async () => {
      const req = mockRequest({}, { id: 'user-1' });
      const res = mockResponse();

      await verifyTwoFactor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-2FA-VERIFY-003: Error 404 - Usuario no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ token: '123456' }, { id: 'user-999' });
      const res = mockResponse();

      await verifyTwoFactor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('TC-2FA-VERIFY-004: Error 400 - 2FA no configurado previamente', async () => {
      const mockUser = {
        id: 'user-1',
        student: { qrCodeSecret: null }, // No configurado
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({ token: '123456' }, { id: 'user-1' });
      const res = mockResponse();

      await verifyTwoFactor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: '2FA no configurado. Usa /auth/setup-2fa primero.',
      });
    });

    it('TC-2FA-VERIFY-005: Error 400 - Código TOTP inválido', async () => {
      const mockUser = {
        id: 'user-1',
        student: { qrCodeSecret: 'BASE32SECRET' },
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false); // Token inválido

      const req = mockRequest({ token: '000000' }, { id: 'user-1' });
      const res = mockResponse();

      await verifyTwoFactor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Código 2FA inválido o expirado',
      });
    });
  });
});
