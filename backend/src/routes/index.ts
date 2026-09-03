// 个人法务工作室管理系统 - 路由汇总
import { Router } from 'express';
import clientRoutes from './clientRoutes';
import authRoutes from './authRoutes';
import matterRoutes from './matterRoutes';
import taskRoutes from './taskRoutes';
import communicationRoutes from './communicationRoutes';
import timeEntryRoutes from './timeEntryRoutes';
import invoiceRoutes from './invoiceRoutes';
import documentRoutes from './documentRoutes';
import enterpriseConfigRoutes from './enterpriseConfigRoutes';
import userRoutes from './userRoutes';
import roleRoutes from './roleRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

// API 版本 v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/clients', clientRoutes);
router.use('/matters', matterRoutes);
router.use('/tasks', taskRoutes);
router.use('/communications', communicationRoutes);
router.use('/time-entries', timeEntryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/documents', documentRoutes);
router.use(enterpriseConfigRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
