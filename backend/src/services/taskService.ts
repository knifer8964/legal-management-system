// =====================================================
// 任务管理服务 - 业务逻辑层
// =====================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, TaskQueryParams, Task, TaskStatus } from '../types/api';

const prisma = new PrismaClient();

export class TaskService {
  // =====================================================
  // 创建任务
  // =====================================================
  async create(data: CreateTaskDto, userId: number): Promise<Task> {
    const task = await prisma.task.create({
      data: {
        matterId: data.matterId || null,
        userId: data.userId || userId,
        title: data.title,
        description: data.description || null,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      },
      include: {
        matter: { include: { client: true } },
        user: true,
      },
    });

    return this.formatTask(task);
  }

  // =====================================================
  // 更新任务
  // =====================================================
  async update(id: number, data: UpdateTaskDto): Promise<Task> {
    const updateData: any = { ...data };

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.reminderAt !== undefined) {
      updateData.reminderAt = data.reminderAt ? new Date(data.reminderAt) : null;
    }

    // 如果状态变为 DONE，自动设置完成时间
    if (data.status === 'DONE') {
      updateData.completedAt = new Date();
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        matter: { include: { client: true } },
        user: true,
      },
    });

    return this.formatTask(task);
  }

  // =====================================================
  // 切换状态
  // =====================================================
  async toggleStatus(id: number): Promise<Task> {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new Error('任务不存在');

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    const task2 = await prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        completedAt: newStatus === 'DONE' ? new Date() : null,
      },
    });

    return this.formatTask(task2);
  }

  // =====================================================
  // 删除任务
  // =====================================================
  async delete(id: number): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }

  // =====================================================
  // 获取任务详情
  // =====================================================
  async getById(id: number): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        matter: { include: { client: true } },
        user: true,
      },
    });

    if (!task) return null;
    return this.formatTask(task);
  }

  // =====================================================
  // 任务列表 (分页 + 筛选)
  // =====================================================
  async findAll(params: TaskQueryParams): Promise<{
    data: Task[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      matterId,
      userId,
      status,
      priority,
      search,
      overdue,
    } = params;

    const where: Prisma.TaskWhereInput = {};

    if (matterId) where.matterId = matterId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (overdue) {
      where.AND = [
        { status: { notIn: ['DONE', 'CANCELLED'] as TaskStatus[] } },
        { dueDate: { lt: new Date() } },
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          matter: { include: { client: true } },
          user: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: tasks.map(t => this.formatTask(t)),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // =====================================================
  // 任务统计
  // =====================================================
  async getStats(userId?: number) {
    const where: Prisma.TaskWhereInput = {};
    if (userId) where.userId = userId;

    const [total, byStatus, todayTasks, overdueTasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.groupBy({ by: ['status'], _count: true, where }),
      // 今日任务
      prisma.task.findMany({
        where: {
          ...where,
          status: { notIn: ['DONE', 'CANCELLED'] as TaskStatus[] },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: { matter: { include: { client: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      // 逾期任务
      prisma.task.findMany({
        where: {
          ...where,
          status: { notIn: ['DONE', 'CANCELLED'] as TaskStatus[] },
          dueDate: { lt: new Date() },
        },
        include: { matter: { include: { client: true } } },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
    ]);

    const byStatusMap: Record<string, number> = {};
    for (const item of byStatus) byStatusMap[item.status] = item._count;

    return {
      total,
      todo: byStatusMap['TODO'] || 0,
      inProgress: byStatusMap['IN_PROGRESS'] || 0,
      done: byStatusMap['DONE'] || 0,
      todayTasks: todayTasks.map(t => this.formatTask(t)),
      overdueTasks: overdueTasks.map(t => this.formatTask(t)),
    };
  }

  // =====================================================
  // 辅助方法
  // =====================================================
  private formatTask(task: any): Task {
    return {
      ...task,
      dueDate: task.dueDate?.toISOString() || null,
      completedAt: task.completedAt?.toISOString() || null,
      reminderAt: task.reminderAt?.toISOString() || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      user: task.user ? {
        id: task.user.id,
        username: task.user.username,
        realName: task.user.realName,
      } : undefined,
      matter: task.matter ? {
        id: task.matter.id,
        matterNo: task.matter.matterNo,
        title: task.matter.title,
        client: task.matter.client ? { id: task.matter.client.id, name: task.matter.client.name } : undefined,
      } : undefined,
    };
  }
}

export default new TaskService();
