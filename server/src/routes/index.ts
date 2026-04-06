import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import supervisorRoutes from './supervisorRoutes';
import mealRoutes from './mealRoutes';
import paymentRoutes from './paymentRoutes';
import ratingRoutes from './ratingRoutes';
import complaintRoutes from './complaintRoutes';
import newsRoutes from './newsRoutes';
import auditRoutes from './auditRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/supervisors', supervisorRoutes);
router.use('/meals', mealRoutes);
router.use('/payments', paymentRoutes);
router.use('/ratings', ratingRoutes);
router.use('/complaints', complaintRoutes);
router.use('/news', newsRoutes);
router.use('/audit', auditRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
