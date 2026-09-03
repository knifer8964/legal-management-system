// =====================================================
// 文档管理路由 (M9)
// =====================================================

import { Router } from 'express';
import documentController from '../controllers/documentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// 特殊操作 (必须在 :id 之前)
router.get('/stats', (req, res, next) => documentController.getStats(req, res, next));

// CRUD
router.get('/', (req, res, next) => documentController.findAll(req, res, next));
router.post('/', (req, res, next) => documentController.create(req, res, next));
router.get('/:id', (req, res, next) => documentController.findById(req, res, next));
router.put('/:id', (req, res, next) => documentController.update(req, res, next));
router.delete('/:id', (req, res, next) => documentController.delete(req, res, next));

export default router;
