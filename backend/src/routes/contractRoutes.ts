// 公司法务智慧管理系统 - 合同管理路由
// 功能: 合同CRUD、审批流程、风险检查

import { Router, Request, Response } from 'express';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';
import {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  submitForApproval,
  approveContract
} from '../controllers/contractController';

const router = Router();

// 获取合同列表（支持分页、筛选、搜索）
router.get(
  '/',
  authenticateToken,
  checkPermission('contracts:read'),
  async (req: Request, res: Response) => {
    try {
      await getContracts(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 获取单个合同详情
router.get(
  '/:id',
  authenticateToken,
  checkPermission('contracts:read'),
  async (req: Request, res: Response) => {
    try {
      await getContractById(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 创建合同草稿
router.post(
  '/',
  authenticateToken,
  checkPermission('contracts:write'),
  async (req: Request, res: Response) => {
    try {
      await createContract(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 更新合同
router.put(
  '/:id',
  authenticateToken,
  checkPermission('contracts:write'),
  async (req: Request, res: Response) => {
    try {
      await updateContract(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 提交合同审批
router.post(
  '/:id/submit',
  authenticateToken,
  checkPermission('contracts:write'),
  async (req: Request, res: Response) => {
    try {
      await submitForApproval(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 审批合同
router.post(
  '/:id/approve/:approvalId',
  authenticateToken,
  checkPermission('contracts:approve'),
  async (req: Request, res: Response) => {
    try {
      await approveContract(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 删除合同（仅草稿可删除）
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('contracts:delete'),
  async (req: Request, res: Response) => {
    try {
      await deleteContract(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

export default router;
