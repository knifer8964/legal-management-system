import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { success, Errors } from '../utils/responseUtil';
import { logger } from '../index';

const prisma = new PrismaClient();

/**
 * 获取仪表盘统计数据
 * GET /api/v1/dashboard/stats
 */
export async function getDashboardStats(_req: Request, res: Response, _next: NextFunction) {
  try {
    // 并行查询所有统计数据
    const [
      totalContracts,
      contractsByStatus,
      totalCases,
      casesByStatus,
      totalUsers,
      activeUsers,
      recentContracts,
      recentCases
    ] = await Promise.all([
      // 合同总数
      prisma.contract.count(),
      
      // 按状态统计合同
      prisma.contract.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // 案件总数
      prisma.case.count(),
      
      // 按状态统计案件
      prisma.case.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // 用户总数
      prisma.user.count(),
      
      // 活跃用户数
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      
      // 最近5个合同
      prisma.contract.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          contractNo: true,
          title: true,
          status: true,
          createdAt: true,
          creator: { select: { realName: true } }
        }
      }),
      
      // 最近5个案件
      prisma.case.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          caseNo: true,
          title: true,
          status: true,
          createdAt: true,
          creator: { select: { realName: true } }
        }
      })
    ]);

    // 处理合同状态统计
    const contractStats = contractsByStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // 处理案件状态统计
    const caseStats = casesByStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    const stats = {
      contracts: {
        total: totalContracts,
        byStatus: contractStats
      },
      cases: {
        total: totalCases,
        byStatus: caseStats
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      recent: {
        contracts: recentContracts,
        cases: recentCases
      }
    };

    return success(res, stats);
  } catch (error) {
    logger.error('获取仪表盘统计失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

/**
 * 获取合同统计详情
 * GET /api/v1/dashboard/contracts/stats
 */
export async function getContractStats(_req: Request, res: Response, _next: NextFunction) {
  try {
    const [
      totalAmount,
      monthlyStats,
      typeStats
    ] = await Promise.all([
      // 合同总金额
      prisma.contract.aggregate({
        _sum: { amount: true }
      }),
      
      // 本月合同统计
      prisma.$queryRaw<Array<{ month: string; count: bigint; total_amount: number }>>`
        SELECT 
          DATE_FORMAT(sign_date, '%Y-%m') as month,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as total_amount
        FROM contracts
        WHERE sign_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(sign_date, '%Y-%m')
        ORDER BY month DESC
      `,
      
      // 按类型统计
      prisma.contract.groupBy({
        by: ['contractType'],
        _count: { contractType: true },
        where: { contractType: { not: null } }
      })
    ]);

    const stats = {
      totalAmount: totalAmount._sum.amount || 0,
      monthly: monthlyStats,
      byType: typeStats
    };

    return success(res, stats);
  } catch (error) {
    logger.error('获取合同统计详情失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

/**
 * 获取案件统计详情
 * GET /api/v1/dashboard/cases/stats
 */
export async function getCaseStats(_req: Request, res: Response, _next: NextFunction) {
  try {
    const [
      typeStats,
      monthlyStats
    ] = await Promise.all([
      // 按类型统计
      prisma.case.groupBy({
        by: ['caseType'],
        _count: { caseType: true }
      }),
      
      // 本月案件统计
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT 
          DATE_FORMAT(filing_date, '%Y-%m') as month,
          COUNT(*) as count
        FROM cases
        WHERE filing_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(filing_date, '%Y-%m')
        ORDER BY month DESC
      `
    ]);

    const stats = {
      byType: typeStats,
      monthly: monthlyStats
    };

    return success(res, stats);
  } catch (error) {
    logger.error('获取案件统计详情失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}
