// =====================================================
// 计时收费路由
// =====================================================

import { Router } from 'express';
import timeEntryController from '../controllers/timeEntryController';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// 特殊操作 (必须在 :id 之前)
router.get('/running', (req, res, next) => timeEntryController.getRunning(req, res, next));
router.post('/start', checkPermission('time:write'), (req, res, next) => timeEntryController.start(req, res, next));
router.post('/manual', checkPermission('time:write'), (req, res, next) => timeEntryController.createManual(req, res, next));
router.get('/stats', (req, res, next) => timeEntryController.getStats(req, res, next));

// 停止计时
router.patch('/:id/stop', checkPermission('time:write'), (req, res, next) => timeEntryController.stop(req, res, next));

// CRUD
router.get('/', (req, res, next) => timeEntryController.findAll(req, res, next));
router.get('/:id', (req, res, next) => timeEntryController.findById(req, res, next));
router.put('/:id', checkPermission('time:write'), (req, res, next) => timeEntryController.update(req, res, next));
router.delete('/:id', checkPermission('time:delete'), (req, res, next) => timeEntryController.delete(req, res, next));

export default router;
