import { Router } from 'express';
import { getSummary } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/summary', (req, res, next) => getSummary(req, res, next));

export default router;
