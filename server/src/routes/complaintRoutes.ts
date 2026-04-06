import { Router } from 'express';
import { createComplaint, getComplaints, respondComplaint } from '../controllers/complaintsController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.post('/', optionalAuth, createComplaint);
router.get('/', authenticate, authorize(UserRole.ADMIN), getComplaints);
router.post('/:id/respond', authenticate, authorize(UserRole.ADMIN), respondComplaint);

export default router;
