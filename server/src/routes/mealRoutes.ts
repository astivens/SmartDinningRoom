import { Router } from 'express';
import { registerMeal, getMealHistory, getTodayAttendance, getDashboardAnalytics } from '../controllers/mealsController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.post('/', authenticate, authorize(UserRole.SUPERVISOR), registerMeal);
router.get('/history', authenticate, getMealHistory);
router.get('/today', authenticate, authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EXTERNAL_AUDITOR), getTodayAttendance);
router.get('/analytics', authenticate, authorize(UserRole.ADMIN, UserRole.EXTERNAL_AUDITOR), getDashboardAnalytics);

export default router;
