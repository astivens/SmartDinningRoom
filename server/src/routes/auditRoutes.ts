import { Router } from 'express';
import { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AuditLog } from '../models';
import { UserRole } from '../models';
import { Op } from 'sequelize';

const router = Router();
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_STATUS_CODES = new Set(['200', '201', '204', '400', '401', '403', '404', '409', '422', '500']);
const ALLOWED_ROLES = new Set(['anonymous', 'student', 'supervisor', 'admin', 'external_auditor']);
const ALLOWED_PATH_FILTERS = new Set([
  '/api/auth',
  '/api/students',
  '/api/supervisors',
  '/api/meals',
  '/api/payments',
  '/api/complaints',
  '/api/news',
  '/api/ratings',
  '/api/audit',
  '/api/health',
]);

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.EXTERNAL_AUDITOR), async (req: AuthRequest, res: Response) => {
  try {
    const {
      action,
      method,
      statusCode,
      path,
      role,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (method && !ALLOWED_METHODS.has(String(method).toUpperCase())) {
      return res.status(400).json({ message: 'Método de filtro no permitido' });
    }
    if (statusCode && !ALLOWED_STATUS_CODES.has(String(statusCode))) {
      return res.status(400).json({ message: 'Código de estado de filtro no permitido' });
    }
    if (role && !ALLOWED_ROLES.has(String(role))) {
      return res.status(400).json({ message: 'Rol de filtro no permitido' });
    }
    if (path && !ALLOWED_PATH_FILTERS.has(String(path))) {
      return res.status(400).json({ message: 'Ruta de filtro no permitida' });
    }

    const andConditions: any[] = [];
    const where: any = {};
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (method) {
      where.action = { [Op.iLike]: `HTTP_${String(method).toUpperCase()}%` };
    }
    if (statusCode) {
      andConditions.push({ details: { [Op.iLike]: `%"statusCode":${String(statusCode)}%` } });
    }
    if (path) {
      andConditions.push({ details: { [Op.iLike]: `%"path":"%${String(path)}%"%` } });
    }
    if (role) {
      andConditions.push({ details: { [Op.iLike]: `%"role":"${String(role)}"%` } });
    }
    if (startDate || endDate) {
      const createdAt: any = {};
      if (startDate) createdAt[Op.gte] = new Date(`${String(startDate)}T00:00:00`);
      if (endDate) createdAt[Op.lte] = new Date(`${String(endDate)}T23:59:59`);
      where.createdAt = createdAt;
    }
    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({ logs: rows, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;
