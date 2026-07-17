// 公司法务智慧管理系统 - 合同管理控制器
// 功能: 合同CRUD、审批、风险检查
// 统一响应格式: { success, data, message?, pagination? }

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../index';
import { success, created, Errors, successWithPagination } from '../utils/responseUtil';

const prisma = new PrismaClient();

// 获取合同列表（支持分页、筛选、搜索）
export async function getContracts(req: Request, res: Response) {
  try {
    const {
      page = '1',
      pageSize = '20',
      status,
      contractType,
      keyword,
      startDate,
      endDate,
      sortField = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (keyword) {
      where.OR = [
        { contractNo: { contains: keyword as string, mode: 'insensitive' } },
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { partyA: { contains: keyword as string, mode: 'insensitive' } },
        { partyB: { contains: keyword as string, mode: 'insensitive' } }
      ];
    }

    if (startDate && endDate) {
      where.signDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

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
          [sortField as string]: sortOrder === 'desc' ? 'desc' : 'asc'
        },
        skip,
        take: limitNum
      }),
      prisma.contract.count({ where })
    ]);

    return successWithPagination(res, contracts, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });

  } catch (error) {
    logger.error('获取合同列表失败', { error: (error as Error).message });
    return Errors.internal(res);
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
      return Errors.notFound(res, '合同不存在');
    }

    return success(res, contract);

  } catch (error) {
    logger.error('获取合同详情失败', { error: (error as Error).message, contractId: req.params.id });
    return Errors.internal(res);
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
      return Errors.badRequest(res, '缺少必填字段（title, partyA, partyB）');
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
      return Errors.conflict(res, '合同编号已存在');
    }

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
        status: 'DRAFT',
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

    return created(res, newContract, '合同创建成功');

  } catch (error) {
    logger.error('创建合同失败', { error: (error as Error).message });
    return Errors.internal(res);
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

    const existing = await prisma.contract.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return Errors.notFound(res, '合同不存在');
    }

    // 检查权限（只有创建者或管理员可修改草稿）
    if (existing.status !== 'DRAFT' && existing.createdBy !== userId) {
      return Errors.forbidden(res, '只有草稿状态且创建者本人可修改');
    }

    const updated = await prisma.contract.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(partyA !== undefined && { partyA }),
        ...(partyB !== undefined && { partyB }),
        ...(contractType !== undefined && { contractType }),
        ...(amount !== undefined && { amount: amount ? parseFloat(amount) : null }),
        ...(signDate !== undefined && { signDate: signDate ? new Date(signDate) : null }),
        ...(effectiveDate !== undefined && { effectiveDate: effectiveDate ? new Date(effectiveDate) : null }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(content !== undefined && { content }),
        ...(status !== undefined && { status })
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

    return success(res, updated, '合同更新成功');

  } catch (error) {
    logger.error('更新合同失败', { error: (error as Error).message, contractId: req.params.id });
    return Errors.internal(res);
  }
}

// 提交合同审批
export async function submitForApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approverIds } = req.body;

    const userId = (req as any).user.userId;

    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) }
    });

    if (!contract) {
      return Errors.notFound(res, '合同不存在');
    }

    if (contract.status !== 'DRAFT') {
      return Errors.badRequest(res, '只有草稿状态可提交审批');
    }

    if (!approverIds || approverIds.length === 0) {
      return Errors.badRequest(res, '请选择至少一位审批人');
    }

    // 更新合同状态
    await prisma.contract.update({
      where: { id: parseInt(id) },
      data: { status: 'REVIEWING' }
    });

    // 创建审批记录
    await prisma.contractApproval.createMany({
      data: approverIds.map((approverId: number) => ({
        contractId: parseInt(id),
        approverId,
        status: 'PENDING'
      }))
    });

    logger.info('合同提交审批', {
      contractId: contract.id,
      contractNo: contract.contractNo,
      submitterId: userId,
      approverIds
    });

    return success(res, {
      contractId: contract.id,
      approvalCount: approverIds.length
    }, '合同已提交审批');

  } catch (error) {
    logger.error('提交审批失败', { error: (error as Error).message, contractId: req.params.id });
    return Errors.internal(res);
  }
}

// 审批合同（前端友好版：自动查找当前用户的待审批记录）
export async function approveContract(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // status: APPROVED / REJECTED

    const userId = (req as any).user.userId;

    // 查找当前用户对该合同的待审批记录
    const approval = await prisma.contractApproval.findFirst({
      where: {
        contractId: parseInt(id),
        approverId: userId,
        status: 'PENDING'
      },
      include: { contract: true }
    });

    if (!approval) {
      return Errors.notFound(res, '未找到待审批记录');
    }

    // 更新审批记录
    await prisma.contractApproval.update({
      where: { id: approval.id },
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

    const allDone = allApprovals.every(a => a.status === 'APPROVED' || a.status === 'REJECTED');
    const allApproved = allApprovals.every(a => a.status === 'APPROVED');
    const anyRejected = allApprovals.some(a => a.status === 'REJECTED');

    let contractStatus = 'REVIEWING';
    if (allDone) {
      if (allApproved) {
        contractStatus = 'SIGNED';
      } else if (anyRejected) {
        contractStatus = 'DRAFT';
      }
    }

    // 更新合同状态
    await prisma.contract.update({
      where: { id: parseInt(id) },
      data: { status: contractStatus as any }
    });

    logger.info('合同审批完成', {
      contractId: parseInt(id),
      approvalId: approval.id,
      approverId: userId,
      status,
      contractStatus
    });

    return success(res, {
      contractId: parseInt(id),
      approvalStatus: status,
      contractStatus
    }, '审批操作成功');

  } catch (error) {
    logger.error('审批合同失败', { error: (error as Error).message, contractId: req.params.id });
    return Errors.internal(res);
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
      return Errors.notFound(res, '合同不存在');
    }

    if (contract.status !== 'DRAFT') {
      return Errors.badRequest(res, '只有草稿状态可删除');
    }

    if (contract.createdBy !== userId) {
      return Errors.forbidden(res, '只有创建者本人可删除');
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

    return success(res, null, '合同删除成功');

  } catch (error) {
    logger.error('删除合同失败', { error: (error as Error).message, contractId: req.params.id });
    return Errors.internal(res);
  }
}

// 获取可用审批人列表
export async function getApprovers(_req: Request, res: Response) {
  try {
    // 查找所有具有合同审批权限的用户（admin 和 legal_manager 角色）
    const approvers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { role: { roleName: 'admin' } },
          { role: { roleName: 'legal_manager' } }
        ]
      },
      select: { id: true, realName: true, username: true, email: true }
    });

    return success(res, approvers);
  } catch (error) {
    logger.error('获取审批人列表失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}
