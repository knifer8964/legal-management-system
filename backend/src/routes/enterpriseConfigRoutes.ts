// =====================================================
// 企业客户配置路由 (虚拟法务部)
// =====================================================

import { Router } from 'express';
import enterpriseConfigController from '../controllers/enterpriseConfigController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// 所有路由需要认证
router.use(authenticateToken);

// 配置 CRUD
router.get('/clients/:clientId/enterprise-config', (req, res, next) => enterpriseConfigController.getByClient(req, res, next));
router.post('/clients/:clientId/enterprise-config', (req, res, next) => enterpriseConfigController.create(req, res, next));
router.put('/enterprise-configs/:id', (req, res, next) => enterpriseConfigController.update(req, res, next));
router.delete('/enterprise-configs/:id', (req, res, next) => enterpriseConfigController.remove(req, res, next));

// 成员管理
router.get('/clients/:clientId/enterprise-config/members', (req, res, next) => enterpriseConfigController.getMembers(req, res, next));
router.post('/clients/:clientId/enterprise-config/members', (req, res, next) => enterpriseConfigController.addMember(req, res, next));
router.delete('/clients/:clientId/enterprise-config/members/:index', (req, res, next) => enterpriseConfigController.removeMember(req, res, next));

export default router;
