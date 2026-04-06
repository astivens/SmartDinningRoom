/**
 * ============================================================================
 * PRUEBAS UNITARIAS - supervisorsController
 * ============================================================================
 */

import { Response } from 'express';
import {
  getSupervisors, createSupervisor, updateSupervisor, deleteSupervisor,
  toggleSupervisorStatus, generateInviteLink, joinWithInvite,
  assignStudentToSupervisor, removeStudentFromSupervisor,
  getSupervisorStudents, getSupervisorLogs
} from '../../controllers/supervisorsController';
import { User, Student, SupervisorAssignment, SupervisorLog, UserRole } from '../../models';
import { AuthRequest } from '../../middleware/auth';
import jwt from 'jsonwebtoken';

jest.mock('../../models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn() },
  Student: { findByPk: jest.fn() },
  SupervisorAssignment: { findOrCreate: jest.fn(), destroy: jest.fn(), findAll: jest.fn() },
  SupervisorLog: { findAndCountAll: jest.fn() },
  UserRole: { SUPERVISOR: 'supervisor' },
}));

jest.mock('../../services/auditService', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('jsonwebtoken');

const mockResponse = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
};
const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user?: any): any => ({
  body, params, query, user,
});

describe('supervisorsController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getSupervisors', () => {
    it('TC-SUP-001: Obtener lista de supervisores', async () => {
      const mockSupervisors = [{ id: 's1', email: 'sup@test.com', role: 'supervisor' }];
      (User.findAll as jest.Mock).mockResolvedValue(mockSupervisors);

      const req = mockRequest({}, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await getSupervisors(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(mockSupervisors);
    });
  });

  describe('createSupervisor', () => {
    it('TC-SUP-CREATE-001: Creación exitosa con contraseña temporal', async () => {
      const mockSupervisor = { id: 's1', email: 'nuevo@test.com', name: 'Carlos', lastName: 'Lopez' };
      (User.create as jest.Mock).mockResolvedValue(mockSupervisor);

      const req = mockRequest({ email: 'nuevo@test.com', name: 'Carlos', lastName: 'Lopez' }, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
      const res = mockResponse();

      await createSupervisor(req as AuthRequest, res as Response);

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        role: 'supervisor',
        isActive: true,
        isAuthorized: false, // Requiere autorización del admin
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        temporaryPassword: expect.any(String),
      }));
    });

    it('TC-SUP-CREATE-002: Error 400 - Email duplicado', async () => {
      (User.create as jest.Mock).mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });

      const req = mockRequest({ email: 'existe@test.com', name: 'C', lastName: 'L' }, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await createSupervisor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'El correo ya está registrado' });
    });
  });

  describe('updateSupervisor', () => {
    it('TC-SUP-UPDATE-001: Actualización exitosa', async () => {
      const mockSupervisor = { id: 's1', role: 'supervisor', update: jest.fn().mockResolvedValue(true) };
      (User.findByPk as jest.Mock).mockResolvedValue(mockSupervisor);

      const req = mockRequest({ name: 'Nuevo' }, { id: 's1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await updateSupervisor(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ message: 'Supervisor actualizado' });
    });

    it('TC-SUP-UPDATE-002: Error 404 - Supervisor no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 's-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await updateSupervisor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteSupervisor', () => {
    it('TC-SUP-DELETE-001: Deshabilitación exitosa', async () => {
      const mockSupervisor = { id: 's1', role: 'supervisor', update: jest.fn().mockResolvedValue(true) };
      (User.findByPk as jest.Mock).mockResolvedValue(mockSupervisor);

      const req = mockRequest({}, { id: 's1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await deleteSupervisor(req as AuthRequest, res as Response);

      expect(mockSupervisor.update).toHaveBeenCalledWith({ isActive: false });
      expect(res.json).toHaveBeenCalledWith({ message: 'Supervisor deshabilitado' });
    });
  });

  describe('toggleSupervisorStatus', () => {
    it('TC-SUP-TOGGLE-001: Cambiar estado activo/autorizado', async () => {
      const mockSupervisor = { id: 's1', role: 'supervisor', update: jest.fn().mockResolvedValue(true) };
      (User.findByPk as jest.Mock).mockResolvedValue(mockSupervisor);

      const req = mockRequest({ isActive: true, isAuthorized: true }, { id: 's1' }, {}, { id: 'admin-1', email: 'admin@test.com' });
      const res = mockResponse();

      await toggleSupervisorStatus(req as AuthRequest, res as Response);

      expect(mockSupervisor.update).toHaveBeenCalledWith({ isActive: true, isAuthorized: true });
      expect(res.json).toHaveBeenCalledWith({ message: 'Estado actualizado' });
    });
  });

  describe('generateInviteLink', () => {
    it('TC-INVITE-001: Generar link de invitación válido por 48h', async () => {
      (jwt.sign as jest.Mock).mockReturnValue('mock-invite-token');

      const req = mockRequest({}, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await generateInviteLink(req as AuthRequest, res as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'supervisor', type: 'invite' }),
        expect.any(String),
        expect.objectContaining({ expiresIn: '48h' })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        expiresIn: '48 horas',
      }));
    });
  });

  describe('joinWithInvite', () => {
    it('TC-JOIN-001: Registro con invitación exitoso', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ role: 'supervisor', type: 'invite' });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({ id: 's1', email: 'new@test.com', name: 'Juan', lastName: 'P' });

      const req = mockRequest({
        token: 'valid-token', email: 'new@test.com', name: 'Juan', lastName: 'P', password: 'pass1234',
      });
      const res = mockResponse();

      await joinWithInvite(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('TC-JOIN-002: Error 400 - Campos faltantes', async () => {
      const req = mockRequest({ token: 't', email: 'e@test.com' }); // Falta name, lastName, password
      const res = mockResponse();

      await joinWithInvite(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-JOIN-003: Error 400 - Token inválido', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

      const req = mockRequest({ token: 'bad', email: 'e@test.com', name: 'N', lastName: 'L', password: 'pass1234' });
      const res = mockResponse();

      await joinWithInvite(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-JOIN-004: Error 400 - Email ya registrado', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ role: 'supervisor', type: 'invite' });
      (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing' });

      const req = mockRequest({ token: 't', email: 'existe@test.com', name: 'N', lastName: 'L', password: 'pass1234' });
      const res = mockResponse();

      await joinWithInvite(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('assignStudentToSupervisor', () => {
    it('TC-ASSIGN-001: Asignación exitosa', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({ id: 'sup-1', role: 'supervisor' });
      (Student.findByPk as jest.Mock).mockResolvedValue({ id: 'stu-1' });
      (SupervisorAssignment.findOrCreate as jest.Mock).mockResolvedValue([{ id: 'a1' }, true]);

      const req = mockRequest({ supervisorId: 'sup-1', studentId: 'stu-1' }, {}, {}, { id: 'admin-1', email: 'admin@test.com' });
      const res = mockResponse();

      await assignStudentToSupervisor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('TC-ASSIGN-002: Error 400 - Ya asignado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({ id: 'sup-1', role: 'supervisor' });
      (Student.findByPk as jest.Mock).mockResolvedValue({ id: 'stu-1' });
      (SupervisorAssignment.findOrCreate as jest.Mock).mockResolvedValue([{ id: 'a1' }, false]); // No created

      const req = mockRequest({ supervisorId: 'sup-1', studentId: 'stu-1' }, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await assignStudentToSupervisor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('TC-ASSIGN-003: Error 404 - Supervisor no encontrado', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ supervisorId: 'sup-999', studentId: 'stu-1' }, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await assignStudentToSupervisor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('removeStudentFromSupervisor', () => {
    it('TC-REMOVE-001: Eliminación exitosa', async () => {
      (SupervisorAssignment.destroy as jest.Mock).mockResolvedValue(1);

      const req = mockRequest({}, { supervisorId: 'sup-1', studentId: 'stu-1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await removeStudentFromSupervisor(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ message: 'Asignación eliminada' });
    });

    it('TC-REMOVE-002: Error 404 - Asignación no encontrada', async () => {
      (SupervisorAssignment.destroy as jest.Mock).mockResolvedValue(0);

      const req = mockRequest({}, { supervisorId: 'sup-1', studentId: 'stu-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await removeStudentFromSupervisor(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getSupervisorStudents', () => {
    it('TC-SUP-STU-001: Obtener estudiantes asignados', async () => {
      const mockAssignments = [{ id: 'a1', student: { id: 'stu-1', user: { name: 'Juan' } } }];
      (SupervisorAssignment.findAll as jest.Mock).mockResolvedValue(mockAssignments);

      const req = mockRequest({}, { supervisorId: 'sup-1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await getSupervisorStudents(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(mockAssignments);
    });
  });

  describe('getSupervisorLogs', () => {
    it('TC-LOGS-001: Obtener logs con paginación', async () => {
      (SupervisorLog.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 25,
        rows: [{ id: 'l1', action: 'Registro de almuerzo' }],
      });

      const req = mockRequest({}, {}, { page: '1', limit: '50' }, { id: 'admin-1' });
      const res = mockResponse();

      await getSupervisorLogs(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        total: 25,
        totalPages: 1,
      }));
    });
  });
});
