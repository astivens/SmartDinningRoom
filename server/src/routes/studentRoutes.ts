import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudentsFromExcel,
  searchStudents,
  getAvailableMeals,
  validateSisben
} from '../controllers/studentsController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserRole } from '../models';

const router = Router();

router.get('/', authenticate, authorize(UserRole.ADMIN, UserRole.SUPERVISOR), getStudents);
router.get('/search', authenticate, authorize(UserRole.SUPERVISOR), searchStudents);
router.get('/:id', authenticate, getStudentById);
router.get('/:id/available-meals', authenticate, getAvailableMeals);
router.post('/', authenticate, authorize(UserRole.ADMIN), createStudent);
router.post('/import', authenticate, authorize(UserRole.ADMIN), upload.single('file'), importStudentsFromExcel);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), updateStudent);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), deleteStudent);
router.post('/:id/validate-sisben', authenticate, authorize(UserRole.ADMIN), validateSisben);

export default router;
