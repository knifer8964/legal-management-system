// =====================================================
// 计时收费服务
// =====================================================

import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  TimeEntryQueryParams,
  TimeEntry,
} from '../types/api';

const prisma = new PrismaClient();

export class TimeEntryService {
  // 开始计时
  async start(data: CreateTimeEntryDto, userId: number): Promise<TimeEntry> {
    // 检查是否有未停止的计时
    const running = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (running) {
      throw new Error('已有正在进行的计时，请先停止当前计时');
    }

    const matter = await prisma.matter.findUnique({
      where: { id: data.matterId },
      select: { hourlyRate: true },
    });

    const entry = await prisma.timeEntry.create({
      data: {
        matterId: data.matterId,
        clientId: data.clientId,
        userId,
        description: data.description,
        hourlyRate: data.hourlyRate || Number(matter?.hourlyRate) || 0,
        isBillable: data.isBillable !== false,
        startTime: new Date(),
      },
      include: { matter: true, client: true, user: true },
    });

    return this.format(entry);
  }

  // 停止计时
  async stop(id: number): Promise<TimeEntry> {
    const endTime = new Date();

    // 原子操作：update 的 where 条件中加 endTime: null 守卫，防止并发重复停止
    const entry = await prisma.timeEntry.update({
      where: { id, endTime: null },
      data: {
        endTime,
        duration: 0, // 先占位，下面按实际时间更新
        amount: 0,
      },
      include: { matter: true, client: true, user: true },
    }).catch(() => null);

    if (!entry) {
      // 记录可能已被停止或不存在
      const existing = await prisma.timeEntry.findUnique({ where: { id } });
      if (!existing) throw new Error('计时记录不存在');
      if (existing.endTime) throw new Error('计时已停止');
      throw new Error('停止计时失败');
    }

    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000);
    const amount = entry.isBillable
      ? Math.round(Number(entry.hourlyRate) * (duration / 60) * 100) / 100
      : 0;

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: { duration, amount },
      include: { matter: true, client: true, user: true },
    });

    // 更新业务的累计金额和时长
    const [matterStats] = await Promise.all([
      prisma.timeEntry.aggregate({
        where: { matterId: entry.matterId },
        _sum: { duration: true, amount: true },
      }),
    ]);

    await prisma.matter.update({
      where: { id: entry.matterId },
      data: {
        totalAmount: matterStats._sum.amount || 0,
        progress: Math.min(100, Math.round(((matterStats._sum.duration || 0) / 60) * 10)),
      },
    });

    return this.format(updated);
  }

  // 获取进行中的计时
  async getRunning(userId: number): Promise<TimeEntry | null> {
    const running = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: { matter: true, client: true, user: true },
      orderBy: { startTime: 'desc' },
    });

    if (!running) return null;

    // 实时计算已过时长
    const now = new Date();
    const runningMinutes = Math.round((now.getTime() - running.startTime.getTime()) / 60000);

    return {
      ...this.format(running),
      duration: runningMinutes, // 实时值
      amount: running.isBillable
        ? Math.round(Number(running.hourlyRate) * (runningMinutes / 60) * 100) / 100
        : 0,
    };
  }

  // 创建手动计时
  async createManual(data: CreateTimeEntryDto & { startTime: string; endTime: string }, userId: number): Promise<TimeEntry> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const matter = await prisma.matter.findUnique({
      where: { id: data.matterId },
      select: { hourlyRate: true },
    });

    const entry = await prisma.timeEntry.create({
      data: {
        matterId: data.matterId,
        clientId: data.clientId,
        userId,
        description: data.description,
        hourlyRate: data.hourlyRate || Number(matter?.hourlyRate) || 0,
        isBillable: data.isBillable !== false,
        startTime,
        endTime,
        duration,
        amount: data.isBillable !== false
          ? Math.round(Number(data.hourlyRate || matter?.hourlyRate || 0) * (duration / 60) * 100) / 100
          : 0,
      },
      include: { matter: true, client: true, user: true },
    });

    return this.format(entry);
  }

  // 更新计时记录
  async update(id: number, data: UpdateTimeEntryDto): Promise<TimeEntry> {
    const updateData: any = { ...data };

    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    // 如果同时更新了起止时间，重新计算
    if (data.startTime || data.endTime) {
      const entry = await prisma.timeEntry.findUnique({ where: { id } });
      if (entry) {
        const s = data.startTime ? new Date(data.startTime) : entry.startTime;
        const e = data.endTime ? new Date(data.endTime) : entry.endTime;
        if (s && e) {
          updateData.duration = Math.round((e.getTime() - s.getTime()) / 60000);
          updateData.amount = entry.isBillable
            ? Math.round(Number(entry.hourlyRate) * (updateData.duration / 60) * 100) / 100
            : 0;
        }
      }
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: { matter: true, client: true, user: true },
    });

    return this.format(updated);
  }

  // 查询单条计时记录
  async findById(id: number): Promise<TimeEntry | null> {
    const entry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { matter: true, client: true, user: true },
    });
    if (!entry) return null;
    return this.format(entry);
  }

  // 删除计时记录
  async delete(id: number): Promise<void> {
    await prisma.timeEntry.delete({ where: { id } });
  }

  // 列表
  async findAll(params: TimeEntryQueryParams): Promise<{
    data: TimeEntry[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'startTime',
      sortOrder = 'desc',
      matterId,
      clientId,
      userId,
      isBilled,
      isBillable,
      startDate,
      endDate,
    } = params;

    const where: Prisma.TimeEntryWhereInput = {};
    if (matterId) where.matterId = matterId;
    if (clientId) where.clientId = clientId;
    if (userId) where.userId = userId;
    if (isBilled !== undefined) where.isBilled = isBilled;
    if (isBillable !== undefined) where.isBillable = isBillable;

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const [total, entries] = await Promise.all([
      prisma.timeEntry.count({ where }),
      prisma.timeEntry.findMany({
        where,
        include: { matter: true, client: true, user: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: entries.map(e => this.format(e)),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // 统计
  async getStats(params?: { userId?: number; startDate?: string; endDate?: string }) {
    const where: Prisma.TimeEntryWhereInput = {};
    if (params?.userId) where.userId = params.userId;

    if (params?.startDate || params?.endDate) {
      where.startTime = {};
      if (params.startDate) where.startTime.gte = new Date(params.startDate);
      if (params.endDate) where.startTime.lte = new Date(params.endDate);
    }

    const [all, unbilled] = await Promise.all([
      prisma.timeEntry.aggregate({
        where,
        _sum: { duration: true, amount: true },
        _count: true,
      }),
      prisma.timeEntry.aggregate({
        where: { ...where, isBilled: false, isBillable: true },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalEntries: all._count,
      totalMinutes: all._sum.duration || 0,
      totalHours: Math.round((all._sum.duration || 0) / 6) / 10,
      totalAmount: Math.round(Number(all._sum.amount || 0) * 100) / 100,
      unbilledCount: unbilled._count,
      unbilledAmount: Math.round(Number(unbilled._sum.amount || 0) * 100) / 100,
    };
  }

  private format(entry: any): TimeEntry {
    return {
      ...entry,
      hourlyRate: Number(entry.hourlyRate),
      amount: entry.amount ? Number(entry.amount) : null,
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime?.toISOString() || null,
      createdAt: entry.createdAt.toISOString(),
      matter: entry.matter ? {
        id: entry.matter.id,
        matterNo: entry.matter.matterNo,
        title: entry.matter.title,
      } : undefined,
      client: entry.client ? {
        id: entry.client.id,
        name: entry.client.name,
      } : undefined,
      user: entry.user ? {
        id: entry.user.id,
        username: entry.user.username,
        realName: entry.user.realName,
      } : undefined,
    };
  }
}

export default new TimeEntryService();
