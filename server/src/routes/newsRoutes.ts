import { Router } from 'express';
import { getNews, getNewsById, createNews, updateNews, deleteNews } from '../controllers/newsController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.get('/', optionalAuth, getNews);
router.get('/:id', optionalAuth, getNewsById);
router.post('/', authenticate, authorize(UserRole.ADMIN), createNews);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateNews);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteNews);

export default router;
