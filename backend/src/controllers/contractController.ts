// 公司法务智慧管理系统 - 合同管理控制器
// 功能: 合同CRUD、审批、风险检查

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../index';

const prisma = new PrismaClient();

// 获取合同列表（支持分页、筛选、搜索）
export async function getContracts(req: Request, res: Response) {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      contractType,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // 构建查询条件
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (contractType) {
      where.contractType = contractType;
    }
    
    if (search) {
      where.OR = [
        { contractNo: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { partyA: { contains: search as string, mode: 'insensitive' } },
        { partyB: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (startDate && endDate) {
      where.signDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    // 查询合同列表
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          creator: {
            select: { id: true, realName: true, username: true }
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, realName: true }
              }
            }
          }
        },
        orderBy: {
          [sortBy as string]: sortOrder === 'desc' ? 'desc' : 'asc'
        },
        skip,
        take: limitNum
      }),
      prisma.contract.count({ where })
    ]);
    
    res.json({
      message: '查询成功',
      data: contracts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    logger.error('获取合同列表失败', { error: (error as Error).message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}

// 获取单个合同详情
export async function getContractById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: { id: true, realName: true, username: true, email: true }
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, realName: true, email: true }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    });
    
    if (!contract) {
      return res.status(404).json({
        error: 'Not Found',
        message: '合同不存在'
      });
    }
    
    res.json({
      message: '查询成功',
      data: contract
    });
    
  } catch (error) {
    logger.error('获取合同详情失败', { error: (error as Error).message, contractId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}

// 创建合同草稿
export async function createContract(req: Request, res: Response) {
  try {
    const {
      title,
      partyA,
      partyB,
      contractType,
      amount,
      signDate,
      effectiveDate,
      expiryDate,
      content,
      contractNo // 可选，不传则自动生成
    } = req.body;
    
    const userId = (req as any).user.userId;
    
    // 参数验证
    if (!title || !partyA || !partyB) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '缺少必填字段（title, partyA, partyB）'
      });
    }
    
    // 生成合同编号（如果未提供）
    let finalContractNo = contractNo;
    if (!finalContractNo) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalContractNo = `CON${timestamp}${random}`;
    }
    
    // 检查合同编号是否已存在
    const existing = await prisma.contract.findUnique({
      where: { contractNo: finalContractNo }
    });
    
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: '合同编号已存在'
      });
    }
    
    // 创建合同
    const newContract = await prisma.contract.create({
      data: {
        contractNo: finalContractNo,
        title,
        partyA,
        partyB,
        contractType,
        amount: amount ? parseFloat(amount) : null,
        signDate: signDate ? new Date(signDate) : null,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'draft',
        content,
        createdBy: userId
      },
      include: {
        creator: {
          select: { id: true, realName: true }
        }
      }
    });
    
    logger.info('合同创建成功', {
      contractId: newContract.id,
      contractNo: newContract.contractNo,
      creatorId: userId
    });
    
    res.status(201).json({
      message: '合同创建成功',
      data: newContract
    });
    
  } catch (error) {
    logger.error('创建合同失败', { error: (error as Error).message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}

// 更新合同
export async function updateContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      partyA,
      partyB,
      contractType,
      amount,
      signDate,
      effectiveDate,
      expiryDate,
      content,
      status
    } = req.body;
    
    const userId = (req as any).user.userId;
    
    // 检查合同是否存在
    const existing = await prisma.contract.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return res.status(404).json({
        error: 'Not Found',
        message: '合同不存在'
      });
    }
    
    // 检查权限（只有创建者或管理员可修改草稿）
    if (existing.status !== 'draft' && existing.createdBy !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只有草稿状态且创建者本人可修改'
      });
    }
    
    // 更新合同
    const updated = await prisma.contract.update({
      where: { id: parseInt(id) },
      data: {
        title,
        partyA,
        partyB,
        contractType,
        amount: amount ? parseFloat(amount) : undefined,
        signDate: signDate ? new Date(signDate) : undefined,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        content,
        status: status || undefined
      },
      include: {
        creator: {
          select: { id: true, realName: true }
        }
      }
    });
    
    logger.info('合同更新成功', {
      contractId: updated.id,
      contractNo: updated.contractNo,
      operatorId: userId
    });
    
    res.json({
      message: '合同更新成功',
      data: updated
    });
    
  } catch (error) {
    logger.error('更新合同失败', { error: (error as Error).message, contractId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}

// 提交合同审批
export async function submitForApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approverIds } = req.body; // 审批人ID数组
    
    const userId = (req as any).user.userId;
    
    // 检查合同是否存在
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!contract) {
      return res.status(404).json({
        error: 'Not Found',
        message: '合同不存在'
      });
    }
    
    if (contract.status !== 'draft') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '只有草稿状态可提交审批'
      });
    }
    
    if (!approverIds || approverIds.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请选择至少一位审批人'
      });
    }
    
    // 更新合同状态
    await prisma.contract.update({
      where: { id: parseInt(id) },
      data: { status: 'reviewing' }
    });
    
    // 创建审批记录
    const approvals = await prisma.contractApproval.createMany({
      data: approverIds.map((approverId: number) => ({
        contractId: parseInt(id),
        approverId,
        status: 'pending'
      }))
    });
    
    logger.info('合同提交审批', {
      contractId: contract.id,
      contractNo: contract.contractNo,
      submitterId: userId,
      approverIds
    });
    
    res.json({
      message: '合同已提交审批',
      data: {
        contractId: contract.id,
        approvalCount: approverIds.length
      }
    });
    
  } catch (error) {
    logger.error('提交审批失败', { error: (error as Error).message, contractId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}

// 审批合同
export async function approveContract(req: Request, res: Response) {
  try {
    const { id, approvalId } = req.params;
    const { status, comment } = req.body; // status: approved/rejected
    
    const userId = (req as any).user.userId;
    
    // 检查审批记录是否存在
    const approval = await prisma.contractApproval.findUnique({
      where: { id: parseInt(approvalId) },
      include: { contract: true }
    });
    
    if (!approval) {
      return res.status(404).json({
        error: 'Not Found',
        message: '审批记录不存在'
      });
    }
    
    if (approval.contractId !== parseInt(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '审批记录与合同不匹配'
      });
    }
    
    if (approval.approverId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只有审批人本人可操作'
      });
    }
    
    if (approval.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '已审批，不可重复操作'
      });
    }
    
    // 更新审批记录
    await prisma.contractApproval.update({
      where: { id: parseInt(approvalId) },
      data: {
        status,
        comment,
        approvedAt: new Date()
      }
    });
    
    // 检查是否所有审批都已完成
    const allApprovals = await prisma.contractApproval.findMany({
      where: { contractId: parseInt(id) }
    });
    
    const allApproved = allApprovals.every(a => a.status === 'approved');
    const anyRejected = allApprovals.some(a => a.status === 'rejected');
    
    let contractStatus = 'reviewing';
    if (allApproved) {
      contractStatus = 'signed'; // 所有审批通过，标记为已签署
    } else if (anyRejected) {
      contractStatus = 'draft'; // 有拒绝，退回草稿
    }
    
    // 更新合同状态
    await prisma.contract.update({
      where: { id: parseInt(id) },
      data: { status: contractStatus }
    });
    
    logger.info('合同审批完成', {
      contractId: parseInt(id),
      approvalId: parseInt(approvalId),
      approverId: userId,
      status,
      contractStatus
    });
    
    res.json({
      message: '审批操作成功',
      data: {
        contractId: parseInt(id),
        approvalStatus: status,
        contractStatus
      }
    });
    
  } catch (error) {
    logger.error('审批合同失败', { error: (error as Error).message, contractId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}

// 删除合同（仅草稿可删除）
export async function deleteContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!contract) {
      return res.status(404).json({
        error: 'Not Found',
        message: '合同不存在'
      });
    }
    
    if (contract.status !== 'draft') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '只有草稿状态可删除'
      });
    }
    
    if (contract.createdBy !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: '只有创建者本人可删除'
      });
    }
    
    // 删除审批记录（级联删除）
    await prisma.contractApproval.deleteMany({
      where: { contractId: parseInt(id) }
    });
    
    // 删除合同
    await prisma.contract.delete({
      where: { id: parseInt(id) }
    });
    
    logger.info('合同删除成功', {
      contractId: parseInt(id),
      contractNo: contract.contractNo,
      operatorId: userId
    });
    
    res.json({
      message: '合同删除成功'
    });
    
  } catch (error) {
    logger.error('删除合同失败', { error: (error as Error).message, contractId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
}
