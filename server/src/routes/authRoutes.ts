import { Router } from 'express';
import { login, register, refreshToken, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, setupTwoFactor, verifyTwoFactor } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/login', login);
router.post(
  '/register',
  upload.fields([
    { name: 'archivoSisben', maxCount: 1 },
    { name: 'cedulaFrontal', maxCount: 1 },
    { name: 'horarioPdf', maxCount: 1 },
    { name: 'reciboPago', maxCount: 1 }
  ]),
  register
);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/setup-2fa', authenticate, setupTwoFactor);
router.post('/verify-2fa', authenticate, verifyTwoFactor);

export default router;
