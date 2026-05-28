// 公司法务智慧管理系统 - 主路由入口
// 功能: 统一管理所有 API 路由模块

import { Router } from 'express';
import authRoutes from './authRoutes';
import contractRoutes from './contractRoutes';

const router = Router();

// API 版本 v1
router.use('/auth', authRoutes);
router.use('/contracts', contractRoutes);

// TODO: 后续添加其他路由模块
// router.use('/cases', caseRoutes);
// router.use('/agents', agentRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/orders', orderRoutes);
// router.use('/users', userRoutes);

export default router;
