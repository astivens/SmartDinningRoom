import { Router } from 'express';
import {
  createCycle,
  getAllCycles,
  getCycleById,
  closeCycle
} from '../controllers/cycleController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EXTERNAL_AUDITOR), getAllCycles);
router.get('/:id', authenticate, getCycleById);
router.post('/', authenticate, authorize(UserRole.ADMIN), createCycle);
router.patch('/:id/close', authenticate, authorize(UserRole.ADMIN), closeCycle);

export default router;
