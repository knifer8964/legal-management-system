import { PrismaClient, MatterStatus, TaskStatus, ClientStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取 Dashboard 聚合统计数据
 * 一次性返回客户、业务、任务、计时、发票、文档全部统计
 */
export async function getDashboardSummary() {
  const [
    clientStats,
    matterStats,
    taskStats,
    timeStats,
    invoiceStats,
    documentStats,
    recentMatters,
    upcomingTasks,
    overdueTasks,
    upcomingDeadlines,
  ] = await Promise.all([
    // 客户统计
    prisma.client.groupBy({ by: ['status'], _count: true }),
    // 业务统计
    prisma.matter.groupBy({ by: ['status'], _count: true }),
    // 任务统计
    prisma.task.groupBy({ by: ['status'], _count: true }),
    // 计时统计（本月）
    prisma.timeEntry.aggregate({
      where: {
        startTime: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { duration: true, amount: true },
      _count: true,
    }),
    // 发票统计
    prisma.invoice.aggregate({
      _sum: { totalAmount: true, paidAmount: true, subtotal: true, taxAmount: true },
      _count: true,
    }),
    // 文档统计
    prisma.document.aggregate({
      _sum: { fileSize: true },
      _count: true,
    }),
    // 最近业务（5条）
    prisma.matter.findMany({
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // 即将到期任务（7天内）
    prisma.task.findMany({
      where: {
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { matter: { select: { title: true, client: { select: { name: true } } } } },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    // 逾期任务
    prisma.task.findMany({
      where: {
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        dueDate: { lt: new Date() },
      },
      include: { matter: { select: { title: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    // 即将到期业务（7天内截止）
    prisma.matter.findMany({
      where: {
        status: { notIn: [MatterStatus.COMPLETED, MatterStatus.ARCHIVED, MatterStatus.CANCELLED] },
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: { client: { select: { name: true } } },
      orderBy: { deadline: 'asc' },
      take: 5,
    }),
  ]);

  // 构建客户统计 Map
  const clientByStatus: Record<string, number> = {};
  for (const c of clientStats) clientByStatus[c.status] = c._count;
  const totalClients = Object.values(clientByStatus).reduce((s, n) => s + n, 0);

  // 构建业务统计 Map
  const matterByStatus: Record<string, number> = {};
  for (const m of matterStats) matterByStatus[m.status] = m._count;
  const totalMatters = Object.values(matterByStatus).reduce((s, n) => s + n, 0);

  // 构建任务统计 Map
  const taskByStatus: Record<string, number> = {};
  for (const t of taskStats) taskByStatus[t.status] = t._count;
  const totalTasks = Object.values(taskByStatus).reduce((s, n) => s + n, 0);

  // 发票状态明细
  const invoiceByStatus = await prisma.invoice.groupBy({
    by: ['status'],
    _count: true,
    _sum: { totalAmount: true },
  });
  const invoiceBreakdown: Record<string, { count: number; amount: number }> = {};
  for (const inv of invoiceByStatus) {
    invoiceBreakdown[inv.status] = {
      count: inv._count,
      amount: Number(inv._sum.totalAmount || 0),
    };
  }

  return {
    clients: {
      total: totalClients,
      active: clientByStatus[ClientStatus.ACTIVE] || 0,
      potential: clientByStatus[ClientStatus.POTENTIAL] || 0,
      inactive: clientByStatus[ClientStatus.INACTIVE] || 0,
      byStatus: clientByStatus,
    },
    matters: {
      total: totalMatters,
      pending: matterByStatus[MatterStatus.PENDING] || 0,
      inProgress: (matterByStatus[MatterStatus.IN_PROGRESS] || 0) + (matterByStatus[MatterStatus.REVIEWING] || 0),
      waitingClient: matterByStatus[MatterStatus.WAITING_CLIENT] || 0,
      completed: matterByStatus[MatterStatus.COMPLETED] || 0,
      byStatus: matterByStatus,
      upcomingDeadlines,
    },
    tasks: {
      total: totalTasks,
      todo: taskByStatus[TaskStatus.TODO] || 0,
      inProgress: taskByStatus[TaskStatus.IN_PROGRESS] || 0,
      done: taskByStatus[TaskStatus.DONE] || 0,
      byStatus: taskByStatus,
      upcomingTasks,
      overdueTasks,
    },
    timeEntries: {
      totalEntries: timeStats._count,
      totalDuration: timeStats._sum?.duration || 0,
      totalBillable: Number(timeStats._sum?.amount || 0),
    },
    invoices: {
      totalInvoices: invoiceStats._count,
      totalAmount: Math.round(Number(invoiceStats._sum.totalAmount || 0) * 100) / 100,
      totalPaid: Math.round(Number(invoiceStats._sum.paidAmount || 0) * 100) / 100,
      totalUnpaid: Math.round(
        (Number(invoiceStats._sum.totalAmount || 0) - Number(invoiceStats._sum.paidAmount || 0)) * 100,
      ) / 100,
      statusBreakdown: invoiceBreakdown,
    },
    documents: {
      totalDocuments: documentStats._count,
      totalSize: Number(documentStats._sum.fileSize || 0),
    },
    recentMatters,
  };
}
