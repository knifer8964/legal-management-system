// =====================================================
// 业务事项路由
// =====================================================

import { Router } from 'express';
import matterController from '../controllers/matterController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 所有路由需要认证
router.use(authenticateToken);

// 统计 (必须在 :id 之前)
router.get('/stats', (req, res, next) => matterController.getStats(req, res, next));

// 按编号查找
router.get('/no/:no', (req, res, next) => matterController.findByNo(req, res, next));

// CRUD
router.post('/', (req, res, next) => matterController.create(req, res, next));
router.get('/', (req, res, next) => matterController.findAll(req, res, next));
router.get('/:id', (req, res, next) => matterController.findById(req, res, next));
router.put('/:id', (req, res, next) => matterController.update(req, res, next));
router.delete('/:id', (req, res, next) => matterController.delete(req, res, next));

// 状态更新
router.patch('/:id/status', (req, res, next) => matterController.updateStatus(req, res, next));

// 时间线
router.get('/:id/timeline', (req, res, next) => matterController.getTimeline(req, res, next));

export default router;
