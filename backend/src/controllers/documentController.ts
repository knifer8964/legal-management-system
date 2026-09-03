// =====================================================
// 文档管理控制器 (M9)
// =====================================================

import { Request, Response, NextFunction } from 'express';
import documentService from '../services/documentService';
import { success, Errors } from '../utils/responseUtil';

export class DocumentController {
  // 创建文档（元数据）
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { fileName, filePath } = req.body;
      if (!fileName || !filePath) {
        return Errors.badRequest(res, 'fileName 和 filePath 为必填');
      }
      // 安全: 防止路径遍历攻击
      const normalizedPath = filePath.replace(/\\/g, '/');
      if (normalizedPath.includes('..') || normalizedPath.includes('//')) {
        return Errors.badRequest(res, '文件路径包含非法字符');
      }
      const userId = req.user?.userId || 0;
      return success(res, await documentService.create(req.body, userId), '文档创建成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // 列表（分页 + 筛选 + 搜索）
  async findAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string,
      };
      return success(res, await documentService.findAll(params));
    } catch (err: any) {
      return next(err);
    }
  }

  // 统计（按分类分组）
  async getStats(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return success(
        res,
        await documentService.getStats({
          clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
          matterId: req.query.matterId ? parseInt(req.query.matterId as string) : undefined,
        }),
      );
    } catch (err: any) {
      return next(err);
    }
  }

  // 详情
  async findById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      const doc = await documentService.findById(id);
      if (!doc) return Errors.notFound(res, '文档不存在');
      return success(res, doc);
    } catch (err: any) {
      return next(err);
    }
  }

  // 更新
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      return success(res, await documentService.update(id, req.body), '更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // 删除（物理删除）
  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');
      await documentService.delete(id);
      return success(res, null, '删除成功');
    } catch (err: any) {
      return next(err);
    }
  }
}

export default new DocumentController();
