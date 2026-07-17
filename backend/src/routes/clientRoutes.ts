// =====================================================
// 客户管理路由
// =====================================================

import { Router } from 'express';
import clientController from '../controllers/clientController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 所有路由需要认证
router.use(authenticateToken);

// 客户 CRUD
router.post('/', (req, res, next) => clientController.create(req, res, next));
router.get('/', (req, res, next) => clientController.findAll(req, res, next));
router.get('/stats', (req, res, next) => clientController.getStats(req, res, next));
router.get('/:id', (req, res, next) => clientController.findById(req, res, next));
router.put('/:id', (req, res, next) => clientController.update(req, res, next));
router.delete('/:id', (req, res, next) => clientController.delete(req, res, next));

// 客户关联数据
router.get('/:id/matters', (req, res, next) => clientController.getClientMatters(req, res, next));

export default router;
