// 公司法务智慧管理系统 - 合同管理路由
// 功能: 合同CRUD、审批流程、参数验证

import { Router, Request, Response } from 'express';
import { authenticateToken, checkPermission, validate, contractSchemas, uploadDocument, handleMulterError } from '../middleware';
import {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  submitForApproval,
  approveContract,
  getApprovers
} from '../controllers/contractController';

const router = Router();

// 获取可用审批人列表
router.get(
  '/approvers',
  authenticateToken,
  async (req: Request, res: Response) => {
    await getApprovers(req, res);
  }
);

// 获取合同列表
router.get(
  '/',
  authenticateToken,
  checkPermission('contracts:read'),
  validate(contractSchemas.list),
  async (req: Request, res: Response) => {
    await getContracts(req, res);
  }
);

// 获取单个合同详情
router.get(
  '/:id',
  authenticateToken,
  checkPermission('contracts:read'),
  async (req: Request, res: Response) => {
    await getContractById(req, res);
  }
);

// 创建合同草稿
router.post(
  '/',
  authenticateToken,
  checkPermission('contracts:write'),
  validate(contractSchemas.create),
  async (req: Request, res: Response) => {
    await createContract(req, res);
  }
);

// 上传合同附件
router.post(
  '/:id/upload',
  authenticateToken,
  checkPermission('contracts:write'),
  uploadDocument.single('file'),
  handleMulterError,
  async (req: Request, res: Response) => {
    if (!(req as any).file) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: '请选择文件' } });
    }
    const file = (req as any).file;
    return res.json({
      success: true,
      data: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  }
);

// 更新合同
router.put(
  '/:id',
  authenticateToken,
  checkPermission('contracts:write'),
  validate(contractSchemas.update),
  async (req: Request, res: Response) => {
    await updateContract(req, res);
  }
);

// 提交合同审批
router.post(
  '/:id/submit',
  authenticateToken,
  checkPermission('contracts:write'),
  async (req: Request, res: Response) => {
    await submitForApproval(req, res);
  }
);

// 审批合同
router.post(
  '/:id/approve',
  authenticateToken,
  checkPermission('contracts:approve'),
  validate(contractSchemas.approve),
  async (req: Request, res: Response) => {
    await approveContract(req, res);
  }
);

// 删除合同（仅草稿可删除）
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('contracts:delete'),
  async (req: Request, res: Response) => {
    await deleteContract(req, res);
  }
);

export default router;
