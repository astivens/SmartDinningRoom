/**
 * ============================================================================
 * PRUEBAS UNITARIAS - middleware/auth.ts
 * ============================================================================
 * 
 * Técnicas de prueba aplicadas:
 * - CAJA BLANCA: Grafo de flujo
 * - CAJA NEGRA: Clases de equivalencia para tokens
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, optionalAuth, AuthRequest } from '../../middleware/auth';
import { User, UserRole } from '../../models';

jest.mock('../../models', () => ({
  User: { findByPk: jest.fn() },
  UserRole: {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    STUDENT: 'student',
  },
}));

describe('middleware/auth', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  // =========================================================================
  // MIDDLEWARE: authenticate
  // =========================================================================
  /**
   * Grafo de flujo authenticate:
   * [N1] Inicio -> Verificar header Authorization
   *  |
   * --[N2]-- No existe o no empieza con Bearer -> 401 "No token provided"
   * |        |
   * [N3]    return
   *  |
   * [N4] Extraer token
   *  |
   * [N5] Verificar JWT
   *  |
   * --[N6]-- Token inválido -> 401 "Invalid token"
   * |        |
   * [N7]    return
   *  |
   * [N8] Buscar usuario por decoded.id
   *  |
   * --[N9]-- No existe o inactivo -> 401 "Invalid token"
   * |        |
   * [N10]   return
   *  |
   * [N11] Asignar req.user
   *  |
   * [N12] next()
   */

  describe('authenticate', () => {
    it('TC-AUTH-MW-001: Token válido -> next() llamado', async () => {
      const mockUser = { id: 'user-1', email: 'test@test.com', role: 'student', isActive: true };
      mockReq.headers = { authorization: 'Bearer valid.jwt.token' };

      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1', email: 'test@test.com', role: 'student' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({ id: 'user-1', email: 'test@test.com', role: 'student' });
    });

    it('TC-AUTH-MW-002: Sin header Authorization -> 401', async () => {
      mockReq.headers = {};

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('TC-AUTH-MW-003: Header sin Bearer -> 401', async () => {
      mockReq.headers = { authorization: 'Basic abc123' };

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('TC-AUTH-MW-004: Token JWT inválido -> 401', async () => {
      mockReq.headers = { authorization: 'Bearer invalid.token' };
      jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('jwt malformed'); });

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('TC-AUTH-MW-005: Usuario no encontrado en BD -> 401', async () => {
      mockReq.headers = { authorization: 'Bearer valid.jwt.token' };
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-999' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('TC-AUTH-MW-006: Usuario inactivo -> 401', async () => {
      mockReq.headers = { authorization: 'Bearer valid.jwt.token' };
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue({ id: 'user-1', isActive: false });

      await authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  // =========================================================================
  // MIDDLEWARE: authorize
  // =========================================================================
  /**
   * Grafo de flujo authorize:
   * [N1] Inicio -> Verificar req.user existe
   *  |
   * --[N2]-- No existe -> 401 "Not authenticated"
   * |        |
   * [N3]    return
   *  |
   * [N4] Verificar req.user.role está en roles[]
   *  |
   * --[N5]-- No autorizado -> 403 "Not authorized"
   * |        |
   * [N6]    return
   *  |
   * [N7] next()
   */

  describe('authorize', () => {
    it('TC-AUTHZ-001: Rol permitido -> next() llamado', () => {
      mockReq.user = { id: 'user-1', email: 'test@test.com', role: UserRole.ADMIN };

      const middleware = authorize(UserRole.ADMIN, UserRole.SUPERVISOR);
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('TC-AUTHZ-002: Sin req.user -> 401', () => {
      mockReq.user = undefined;

      const middleware = authorize(UserRole.ADMIN);
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    });

    it('TC-AUTHZ-003: Rol no permitido -> 403', () => {
      mockReq.user = { id: 'user-1', email: 'test@test.com', role: UserRole.STUDENT };

      const middleware = authorize(UserRole.ADMIN);
      middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });

    it('TC-AUTHZ-004: Solo ADMIN puede acceder a rutas de admin', () => {
      mockReq.user = { id: 'user-1', email: 'sup@test.com', role: UserRole.SUPERVISOR };

      const adminOnly = authorize(UserRole.ADMIN);
      adminOnly(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('TC-AUTHZ-005: ADMIN o SUPERVISOR pueden acceder', () => {
      mockReq.user = { id: 'user-1', email: 'sup@test.com', role: UserRole.SUPERVISOR };

      const adminOrSup = authorize(UserRole.ADMIN, UserRole.SUPERVISOR);
      adminOrSup(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // MIDDLEWARE: optionalAuth
  // =========================================================================
  /**
   * Grafo de flujo optionalAuth:
   * [N1] Inicio -> Verificar header Authorization
   *  |
   * --[N2]-- No existe -> next() (sin autenticar, pero permite continuar)
   * |        |
   * [N3]    next()
   *  |
   * [N4] Extraer token y verificar JWT
   *  |
   * --[N5]-- Token inválido -> next() (ignora error)
   * |        |
   * [N6]    next()
   *  |
   * [N7] Buscar usuario
   *  |
   * --[N8]-- Existe y activo -> Asignar req.user
   *  |
   * [N9] next()
   */

  describe('optionalAuth', () => {
    it('TC-OPT-001: Sin token -> next() sin error', async () => {
      mockReq.headers = {};

      await optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('TC-OPT-002: Token válido -> req.user asignado', async () => {
      mockReq.headers = { authorization: 'Bearer valid.jwt.token' };
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'user-1', email: 'test@test.com', role: 'student', isActive: true,
      });

      await optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual({ id: 'user-1', email: 'test@test.com', role: 'student' });
    });

    it('TC-OPT-003: Token inválido -> next() sin error (swallow)', async () => {
      mockReq.headers = { authorization: 'Bearer bad.token' };
      jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('invalid'); });

      await optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled(); // Continúa sin autenticación
      expect(mockReq.user).toBeUndefined();
    });

    it('TC-OPT-004: Token válido pero usuario inactivo -> next() sin asignar user', async () => {
      mockReq.headers = { authorization: 'Bearer valid.jwt.token' };
      jest.spyOn(jwt, 'verify').mockReturnValue({ id: 'user-1' } as any);
      (User.findByPk as jest.Mock).mockResolvedValue({ id: 'user-1', isActive: false });

      await optionalAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });
});
