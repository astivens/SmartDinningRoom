import { Router } from 'express';
import {
  getSupervisors,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  toggleSupervisorStatus,
  getSupervisorLogs,
  generateInviteLink,
  joinWithInvite,
  assignStudentToSupervisor,
  removeStudentFromSupervisor,
  getSupervisorStudents
} from '../controllers/supervisorsController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.EXTERNAL_AUDITOR), getSupervisors);
router.get('/logs', authenticate, authorize(UserRole.ADMIN, UserRole.EXTERNAL_AUDITOR), getSupervisorLogs);
router.post('/', authenticate, authorize(UserRole.ADMIN), createSupervisor);
router.post('/invite', authenticate, authorize(UserRole.ADMIN), generateInviteLink);
router.post('/join', joinWithInvite);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateSupervisor);
router.patch('/:id/status', authenticate, authorize(UserRole.ADMIN), toggleSupervisorStatus);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteSupervisor);

router.post('/assignments', authenticate, authorize(UserRole.ADMIN), assignStudentToSupervisor);
router.get('/:supervisorId/students', authenticate, authorize(UserRole.ADMIN, UserRole.EXTERNAL_AUDITOR), getSupervisorStudents);
router.delete('/:supervisorId/students/:studentId', authenticate, authorize(UserRole.ADMIN), removeStudentFromSupervisor);

export default router;
