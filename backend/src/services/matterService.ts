// =====================================================
// 业务事项管理服务 - 业务逻辑层
// =====================================================

import { PrismaClient, Prisma, MatterType, MatterStatus } from '@prisma/client';
import { CreateMatterDto, MatterQueryParams, Matter } from '../types/api';

const prisma = new PrismaClient();

export class MatterService {
  // =====================================================
  // 创建业务事项
  // =====================================================
  async create(data: CreateMatterDto, userId: number): Promise<Matter> {
    const matterNo = await this.generateMatterNo(data.matterType);

    const matter = await prisma.$transaction(async (tx) => {
      const created = await tx.matter.create({
        data: {
          matterNo,
          matterType: data.matterType,
          title: data.title,
          description: data.description || null,
          clientId: data.clientId,
          status: data.status || 'PENDING',
          priority: data.priority || 'MEDIUM',
          feeType: data.feeType,
          feeAmount: data.feeAmount || null,
          hourlyRate: data.hourlyRate || null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          assigneeId: data.assigneeId || null,
          createdById: userId,
          metadata: data.metadata || undefined,
        },
        include: {
          client: true,
          assignee: true,
          createdBy: true,
        },
      });

      await tx.timelineEvent.create({
        data: {
          matterId: created.id,
          operatorId: userId,
          eventType: 'STATUS_CHANGE',
          title: '创建业务事项',
          description: `创建了${this.getMatterTypeLabel(created.matterType)}业务: ${created.title}`,
        },
      });

      return created;
    });

    return this.formatMatter(matter);
  }

