import { Router } from 'express';
import { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AuditLog } from '../models';
import { UserRole } from '../models';
import { Op } from 'sequelize';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (action) where.action = { [Op.iLike]: `%${action}%` };

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
