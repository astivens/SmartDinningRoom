import { Router } from 'express';
import { createRating, getRatings, getAverageRating } from '../controllers/ratingsController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();

router.post('/', authenticate, createRating);
router.get('/', optionalAuth, getRatings);
router.get('/average', getAverageRating);

export default router;
