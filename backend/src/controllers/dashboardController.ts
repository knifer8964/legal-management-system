import { Request, Response, NextFunction } from 'express';
import { success } from '../utils/responseUtil';
import { getDashboardSummary } from '../services/dashboardService';
import { logger } from '../index';

/**
 * 获取 Dashboard 聚合统计数据
 * GET /api/v1/dashboard/summary
 */
export async function getSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getDashboardSummary();
    return success(res, data);
  } catch (error) {
    logger.error('获取 Dashboard 统计失败', { error: (error as Error).message });
    return next(error);
  }
}
