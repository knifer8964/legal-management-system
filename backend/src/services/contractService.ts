// =====================================================
// 合同管理服务 - 业务逻辑层
// =====================================================

import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateContractDto,
  UpdateContractDto,
  ContractQueryParams,
  Contract,
  ContractStatus,
  ContractStatusUpdateDto,
  ContractTimelineEvent,
} from '../types/api';

const prisma = new PrismaClient();

// 生成合同编号: HT-YYYYMMDD-XXXX
async function generateContractNo(): Promise<string> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const prefix = `HT-${dateStr}-`;

  // 查当天已有的最大编号
  const last = await prisma.contract.findFirst({
    where: { contractNo: { startsWith: prefix } },
    orderBy: { contractNo: 'desc' },
  });

  let seq = 1;
  if (last) {
    const parts = last.contractNo.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) seq = num + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// 合同状态中文标签
const contractStatusLabels: Record<string, string> = {
  DRAFT: '草稿',
  REVIEWING: '审查中',
  PENDING_SIGN: '待签订',
  SIGNED: '已签订',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  TERMINATED: '已终止',
  EXPIRED: '已过期',
};

export class ContractService {
  // =====================================================
  // 创建合同
  // =====================================================
  async create(data: CreateContractDto, userId: number): Promise<Contract> {
    const contractNo = await generateContractNo();

    const contract = await prisma.contract.create({
      data: {
        contractNo,
        title: data.title,
        contractType: data.contractType,
        clientId: data.clientId,
        matterId: data.matterId || null,
        status: data.status || ContractStatus.DRAFT,
        amount: data.amount !== undefined && data.amount !== null ? data.amount : null,
        currency: data.currency || 'CNY',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        signDate: data.signDate ? new Date(data.signDate) : null,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
        content: data.content || null,
        summary: data.summary || null,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        counterparty: data.counterparty || null,
        counterpartyContact: data.counterpartyContact || null,
        counterpartyPhone: data.counterpartyPhone || null,
        reviewedBy: data.reviewedBy || null,
        approvedBy: data.approvedBy || null,
        reviewNotes: data.reviewNotes || null,
        createdById: userId,
      },
      include: { client: true, matter: true, createdBy: true },
    });

    // 记录创建时间线
    await prisma.systemLog.create({
      data: {
        userId,
        action: 'STATUS_CHANGE',
        resource: 'Contract',
        resourceId: contract.id,
        details: JSON.stringify({
          fromStatus: null,
          toStatus: contract.status,
          note: `创建合同（${contractStatusLabels[contract.status] || contract.status}）`,
        }),
        status: 'SUCCESS',
      },
    });

    return this.format(contract);
  }

