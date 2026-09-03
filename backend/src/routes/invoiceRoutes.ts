// =====================================================
// 发票管理路由 (M8)
// =====================================================

import { Router } from 'express';
import invoiceController from '../controllers/invoiceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// 特殊操作 (必须在 :id 之前)
router.get('/stats', (req, res, next) => invoiceController.getStats(req, res, next));

// 关联计时记录
router.post('/:id/link-time-entries', (req, res, next) => invoiceController.linkTimeEntries(req, res, next));

// 记录支付
router.post('/:id/payment', (req, res, next) => invoiceController.recordPayment(req, res, next));

// CRUD
router.get('/', (req, res, next) => invoiceController.findAll(req, res, next));
router.post('/', (req, res, next) => invoiceController.create(req, res, next));
router.get('/:id', (req, res, next) => invoiceController.findById(req, res, next));
router.put('/:id', (req, res, next) => invoiceController.update(req, res, next));
router.delete('/:id', (req, res, next) => invoiceController.delete(req, res, next));

export default router;
