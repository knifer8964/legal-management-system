import { Router } from 'express';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';
import {
  getDashboardStats,
  getContractStats,
  getCaseStats
} from '../controllers/dashboardController';

const router = Router();

// 获取仪表盘统计数据（需要 dashboard:view 权限）
router.get('/stats', authenticateToken, checkPermission('dashboard:view'), getDashboardStats);

// 获取合同统计详情（需要 contract:view 权限）
router.get('/contracts/stats', authenticateToken, checkPermission('contract:view'), getContractStats);

// 获取案件统计详情（需要 case:view 权限）
router.get('/cases/stats', authenticateToken, checkPermission('case:view'), getCaseStats);

export default router;