  // =====================================================
  // 更新合同
  // =====================================================
  async update(id: number, data: UpdateContractDto): Promise<Contract> {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new Error('合同不存在');

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.matterId !== undefined) updateData.matterId = data.matterId || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.amount !== undefined) updateData.amount = data.amount === null ? null : data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.attachments !== undefined) updateData.attachments = data.attachments ? JSON.stringify(data.attachments) : null;
    if (data.counterparty !== undefined) updateData.counterparty = data.counterparty;
    if (data.counterpartyContact !== undefined) updateData.counterpartyContact = data.counterpartyContact;
    if (data.counterpartyPhone !== undefined) updateData.counterpartyPhone = data.counterpartyPhone;
    if (data.reviewedBy !== undefined) updateData.reviewedBy = data.reviewedBy || null;
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy || null;
    if (data.reviewNotes !== undefined) updateData.reviewNotes = data.reviewNotes;

    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.signDate !== undefined) updateData.signDate = data.signDate ? new Date(data.signDate) : null;
    if (data.reviewDate !== undefined) updateData.reviewDate = data.reviewDate ? new Date(data.reviewDate) : null;

    const updated = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: { client: true, matter: true, createdBy: true },
    });

    return this.format(updated);
  }

  // =====================================================
  // 查询单条合同
  // =====================================================
  async findById(id: number): Promise<Contract | null> {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        matter: true,
        createdBy: true,
        reviewedByUser: true,
        approvedByUser: true,
      },
    });
    if (!contract) return null;
    return this.format(contract);
  }

  // =====================================================
  // 删除合同
  // =====================================================
  async delete(id: number): Promise<void> {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new Error('合同不存在');

    await prisma.$transaction([
      prisma.systemLog.deleteMany({ where: { resource: 'Contract', resourceId: id } }),
      prisma.contract.delete({ where: { id } }),
    ]);
  }

  // =====================================================
  // 列表查询
  // =====================================================
  async findAll(params: ContractQueryParams): Promise<{
    data: Contract[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      clientId,
      matterId,
      contractType,
      status,
      search,
    } = params;

    const where: Prisma.ContractWhereInput = {};
    if (clientId) where.clientId = clientId;
    if (matterId) where.matterId = matterId;
    if (contractType) where.contractType = contractType;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { contractNo: { contains: search } },
        { title: { contains: search } },
        { counterparty: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const [total, contracts] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        include: { client: true, matter: true, createdBy: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: contracts.map((c) => this.format(c)),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // =====================================================
  // 统计
  // =====================================================
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalAmount: number;
  }> {
    const [total, byStatus, byType, amountAgg] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.groupBy({ by: ['status'], _count: true }),
      prisma.contract.groupBy({ by: ['contractType'], _count: true }),
      prisma.contract.aggregate({ _sum: { amount: true } }),
    ]);

    const byStatusMap: Record<string, number> = {};
    for (const s of byStatus) byStatusMap[s.status] = s._count;

    const byTypeMap: Record<string, number> = {};
    for (const t of byType) byTypeMap[t.contractType] = t._count;

    return {
      total,
      byStatus: byStatusMap,
      byType: byTypeMap,
      totalAmount: Math.round(Number(amountAgg._sum.amount || 0) * 100) / 100,
    };
  }

  // =====================================================
  // 更新合同状态
  // =====================================================
  async updateStatus(id: number, data: ContractStatusUpdateDto, userId: number): Promise<Contract> {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new Error('合同不存在');

    const updateData: any = { status: data.status };

    // 状态流转时自动设置对应时间节点
    if (data.status === ContractStatus.SIGNED && !existing.signDate) {
      updateData.signDate = new Date();
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: { client: true, matter: true, createdBy: true },
    });

    // 记录状态变更时间线
    await prisma.systemLog.create({
      data: {
        userId,
        action: 'STATUS_CHANGE',
        resource: 'Contract',
        resourceId: id,
        details: JSON.stringify({
          fromStatus: existing.status,
          toStatus: data.status,
          note: data.note || `状态由「${contractStatusLabels[existing.status] || existing.status}」变更为「${contractStatusLabels[data.status] || data.status}」`,
        }),
        status: 'SUCCESS',
      },
    });

    return this.format(updated);
  }

  // =====================================================
  // 合同操作时间线
  // =====================================================
  async getTimeline(id: number): Promise<ContractTimelineEvent[]> {
    const logs = await prisma.systemLog.findMany({
      where: { resource: 'Contract', resourceId: id, action: 'STATUS_CHANGE' },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => {
      let details: any = {};
      if (log.details) {
        try { details = JSON.parse(log.details); } catch { details = {}; }
      }
      return {
        id: log.id,
        contractId: log.resourceId!,
        fromStatus: details.fromStatus ?? null,
        toStatus: details.toStatus ?? null,
        action: log.action,
        note: details.note ?? null,
        operatorId: log.userId,
        createdAt: log.createdAt.toISOString(),
      };
    });
  }

  // =====================================================
  // 辅助方法: 格式化合同数据
  // =====================================================
  private format(c: any): Contract {
    const parseJson = (v: any) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    const compactUser = (u: any) => (u ? {
      id: u.id,
      username: u.username,
      realName: u.realName,
    } : undefined);

    return {
      ...c,
      amount: c.amount !== null && c.amount !== undefined ? Number(c.amount) : null,
      attachments: parseJson(c.attachments),
      startDate: c.startDate ? c.startDate.toISOString().split('T')[0] : null,
      endDate: c.endDate ? c.endDate.toISOString().split('T')[0] : null,
      signDate: c.signDate ? c.signDate.toISOString().split('T')[0] : null,
      reviewDate: c.reviewDate ? c.reviewDate.toISOString().split('T')[0] : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      client: c.client ? {
        id: c.client.id,
        name: c.client.name,
        clientType: c.client.clientType,
      } : undefined,
      matter: c.matter ? {
        id: c.matter.id,
        matterNo: c.matter.matterNo,
        title: c.matter.title,
      } : undefined,
      createdBy: compactUser(c.createdBy),
      reviewedByUser: compactUser(c.reviewedByUser),
      approvedByUser: compactUser(c.approvedByUser),
    };
  }
}

export default new ContractService();
