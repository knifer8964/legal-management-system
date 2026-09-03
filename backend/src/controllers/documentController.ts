// =====================================================
// 文档管理控制器 (M9)
// =====================================================

import { Request, Response, NextFunction } from 'express';
import documentService from '../services/documentService';
import { success, Errors } from '../utils/responseUtil';

export class DocumentController {
  // 上传文档（真实文件，multipart/form-data）
  async upload(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req.file) {
        return Errors.badRequest(res, '未接收到上传文件');
      }

      const userId = req.user?.userId || 0;
      const clientId = req.body.clientId ? parseInt(req.body.clientId, 10) : undefined;
      const matterId = req.body.matterId ? parseInt(req.body.matterId, 10) : undefined;
      const data = {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path.replace(/\\/g, '/'),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        clientId: clientId && !isNaN(clientId) ? clientId : undefined,
        matterId: matterId && !isNaN(matterId) ? matterId : undefined,
        category: req.body.category || undefined,
        tags: this.parseTags(req.body.tags),
        description: req.body.description || undefined,
      };

      return success(res, await documentService.create(data, userId), '文档上传成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // 下载文档（真实文件）
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        Errors.badRequest(res, '无效ID');
        return;
      }
      const doc = await documentService.findById(id);
      if (!doc) {
        Errors.notFound(res, '文档不存在');
        return;
      }
      res.download(doc.filePath, doc.originalName || doc.fileName, (err) => {
        if (err && !res.headersSent) {
          next(err);
        }
      });
    } catch (err: any) {
      next(err);
    }
  }

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

  // 解析 tags（multipart 中为字符串，需转成数组）
  private parseTags(tags: any): any {
    if (tags === undefined || tags === null || tags === '') return undefined;
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      const trimmed = tags.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // 非法 JSON，按逗号分隔处理
        }
      }
      return trimmed.split(',').map((t) => t.trim()).filter(Boolean);
    }
    return tags;
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
