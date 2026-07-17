// =====================================================
// 任务管理路由
// =====================================================

import { Router } from 'express';
import taskController from '../controllers/taskController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

// 统计数据
router.get('/stats', (req, res, next) => taskController.getStats(req, res, next));

// CRUD
router.post('/', (req, res, next) => taskController.create(req, res, next));
router.get('/', (req, res, next) => taskController.findAll(req, res, next));
router.get('/:id', (req, res, next) => taskController.findById(req, res, next));
router.put('/:id', (req, res, next) => taskController.update(req, res, next));
router.delete('/:id', (req, res, next) => taskController.delete(req, res, next));

// 快速切换状态
router.patch('/:id/toggle', (req, res, next) => taskController.toggleStatus(req, res, next));

export default router;
