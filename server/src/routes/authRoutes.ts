import { Router } from 'express';
import { login, register, refreshToken, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, setupTwoFactor, verifyTwoFactor } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/login', login);
router.post('/register', upload.single('archivoSisben'), register);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/setup-2fa', authenticate, setupTwoFactor);
router.post('/verify-2fa', authenticate, verifyTwoFactor);

export default router;
