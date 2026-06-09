import { Router } from 'express';
import { createPayment, verifyPayment, getPayments, uploadPaymentComprobante, calculateMeals } from '../controllers/paymentsController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../models';

const router = Router();

router.post('/', authenticate, createPayment);
router.post(
  '/upload',
  authenticate,
  upload.fields([
    { name: 'comprobante', maxCount: 1 },
    { name: 'universityReceipt', maxCount: 1 },
    { name: 'bankReceipt', maxCount: 1 }
  ]),
  uploadPaymentComprobante
);
router.post('/calculate', authenticate, calculateMeals);
router.get('/', authenticate, getPayments);
router.patch('/:id/verify', authenticate, authorize(UserRole.ADMIN), verifyPayment);

export default router;
