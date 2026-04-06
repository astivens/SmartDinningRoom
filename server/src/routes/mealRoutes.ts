import { Router } from 'express';
import { registerMeal, getMealHistory, getTodayAttendance } from '../controllers/mealsController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.post('/', authenticate, authorize(UserRole.SUPERVISOR), registerMeal);
router.get('/history', authenticate, getMealHistory);
router.get('/today', authenticate, authorize(UserRole.ADMIN, UserRole.SUPERVISOR), getTodayAttendance);

export default router;
