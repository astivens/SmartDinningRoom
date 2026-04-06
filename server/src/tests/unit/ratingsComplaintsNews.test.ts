/**
 * ============================================================================
 * PRUEBAS UNITARIAS - ratingsController, complaintsController, newsController
 * ============================================================================
 */

import { Response } from 'express';
import { createRating, getRatings, getAverageRating } from '../../controllers/ratingsController';
import { createComplaint, getComplaints, respondComplaint } from '../../controllers/complaintsController';
import { getNews, getNewsById, createNews, updateNews, deleteNews } from '../../controllers/newsController';
import { Rating, Student, User, Complaint, News } from '../../models';
import { AuthRequest } from '../../middleware/auth';

jest.mock('../../models', () => ({
  Rating: { create: jest.fn(), findAll: jest.fn() },
  Student: { findOne: jest.fn() },
  User: { findByPk: jest.fn() },
  Complaint: { create: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn() },
  News: { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  ComplaintType: {},
}));

const mockResponse = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
};
const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user?: any): any => ({
  body, params, query, user,
});

describe('ratingsController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createRating', () => {
    it('TC-RAT-001: Calificación exitosa (1-5 estrellas)', async () => {
      (Student.findOne as jest.Mock).mockResolvedValue({ id: 'stu-1' });
      (Rating.create as jest.Mock).mockResolvedValue({ id: 'r1', stars: 5, comment: 'Excelente' });

      const req = mockRequest({ stars: 5, comment: 'Excelente' }, {}, {}, { id: 'user-1' });
      const res = mockResponse();

      await createRating(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('TC-RAT-002: Error 401 - No autenticado', async () => {
      const req = mockRequest({ stars: 4 }, {}, {}, undefined);
      const res = mockResponse();

      await createRating(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('TC-RAT-003: Error 404 - Estudiante no encontrado', async () => {
      (Student.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ stars: 4 }, {}, {}, { id: 'user-999' });
      const res = mockResponse();

      await createRating(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getRatings', () => {
    it('TC-RAT-GET-001: Obtener calificaciones con promedio', async () => {
      (Rating.findAll as jest.Mock).mockResolvedValue([
        { stars: 5 }, { stars: 4 }, { stars: 5 }, { stars: 3 },
      ]);

      const req = mockRequest({}, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await getRatings(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        averageRating: 4.3, // (5+4+5+3)/4 = 4.25 -> 4.3
        totalRatings: 4,
      }));
    });
  });

  describe('getAverageRating', () => {
    it('TC-AVG-001: Calcular distribución de estrellas', async () => {
      (Rating.findAll as jest.Mock).mockResolvedValue([
        { stars: 5 }, { stars: 5 }, { stars: 4 }, { stars: 3 }, { stars: 2 }, { stars: 1 },
      ]);

      const req = mockRequest();
      const res = mockResponse();

      await getAverageRating(req as any, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        averageRating: 3.3,
        totalRatings: 6,
        starsDistribution: { 5: 2, 4: 1, 3: 1, 2: 1, 1: 1 },
      }));
    });
  });
});

describe('complaintsController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createComplaint', () => {
    it('TC-COMP-001: Queja anónima creada exitosamente', async () => {
      (Complaint.create as jest.Mock).mockResolvedValue({
        id: 'c1', type: 'queja', content: 'Mala atención', isAnonymous: true,
      });

      const req = mockRequest({ type: 'queja', content: 'Mala atención', isAnonymous: true }, {}, {}, undefined);
      const res = mockResponse();

      await createComplaint(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        complaint: expect.objectContaining({ isAnonymous: true }),
      }));
    });

    it('TC-COMP-002: Queja identificada con studentId', async () => {
      (Student.findOne as jest.Mock).mockResolvedValue({ id: 'stu-1' });
      (Complaint.create as jest.Mock).mockResolvedValue({ id: 'c1', studentId: 'stu-1' });

      const req = mockRequest(
        { type: 'sugerencia', content: 'Mejorar el menú', isAnonymous: false },
        {}, {}, { id: 'user-1' }
      );
      const res = mockResponse();

      await createComplaint(req as AuthRequest, res as Response);

      expect(Complaint.create).toHaveBeenCalledWith(expect.objectContaining({
        studentId: 'stu-1',
        type: 'sugerencia',
      }));
    });
  });

  describe('getComplaints', () => {
    it('TC-COMP-GET-001: Obtener quejas con paginación', async () => {
      (Complaint.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 5,
        rows: [{ id: 'c1', type: 'queja' }],
      });

      const req = mockRequest({}, {}, { page: '1', limit: '10' }, { id: 'admin-1', role: 'admin' });
      const res = mockResponse();

      await getComplaints(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ total: 5 }));
    });
  });

  describe('respondComplaint', () => {
    it('TC-COMP-RESP-001: Respuesta a queja exitosa', async () => {
      const mockComplaint = {
        id: 'c1', update: jest.fn().mockResolvedValue(true),
      };
      (Complaint.findByPk as jest.Mock).mockResolvedValue(mockComplaint);

      const req = mockRequest({ response: 'Estamos trabajando en mejorar' }, { id: 'c1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await respondComplaint(req as AuthRequest, res as Response);

      expect(mockComplaint.update).toHaveBeenCalledWith(expect.objectContaining({
        response: 'Estamos trabajando en mejorar',
        respondedBy: 'admin-1',
        isResolved: true,
      }));
    });

    it('TC-COMP-RESP-002: Error 404 - Queja no encontrada', async () => {
      (Complaint.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({ response: 'Test' }, { id: 'c-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await respondComplaint(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

describe('newsController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getNews', () => {
    it('TC-NEWS-001: Obtener noticias activas', async () => {
      const mockNews = [{ id: 'n1', title: 'Noticia 1', isActive: true }];
      (News.findAll as jest.Mock).mockResolvedValue(mockNews);

      const req = mockRequest();
      const res = mockResponse();

      await getNews(req as AuthRequest, res as Response);

      expect(News.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
      }));
      expect(res.json).toHaveBeenCalledWith(mockNews);
    });
  });

  describe('getNewsById', () => {
    it('TC-NEWS-BY-ID-001: Obtener noticia por ID', async () => {
      (News.findByPk as jest.Mock).mockResolvedValue({ id: 'n1', title: 'Test' });

      const req = mockRequest({}, { id: 'n1' });
      const res = mockResponse();

      await getNewsById(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'n1' }));
    });

    it('TC-NEWS-BY-ID-002: Error 404 - Noticia no encontrada', async () => {
      (News.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'n-999' });
      const res = mockResponse();

      await getNewsById(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createNews', () => {
    it('TC-NEWS-CREATE-001: Creación exitosa', async () => {
      (News.create as jest.Mock).mockResolvedValue({ id: 'n1', title: 'Nueva', isActive: true });

      const req = mockRequest({ title: 'Nueva', content: 'Contenido' }, {}, {}, { id: 'admin-1' });
      const res = mockResponse();

      await createNews(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateNews', () => {
    it('TC-NEWS-UPDATE-001: Actualización exitosa', async () => {
      const mockNews = { id: 'n1', update: jest.fn().mockResolvedValue(true) };
      (News.findByPk as jest.Mock).mockResolvedValue(mockNews);

      const req = mockRequest({ title: 'Actualizado' }, { id: 'n1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await updateNews(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Noticia actualizada' }));
    });

    it('TC-NEWS-UPDATE-002: Error 404 - No encontrada', async () => {
      (News.findByPk as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { id: 'n-999' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await updateNews(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteNews', () => {
    it('TC-NEWS-DELETE-001: Soft delete exitoso', async () => {
      const mockNews = { id: 'n1', update: jest.fn().mockResolvedValue(true) };
      (News.findByPk as jest.Mock).mockResolvedValue(mockNews);

      const req = mockRequest({}, { id: 'n1' }, {}, { id: 'admin-1' });
      const res = mockResponse();

      await deleteNews(req as AuthRequest, res as Response);

      expect(mockNews.update).toHaveBeenCalledWith({ isActive: false });
      expect(res.json).toHaveBeenCalledWith({ message: 'Noticia eliminada' });
    });
  });
});
