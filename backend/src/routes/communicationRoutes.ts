// =====================================================
// 沟通记录路由
// =====================================================

import { Router } from 'express';
import communicationController from '../controllers/communicationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

router.get('/stats', (req, res, next) => communicationController.getStats(req, res, next));
router.post('/', (req, res, next) => communicationController.create(req, res, next));
router.get('/', (req, res, next) => communicationController.findAll(req, res, next));
router.get('/:id', (req, res, next) => communicationController.findById(req, res, next));
router.put('/:id', (req, res, next) => communicationController.update(req, res, next));
router.delete('/:id', (req, res, next) => communicationController.delete(req, res, next));

export default router;