  // =====================================================
  // 更新业务事项
  // =====================================================
  async update(id: number, data: Partial<CreateMatterDto>, userId: number): Promise<Matter> {
    const updateData: any = { ...data };

    // 处理日期
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    // 先获取旧记录用于审计描述
    const oldMatter = await prisma.matter.findUnique({ where: { id }, select: { title: true } });

    const [matter] = await prisma.$transaction([
      prisma.matter.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          assignee: true,
          createdBy: true,
          _count: { select: { tasks: true, timeEntries: true, invoices: true } },
        },
      }),
      prisma.timelineEvent.create({
        data: {
          matterId: id,
          operatorId: userId,
          eventType: 'SYSTEM',
          title: '业务信息更新',
          description: `更新了业务 "${oldMatter?.title || '未知'}" 的信息`,
        },
      }),
    ]);

    return this.formatMatter(matter);
  }

  // =====================================================
  // 删除业务事项
  // =====================================================
  async delete(id: number): Promise<void> {
    // 删除关联数据
    await prisma.$transaction([
      prisma.timelineEvent.deleteMany({ where: { matterId: id } }),
      prisma.timeEntry.deleteMany({ where: { matterId: id } }),
      prisma.task.deleteMany({ where: { matterId: id } }),
      prisma.communication.deleteMany({ where: { matterId: id } }),
      prisma.matter.delete({ where: { id } }),
    ]);
  }

  // =====================================================
  // 获取业务详情
  // =====================================================
  async getById(id: number): Promise<Matter | null> {
    const matter = await prisma.matter.findUnique({
      where: { id },
      include: {
        client: true,
        assignee: true,
        createdBy: true,
        tasks: { orderBy: { createdAt: 'desc' }, take: 20 },
        timeline: { orderBy: { createdAt: 'desc' }, take: 20 },
        timeEntries: { orderBy: { startTime: 'desc' }, take: 20 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { communications: true, documents: true } },
      },
    });

    if (!matter) return null;
    return this.formatMatter(matter);
  }

  // =====================================================
  // 业务列表 (分页 + 筛选)
  // =====================================================
  async findAll(params: MatterQueryParams): Promise<{
    data: Matter[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      clientId,
      matterType,
      status,
      priority,
      assigneeId,
      search,
    } = params;

    const where: Prisma.MatterWhereInput = {};

    if (clientId) where.clientId = clientId;
    if (matterType) where.matterType = matterType;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { matterNo: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [total, matters] = await Promise.all([
      prisma.matter.count({ where }),
      prisma.matter.findMany({
        where,
        include: {
          client: true,
          assignee: true,
          createdBy: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: matters.map(m => this.formatMatter(m)),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // =====================================================
  // 业务统计
  // =====================================================
  async getStats(params?: { assigneeId?: number }) {
    const where: Prisma.MatterWhereInput = {};
    if (params?.assigneeId) where.assigneeId = params.assigneeId;

    const [total, byStatus, byType, upcomingDeadlines] = await Promise.all([
      prisma.matter.count({ where }),
      prisma.matter.groupBy({ by: ['status'], _count: true, where }),
      prisma.matter.groupBy({ by: ['matterType'], _count: true, where }),
      // 即将到期的业务 (7 天内)
      prisma.matter.findMany({
        where: {
          ...where,
          status: { notIn: ['COMPLETED', 'ARCHIVED', 'CANCELLED'] as MatterStatus[] },
          deadline: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: { client: true, assignee: true },
        orderBy: { deadline: 'asc' },
        take: 10,
      }),
    ]);

    // 构建状态 Map
    const byStatusMap: Record<string, number> = {};
    for (const item of byStatus) byStatusMap[item.status] = item._count;

    // 构建类型 Map
    const byTypeMap: Record<string, number> = {};
    for (const item of byType) byTypeMap[item.matterType] = item._count;

    return {
      total,
      pending: byStatusMap['PENDING'] || 0,
      inProgress: (byStatusMap['IN_PROGRESS'] || 0) + (byStatusMap['REVIEWING'] || 0),
      waitingClient: byStatusMap['WAITING_CLIENT'] || 0,
      completed: byStatusMap['COMPLETED'] || 0,
      byStatus: byStatusMap,
      byType: byTypeMap,
      upcomingDeadlines: upcomingDeadlines.map(m => ({
        id: m.id,
        matterNo: m.matterNo,
        title: m.title,
        deadline: m.deadline?.toISOString() || null,
        status: m.status,
        clientName: (m as any).client?.name || null,
      })),
    };
  }

  // =====================================================
  // 更新业务状态
  // =====================================================
  async updateStatus(id: number, status: MatterStatus, userId: number): Promise<Matter> {
    const oldMatter = await prisma.matter.findUnique({ where: { id } });
    if (!oldMatter) throw new Error('业务不存在');

    const updateData: any = { status };

    // 自动更新完成时间
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
    if (status === 'IN_PROGRESS' && oldMatter.status === 'PENDING') {
      updateData.startDate = new Date();
    }

    const matter = await prisma.matter.update({
      where: { id },
      data: updateData,
    });

    // 记录时间线
    await prisma.timelineEvent.create({
      data: {
        matterId: id,
        operatorId: userId,
        eventType: 'STATUS_CHANGE',
        title: '状态更新',
        description: `业务状态从 "${this.getStatusLabel(oldMatter.status)}" 变为 "${this.getStatusLabel(status)}"`,
      },
    });

    return this.formatMatter(matter);
  }

  // =====================================================
  // 获取业务时间线
  // =====================================================
  async getTimeline(matterId: number) {
    return prisma.timelineEvent.findMany({
      where: { matterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================================
  // 辅助方法
  // =====================================================
  private async generateMatterNo(type: MatterType): Promise<string> {
    const prefix = {
      CONSULTATION: 'ZX',
      CONTRACT_REVIEW: 'HT',
      CONTRACT_DRAFT: 'HD',
      CASE_LITIGATION: 'SS',
      CASE_ARBITRATION: 'ZC',
      CASE_MEDIATION: 'TJ',
      COMPLIANCE: 'HG',
      TRAINING: 'PX',
      DOCUMENT_DRAFT: 'WS',
      OTHER: 'QT',
    }[type] || 'YW';

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    // 当天同类型计数
    const count = await prisma.matter.count({
      where: {
        matterType: type,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });

    return `${prefix}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  private formatMatter(matter: any): Matter {
    return {
      ...matter,
      feeAmount: matter.feeAmount ? Number(matter.feeAmount) : null,
      hourlyRate: matter.hourlyRate ? Number(matter.hourlyRate) : null,
      totalAmount: Number(matter.totalAmount),
      paidAmount: Number(matter.paidAmount),
      startDate: matter.startDate?.toISOString()?.split('T')[0] || null,
      deadline: matter.deadline?.toISOString() || null,
      completedAt: matter.completedAt?.toISOString() || null,
      createdAt: matter.createdAt.toISOString(),
      updatedAt: matter.updatedAt.toISOString(),
      // 关联对象的日期处理
      client: matter.client ? {
        ...matter.client,
        createdAt: matter.client.createdAt?.toISOString(),
        updatedAt: matter.client.updatedAt?.toISOString(),
      } : undefined,
      tasks: matter.tasks?.map((t: any) => ({
        ...t,
        createdAt: t.createdAt?.toISOString(),
        updatedAt: t.updatedAt?.toISOString(),
      })),
      timeEntries: matter.timeEntries?.map((t: any) => ({
        ...t,
        startTime: t.startTime?.toISOString(),
        endTime: t.endTime?.toISOString(),
        createdAt: t.createdAt?.toISOString(),
        updatedAt: t.updatedAt?.toISOString(),
      })),
      invoices: matter.invoices?.map((i: any) => ({
        ...i,
        amount: i.amount ? Number(i.amount) : null,
        issueDate: i.issueDate?.toISOString()?.split('T')[0] || null,
        dueDate: i.dueDate?.toISOString()?.split('T')[0] || null,
        paidAt: i.paidAt?.toISOString() || null,
        createdAt: i.createdAt?.toISOString(),
        updatedAt: i.updatedAt?.toISOString(),
      })),
    };
  }

  private getMatterTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      CONSULTATION: '法律咨询',
      CONTRACT_REVIEW: '合同审查',
      CONTRACT_DRAFT: '合同起草',
      CASE_LITIGATION: '诉讼案件',
      CASE_ARBITRATION: '仲裁案件',
      CASE_MEDIATION: '调解案件',
      COMPLIANCE: '合规顾问',
      TRAINING: '法律培训',
      DOCUMENT_DRAFT: '文书代写',
      OTHER: '其他',
    };
    return labels[type] || type;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: '待处理',
      IN_PROGRESS: '进行中',
      WAITING_CLIENT: '等待客户',
      REVIEWING: '内部复核',
      COMPLETED: '已完成',
      ARCHIVED: '已归档',
      CANCELLED: '已取消',
    };
    return labels[status] || status;
  }
}

export default new MatterService();
