import { Router } from 'express';
import { createPayment, verifyPayment, getPayments, uploadPaymentComprobante, calculateMeals } from '../controllers/paymentsController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../models';

const router = Router();

router.post('/', authenticate, createPayment);
router.post('/upload', authenticate, upload.single('comprobante'), uploadPaymentComprobante);
router.post('/calculate', authenticate, calculateMeals);
router.get('/', authenticate, getPayments);
router.patch('/:id/verify', authenticate, authorize(UserRole.ADMIN), verifyPayment);

export default router;
