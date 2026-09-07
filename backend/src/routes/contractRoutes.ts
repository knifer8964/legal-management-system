// =====================================================
// 合同管理路由
// =====================================================

import { Router } from 'express';
import contractController from '../controllers/contractController';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// 所有路由需要认证
router.use(authenticateToken);

// 特殊路由 (必须在 :id 之前)
router.get('/stats', (req, res, next) => contractController.getStats(req, res, next));

// CRUD
router.get('/', (req, res, next) => contractController.findAll(req, res, next));
router.post('/', checkPermission('contract:write'), (req, res, next) => contractController.create(req, res, next));
router.get('/:id', (req, res, next) => contractController.findById(req, res, next));
router.put('/:id', checkPermission('contract:write'), (req, res, next) => contractController.update(req, res, next));
router.delete('/:id', checkPermission('contract:delete'), (req, res, next) => contractController.delete(req, res, next));

// 状态流转与时间线
router.put('/:id/status', checkPermission('contract:write'), (req, res, next) => contractController.updateStatus(req, res, next));
router.get('/:id/timeline', (req, res, next) => contractController.getTimeline(req, res, next));

export default router;
