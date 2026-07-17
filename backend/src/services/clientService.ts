// =====================================================
// 客户管理服务 - 业务逻辑层
// =====================================================

import { PrismaClient, Prisma, ClientType, ClientStatus } from '@prisma/client';
import { CreateClientDto, UpdateClientDto, ClientQueryParams, Client, PaginatedResponse } from '../types/api';

const prisma = new PrismaClient();

export class ClientService {
  // =====================================================
  // 创建客户
  // =====================================================
  async create(data: CreateClientDto): Promise<Client> {
    const client = await prisma.client.create({
      data: {
        clientType: data.clientType,
        name: data.name,
        shortName: data.shortName,
        phone: data.phone,
        email: data.email,
        wechatId: data.wechatId,
        qq: data.qq,
        address: data.address,
        gender: data.gender,
        idNumber: data.idNumber,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        creditCode: data.creditCode,
        legalRep: data.legalRep,
        industry: data.industry,
        scale: data.scale,
        website: data.website,
        contactName: data.contactName,
        contactTitle: data.contactTitle,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactWechat: data.contactWechat,
        servicePlan: data.servicePlan,
        monthlyFee: data.monthlyFee,
        serviceStart: data.serviceStart ? new Date(data.serviceStart) : null,
        serviceEnd: data.serviceEnd ? new Date(data.serviceEnd) : null,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        notes: data.notes,
        source: data.source,
        status: ClientStatus.ACTIVE,
      },
    });

    return this.formatClient(client);
  }

  // =====================================================
  // 更新客户
  // =====================================================
  async update(id: number, data: UpdateClientDto): Promise<Client> {
    const updateData: any = { ...data };

    // 处理日期字段
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    }
    if (data.serviceStart !== undefined) {
      updateData.serviceStart = data.serviceStart ? new Date(data.serviceStart) : null;
    }
    if (data.serviceEnd !== undefined) {
      updateData.serviceEnd = data.serviceEnd ? new Date(data.serviceEnd) : null;
    }

    // 处理标签
    if (data.tags !== undefined) {
      updateData.tags = data.tags ? JSON.stringify(data.tags) : undefined;
    }

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return this.formatClient(client);
  }

  // =====================================================
  // 删除客户
  // =====================================================
  async delete(id: number): Promise<void> {
    // 检查是否有关联的业务事项
    const matterCount = await prisma.matter.count({
      where: { clientId: id },
    });

    if (matterCount > 0) {
      throw new Error(`该客户下有 ${matterCount} 个业务事项，无法删除`);
    }

    await prisma.client.delete({ where: { id } });
  }

  // =====================================================
  // 获取客户详情
  // =====================================================
  async getById(id: number): Promise<Client | null> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        matters: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        enterpriseConfig: true,
      },
    });

    if (!client) return null;
    return this.formatClient(client);
  }

  // =====================================================
  // 客户列表 (分页 + 筛选)
  // =====================================================
  async findAll(params: ClientQueryParams): Promise<PaginatedResponse<Client>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      clientType,
      status,
      search,
      servicePlan,
      tags,
    } = params;

    // 构建查询条件
    const where: Prisma.ClientWhereInput = {};

    if (clientType) {
      where.clientType = clientType;
    }

    if (status) {
      where.status = status;
    }

    if (servicePlan) {
      where.servicePlan = servicePlan;
    }

    // JSON 数组标签查询 (MySQL JSON_CONTAINS)
    // 暂时跳过，后续实现
    if (tags) {
      // 可通过 SQL 原生查询实现
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { contactName: { contains: search } },
        { contactPhone: { contains: search } },
        { creditCode: { contains: search } },
      ];
    }

    // 统计总数
    const total = await prisma.client.count({ where });

    // 查询数据
    const clients = await prisma.client.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 格式化返回
    const formattedClients = clients.map(c => this.formatClient(c));

    return {
      data: formattedClients,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // =====================================================
  // 获取客户统计
  // =====================================================
  async getStats(): Promise<{
    total: number;
    active: number;
    potential: number;
    enterprise: number;
    personal: number;
    byServicePlan: Record<string, number>;
  }> {
    const [total, active, potential, enterprise, personal] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: ClientStatus.ACTIVE } }),
      prisma.client.count({ where: { status: ClientStatus.POTENTIAL } }),
      prisma.client.count({ where: { clientType: ClientType.ENTERPRISE } }),
      prisma.client.count({ where: { clientType: ClientType.PERSONAL } }),
    ]);

    // 按服务计划统计
    const servicePlans = await prisma.client.groupBy({
      by: ['servicePlan'],
      _count: true,
    });

    const byServicePlan: Record<string, number> = {};
    for (const plan of servicePlans) {
      if (plan.servicePlan) {
        byServicePlan[plan.servicePlan] = plan._count;
      }
    }

    return {
      total,
      active,
      potential,
      enterprise,
      personal,
      byServicePlan,
    };
  }

  // =====================================================
  // 获取客户业务列表
  // =====================================================
  async getClientMatters(
    clientId: number,
    params: { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 20 } = params;

    const where = { clientId };

    const [total, matters] = await Promise.all([
      prisma.matter.count({ where }),
      prisma.matter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          assignee: true,
          createdBy: true,
        },
      }),
    ]);

    return {
      data: matters,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // =====================================================
  // 辅助方法: 格式化客户数据
  // =====================================================
  private formatClient(client: any): Client {
    return {
      ...client,
      tags: client.tags ? (typeof client.tags === 'string' ? JSON.parse(client.tags) : client.tags) : null,
      serviceStart: client.serviceStart?.toISOString()?.split('T')[0] || null,
      serviceEnd: client.serviceEnd?.toISOString()?.split('T')[0] || null,
      birthDate: client.birthDate?.toISOString()?.split('T')[0] || null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }
}

export default new ClientService();
