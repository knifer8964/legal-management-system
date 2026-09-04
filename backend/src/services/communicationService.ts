// =====================================================
// 沟通记录管理服务
// =====================================================

import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateCommunicationDto,
  UpdateCommunicationDto,
  CommunicationQueryParams,
  Communication,
} from '../types/api';

const prisma = new PrismaClient();

export class CommunicationService {
  // 创建沟通记录
  async create(data: CreateCommunicationDto, userId: number): Promise<Communication> {
    const comm = await prisma.communication.create({
      data: {
        clientId: data.clientId,
        matterId: data.matterId || null,
        userId,
        channel: data.channel,
        direction: data.direction,
        subject: data.subject || null,
        content: data.content,
        contactName: data.contactName || null,
        contactInfo: data.contactInfo || null,
        contactWechat: data.contactWechat || null,
        fromAddr: data.fromAddr || null,
        toAddrs: data.toAddrs ? JSON.stringify(data.toAddrs) : null,
        ccAddrs: data.ccAddrs ? JSON.stringify(data.ccAddrs) : null,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        externalId: data.externalId || null,
        threadId: data.threadId || null,
        sentAt: data.sentAt ? new Date(data.sentAt) : new Date(),
      },
      include: {
        client: true,
        matter: true,
        user: true,
      },
    });

    return this.format(comm);
  }

  // 更新沟通记录
  async update(id: number, data: UpdateCommunicationDto): Promise<Communication> {
    const comm = await prisma.communication.update({
      where: { id },
      data: {
        ...data,
        matterId: data.matterId !== undefined ? (data.matterId || null) : undefined,
      },
      include: { client: true, matter: true, user: true },
    });

    return this.format(comm);
  }

  // 删除沟通记录
  async delete(id: number): Promise<void> {
    await prisma.communication.delete({ where: { id } });
  }

  // 获取详情
  async getById(id: number): Promise<Communication | null> {
    const comm = await prisma.communication.findUnique({
      where: { id },
      include: { client: true, matter: true, user: true },
    });
    if (!comm) return null;
    return this.format(comm);
  }

  // 列表 (分页 + 筛选)
  async findAll(params: CommunicationQueryParams): Promise<{
    data: Communication[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'sentAt',
      sortOrder = 'desc',
      clientId,
      matterId,
      channel,
      direction,
      search,
    } = params;

    const where: Prisma.CommunicationWhereInput = {};
    if (clientId) where.clientId = clientId;
    if (matterId) where.matterId = matterId;
    if (channel) where.channel = channel;
    if (direction) where.direction = direction;

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { content: { contains: search } },
        { contactName: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const [total, communications] = await Promise.all([
      prisma.communication.count({ where }),
      prisma.communication.findMany({
        where,
        include: { client: true, matter: true, user: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: communications.map(c => this.format(c)),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // 统计
  async getStats(params?: { clientId?: number; matterId?: number; startDate?: string; endDate?: string }) {
    const where: Prisma.CommunicationWhereInput = {};
    if (params?.clientId) where.clientId = params.clientId;
    if (params?.matterId) where.matterId = params.matterId;

    if (params?.startDate || params?.endDate) {
      where.sentAt = {};
      if (params.startDate) where.sentAt.gte = new Date(params.startDate);
      if (params.endDate) where.sentAt.lte = new Date(params.endDate);
    }

    const [total, byChannel, byDirection] = await Promise.all([
      prisma.communication.count({ where }),
      prisma.communication.groupBy({ by: ['channel'], _count: true, where }),
      prisma.communication.groupBy({ by: ['direction'], _count: true, where }),
    ]);

    const byChannelMap: Record<string, number> = {};
    for (const c of byChannel) byChannelMap[c.channel] = c._count;
    const byDirectionMap: Record<string, number> = {};
    for (const d of byDirection) byDirectionMap[d.direction] = d._count;

    // 最近沟通
    const recent = await prisma.communication.findMany({
      where,
      include: { client: true, matter: true, user: true },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    return {
      total,
      byChannel: byChannelMap,
      byDirection: byDirectionMap,
      inbound: byDirectionMap['INBOUND'] || 0,
      outbound: byDirectionMap['OUTBOUND'] || 0,
      recent: recent.map(c => this.format(c)),
    };
  }

  private format(comm: any): Communication {
    const parseJson = (v: any) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    return {
      ...comm,
      toAddrs: parseJson(comm.toAddrs),
      ccAddrs: parseJson(comm.ccAddrs),
      attachments: parseJson(comm.attachments),
      sentAt: comm.sentAt.toISOString(),
      readAt: comm.readAt?.toISOString() || null,
      createdAt: comm.createdAt.toISOString(),
      client: comm.client ? {
        id: comm.client.id,
        name: comm.client.name,
      } : undefined,
      matter: comm.matter ? {
        id: comm.matter.id,
        matterNo: comm.matter.matterNo,
        title: comm.matter.title,
      } : undefined,
      user: comm.user ? {
        id: comm.user.id,
        username: comm.user.username,
        realName: comm.user.realName,
      } : undefined,
    };
  }
}

export default new CommunicationService();
