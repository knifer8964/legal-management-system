// =====================================================
// 角色管理控制器 - HTTP 请求处理
// =====================================================

import { Request, Response, NextFunction } from 'express';
import roleService from '../services/roleService';
import { success, created, successWithPagination, Errors } from '../utils/responseUtil';
import { logger } from '../index';

/**
 * 获取角色列表（分页）
 * GET /api/v1/roles
 */
export async function findAll(req: Request, res: Response, _next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const keyword = req.query.keyword as string | undefined;

    const result = await roleService.findAll({ page, pageSize, keyword });
    return successWithPagination(res, result.data, {
      page: result.pagination.page,
      limit: result.pagination.pageSize,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
    });
  } catch (error) {
    logger.error('获取角色列表失败', { error: (error as Error).message });
    return _next(error);
  }
}

/**
 * 获取角色详情
 * GET /api/v1/roles/:id
 */
export async function findById(req: Request, res: Response, _next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return Errors.badRequest(res, '无效的角色ID');
    }

    const role = await roleService.findById(id);
    if (!role) {
      return Errors.notFound(res, '角色不存在');
    }

    return success(res, role);
  } catch (error) {
    logger.error('获取角色详情失败', { error: (error as Error).message, roleId: req.params.id });
    return _next(error);
  }
}

/**
 * 创建角色
 * POST /api/v1/roles
 */
export async function create(req: Request, res: Response, _next: NextFunction) {
  try {
    const { roleName, description, permissions } = req.body;

    if (!roleName) {
      return Errors.badRequest(res, '缺少必填字段（roleName）');
    }

    const role = await roleService.create({ roleName, description, permissions });

    logger.info('角色创建成功', {
      roleId: role.id,
      roleName: role.roleName,
      operatorId: (req as any).user.userId,
    });

    return created(res, role, '角色创建成功');
  } catch (error: any) {
    if (error.message?.includes('角色名已存在')) {
      return Errors.conflict(res, error.message);
    }
    logger.error('创建角色失败', { error: (error as Error).message });
    return _next(error);
  }
}

/**
 * 更新角色
 * PUT /api/v1/roles/:id
 */
export async function update(req: Request, res: Response, _next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return Errors.badRequest(res, '无效的角色ID');
    }

    const { roleName, description, permissions } = req.body;

    const existing = await roleService.findById(id);
    if (!existing) {
      return Errors.notFound(res, '角色不存在');
    }

    const role = await roleService.update(id, { roleName, description, permissions });

    logger.info('角色更新成功', {
      roleId: role.id,
      operatorId: (req as any).user.userId,
    });

    return success(res, role, '角色更新成功');
  } catch (error: any) {
    if (error.message?.includes('角色名已存在')) {
      return Errors.conflict(res, error.message);
    }
    logger.error('更新角色失败', { error: (error as Error).message, roleId: req.params.id });
    return _next(error);
  }
}

/**
 * 删除角色
 * DELETE /api/v1/roles/:id
 */
export async function remove(req: Request, res: Response, _next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return Errors.badRequest(res, '无效的角色ID');
    }

    const existing = await roleService.findById(id);
    if (!existing) {
      return Errors.notFound(res, '角色不存在');
    }

    await roleService.delete(id);

    logger.info('角色删除成功', {
      roleId: id,
      operatorId: (req as any).user.userId,
    });

    return success(res, null, '角色删除成功');
  } catch (error: any) {
    if (error.message?.includes('无法删除')) {
      return Errors.badRequest(res, error.message);
    }
    logger.error('删除角色失败', { error: (error as Error).message, roleId: req.params.id });
    return _next(error);
  }
}

/**
 * 获取角色下的用户列表
 * GET /api/v1/roles/:id/users
 */
export async function getUsers(req: Request, res: Response, _next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return Errors.badRequest(res, '无效的角色ID');
    }

    const role = await roleService.findById(id);
    if (!role) {
      return Errors.notFound(res, '角色不存在');
    }

    const users = await roleService.getUsers(id);
    return success(res, users);
  } catch (error) {
    logger.error('获取角色用户列表失败', { error: (error as Error).message, roleId: req.params.id });
    return _next(error);
  }
}
