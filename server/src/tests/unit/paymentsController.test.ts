/**
 * ============================================================================
 * PRUEBAS UNITARIAS - paymentsController
 * ============================================================================
 * 
 * Técnicas de prueba aplicadas:
 * - CAJA BLANCA: Grafo de flujo, cobertura de caminos
 * - CAJA NEGRA: Clases de equivalencia
 * - VALORES LÍMITE: Monto mínimo ($2000 = 1 almuerzo), cálculos de división entera
 * - CAMINO BÁSICO: Cobertura de caminos
 * 
 * Regla del negocio: 2000 pesos = 1 almuerzo
 * ============================================================================
 */

import { Response } from 'express';
import {
  createPayment, verifyPayment, getPayments,
  uploadPaymentComprobante, calculateMeals
} from '../../controllers/paymentsController';
import { Payment, Student, User } from '../../models';
import { AuthRequest } from '../../middleware/auth';

jest.mock('../../models', () => ({
  Payment: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Student: { findByPk: jest.fn(), findOne: jest.fn() },
  User: { findByPk: jest.fn() },
  UserRole: { STUDENT: 'student' },
}));

const mockResponse = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
};

const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user?: any, file?: any): any => ({
  body, params, query, user, file,
});

describe('paymentsController', () => {
  beforeEach(() => jest.clearAllMocks());

  // =========================================================================
  // MÉTODO: createPayment
  // =========================================================================
  /**
   * Grafo de flujo createPayment:
   * [N1] Inicio -> Obtener studentId, amount, comprobantePath
   *  |
   * [N2] Buscar Student por id
   *  |
   * --[N3]-- No existe -> 404 "Estudiante no encontrado"
   * |        |
   * [N4]    return
   *  |
   * [N5] Calcular mealsIncluded = floor(amount / 2000)
   *  |
   * [N6] Crear Payment (isVerified=false, mealsUsed=0)
   *  |
   * [N7] Return 201 con payment y mealsIncluded
   */

  describe('createPayment', () => {
    // ==================== VALORES LÍMITE ====================
    describe('Valores Límite - Monto mínimo de 2000 (1 almuerzo)', () => {
      it('VL-MONTO-001: Monto exactamente 2000 = 1 almuerzo', async () => {
        const mockStudent = { id: 's1' };
        (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
        (Payment.create as jest.Mock).mockResolvedValue({
          id: 'p1', studentId: 's1', amount: 2000, mealsIncluded: 1, mealsUsed: 0, isVerified: false,
        });

        const req = mockRequest({ studentId: 's1', amount: 2000 });
        const res = mockResponse();

        await createPayment(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mealsIncluded: 1 }));
      });

      it('VL-MONTO-002: Monto 1999 = 0 almuerzos (debajo del mínimo)', async () => {
        const mockStudent = { id: 's1' };
        (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
        (Payment.create as jest.Mock).mockResolvedValue({
          id: 'p1', studentId: 's1', amount: 1999, mealsIncluded: 0, mealsUsed: 0, isVerified: false,
        });

        const req = mockRequest({ studentId: 's1', amount: 1999 });
        const res = mockResponse();

        await createPayment(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mealsIncluded: 0 }));
      });

      it('VL-MONTO-003: Monto 10000 = 5 almuerzos', async () => {
        const mockStudent = { id: 's1' };
        (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
        (Payment.create as jest.Mock).mockResolvedValue({
          id: 'p1', amount: 10000, mealsIncluded: 5,
        });

        const req = mockRequest({ studentId: 's1', amount: 10000 });
        const res = mockResponse();

        await createPayment(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mealsIncluded: 5 }));
      });

      it('VL-MONTO-004: Monto con residuo 4500 = 2 almuerzos (residuo 500)', async () => {
        const mockStudent = { id: 's1' };
        (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
        (Payment.create as jest.Mock).mockResolvedValue({});

        const req = mockRequest({ studentId: 's1', amount: 4500 });
        const res = mockResponse();

        await createPayment(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mealsIncluded: 2 }));
      });
    });

    // ==================== CAJA NEGRA ====================
    describe('Caja Negra - Clases de Equivalencia', () => {
      it('TC-PAY-001: Pago exitoso con studentId válido y monto positivo', async () => {
        (Student.findByPk as jest.Mock).mockResolvedValue({ id: 's1' });
        (Payment.create as jest.Mock).mockResolvedValue({
          id: 'p1', studentId: 's1', amount: 20000, mealsIncluded: 10, mealsUsed: 0, isVerified: false,
        });

        const req = mockRequest({
          studentId: 's1',
          amount: 20000,
          comprobantePath: 'uploads/recibo.pdf',
        });
        const res = mockResponse();

        await createPayment(req as AuthRequest, res as Response);

        expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
          studentId: 's1',
          amount: 20000,
          mealsIncluded: 10,
          mealsUsed: 0,
          isVerified: false,
        }));
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('TC-PAY-002: Error 404 - Estudiante no encontrado', async () => {
        (Student.findByPk as jest.Mock).mockResolvedValue(null);

        const req = mockRequest({ studentId: 's-999', amount: 2000 });
        const res = mockResponse();

        await createPayment(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Estudiante no encontrado' });
      });
    });
  });

  // =========================================================================
  // MÉTODO: verifyPayment
  // =========================================================================
  describe('verifyPayment', () => {
    it('TC-VERIFY-001: Verificación exitosa por administrador', async () => {
      const mockPayment = {
        id: 'p1', isVerified: false,
        update: jest.fn().mockResolvedValue(true),
      };
      (Payment.findByPk as jest.Mock).mockResolvedValue(mockPayment);

      const req = mockRequest({}, { id: 'p1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await verifyPayment(req as AuthRequest, res as Response);

      expect(mockPayment.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
        isVerified: true,
        verifiedBy: 'admin-1',
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Pago verificado' }));
    });

    it('TC-VERIFY-002: Error 404 - Pago no encontrado', async () => {
      (Payment.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'p-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await verifyPayment(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // =========================================================================
  // MÉTODO: getPayments
  // =========================================================================
  describe('getPayments', () => {
    /**
     * Grafo de flujo:
     * [N1] Inicio -> Obtener query params (studentId, isVerified, page, limit)
     *  |
     * [N2] Construir where condicional
     *  |
     * [N3] Ejecutar findAndCountAll con include Student->User
     *  |
     * [N4] Retornar 200 con paginación
     */

    it('TC-GET-PAY-001: Obtener pagos con paginación', async () => {
      (Payment.findAndCountAll as any) = jest.fn().mockResolvedValue({
        count: 15,
        rows: [{ id: 'p1', amount: 5000 }],
      });

      const req = mockRequest({}, {}, { page: '1', limit: '10' }, { id: 'admin-1' });
      const res = mockResponse();

      await getPayments(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        total: 15,
        page: 1,
        totalPages: 2,
      }));
    });

    it('TC-GET-PAY-002: Filtrar por studentId', async () => {
      (Payment.findAndCountAll as any) = jest.fn().mockResolvedValue({ count: 2, rows: [] });

      const req = mockRequest({}, {}, { studentId: 's1' }, { id: 'admin-1' });
      const res = mockResponse();

      await getPayments(req as AuthRequest, res as Response);

      expect(Payment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ studentId: 's1' }) })
      );
    });

    it('TC-GET-PAY-003: Filtrar por isVerified=true', async () => {
      (Payment.findAndCountAll as any) = jest.fn().mockResolvedValue({ count: 1, rows: [] });

      const req = mockRequest({}, {}, { isVerified: 'true' }, { id: 'admin-1' });
      const res = mockResponse();

      await getPayments(req as AuthRequest, res as Response);

      expect(Payment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isVerified: true }) })
      );
    });
  });

  // =========================================================================
  // MÉTODO: uploadPaymentComprobante
  // =========================================================================
  describe('uploadPaymentComprobante', () => {
    it('TC-UPLOAD-001: Subida exitosa de comprobante', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'user-1', email: 'test@test.com', role: 'student',
      });
      (Student.findOne as jest.Mock).mockResolvedValue({ id: 's1' });
      (Payment.create as jest.Mock).mockResolvedValue({ id: 'p1' });

      const mockFile = { path: 'uploads/recibo123.pdf' };
      const req = mockRequest(
        { studentId: 's1', amount: '10000' },
        {}, {}, { id: 'user-1' }, mockFile
      );
      const res = mockResponse();

      await uploadPaymentComprobante(req as AuthRequest, res as Response);

      expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
        studentId: 's1',
        amount: 10000,
        mealsIncluded: 5, // 10000 / 2000
        comprobantePath: 'uploads/recibo123.pdf',
        isVerified: false,
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('TC-UPLOAD-002: Error 400 - No se envió archivo', async () => {
      const req = mockRequest({ studentId: 's1', amount: '10000' }, {}, {}, { id: 'user-1' }, undefined);
      const res = mockResponse();

      await uploadPaymentComprobante(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Archivo requerido' });
    });
  });

  // =========================================================================
  // MÉTODO: calculateMeals
  // =========================================================================
  /**
   * Grafo de flujo calculateMeals:
   * [N1] Inicio -> Obtener amount
   *  |
   * --[N2]-- amount < 2000 -> 400 "Monto mínimo: $2000"
   * |        |
   * [N3]    return
   *  |
   * [N4] Calcular meals = floor(amount / 2000)
   *  |
   * [N5] Calcular remaining = amount % 2000
   *  |
   * [N6] Return 200 con amount, mealsIncluded, remaining
   */

  describe('calculateMeals', () => {
    // ==================== VALORES LÍMITE ====================
    describe('Valores Límite - Cálculo de almuerzos', () => {
      it('VL-CALC-001: Monto exactamente 2000 = 1 almuerzo, 0 restante', async () => {
        const req = mockRequest({ amount: 2000 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith({
          amount: 2000,
          mealsIncluded: 1,
          remaining: 0,
        });
      });

      it('VL-CALC-002: Monto 1999 = error 400 (debajo del mínimo)', async () => {
        const req = mockRequest({ amount: 1999 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Monto mínimo: $2000' });
      });

      it('VL-CALC-003: Monto 3999 = 1 almuerzo, 1999 restante', async () => {
        const req = mockRequest({ amount: 3999 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith({
          amount: 3999,
          mealsIncluded: 1,
          remaining: 1999,
        });
      });

      it('VL-CALC-004: Monto 4000 = 2 almuerzos, 0 restante', async () => {
        const req = mockRequest({ amount: 4000 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith({
          amount: 4000,
          mealsIncluded: 2,
          remaining: 0,
        });
      });

      it('VL-CALC-005: Monto 10000 = 5 almuerzos (ejemplo del documento)', async () => {
        const req = mockRequest({ amount: 10000 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith({
          amount: 10000,
          mealsIncluded: 5,
          remaining: 0,
        });
      });

      it('VL-CALC-006: Monto 24000 = 12 almuerzos (monto grande)', async () => {
        const req = mockRequest({ amount: 24000 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith({
          amount: 24000,
          mealsIncluded: 12,
          remaining: 0,
        });
      });

      it('VL-CALC-007: Monto negativo o cero = error 400', async () => {
        const req = mockRequest({ amount: 0 });
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });

      it('VL-CALC-008: Sin amount = error 400', async () => {
        const req = mockRequest({});
        const res = mockResponse();

        await calculateMeals(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });
});
