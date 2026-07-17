import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { success, created, successWithPagination, Errors } from '../utils/responseUtil';
import { logger } from '../index';

const prisma = new PrismaClient();

/**
 * 获取用户列表（支持分页、筛选、搜索）
 * GET /api/v1/users
 */
export async function getUsers(req: Request, res: Response, _next: NextFunction) {
  try {
    const {
      page = '1',
      pageSize = '20',
      roleId,
      status,
      keyword,
      sortField = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (roleId) where.roleId = parseInt(roleId as string);
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { username: { contains: keyword as string, mode: 'insensitive' } },
        { realName: { contains: keyword as string, mode: 'insensitive' } },
        { email: { contains: keyword as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          realName: true,
          email: true,
          phone: true,
          department: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { id: true, roleName: true } }
        },
        orderBy: { [sortField as string]: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    return successWithPagination(res, users, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    logger.error('获取用户列表失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

/**
 * 获取单个用户详情
 * GET /api/v1/users/:id
 */
export async function getUserById(req: Request, res: Response, _next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        department: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, roleName: true, permissions: true } }
      }
    });

    if (!user) {
      return Errors.notFound(res, '用户不存在');
    }

    return success(res, user);
  } catch (error) {
    logger.error('获取用户详情失败', { error: (error as Error).message, userId: req.params.id });
    return Errors.internal(res);
  }
}

/**
 * 创建用户
 * POST /api/v1/users
 */
export async function createUser(req: Request, res: Response, _next: NextFunction) {
  try {
    const {
      username,
      password,
      realName,
      email,
      phone,
      roleId,
      department,
      status = 'ACTIVE'
    } = req.body;

    // 参数验证
    if (!username || !password || !realName || !roleId) {
      return Errors.badRequest(res, '缺少必填字段（username, password, realName, roleId）');
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return Errors.conflict(res, '用户名已存在');
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return Errors.conflict(res, '邮箱已被注册');
      }
    }

    // 检查角色是否存在
    const role = await prisma.role.findUnique({ where: { id: parseInt(roleId) } });
    if (!role) {
      return Errors.badRequest(res, '角色不存在');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        realName,
        email,
        phone,
        roleId: parseInt(roleId),
        department,
        status
      },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        department: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, roleName: true } }
      }
    });

    logger.info('用户创建成功', {
      userId: newUser.id,
      username: newUser.username,
      creatorId: (req as any).user.userId
    });

    return created(res, newUser, '用户创建成功');
  } catch (error) {
    logger.error('创建用户失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

/**
 * 更新用户
 * PUT /api/v1/users/:id
 */
export async function updateUser(req: Request, res: Response, _next: NextFunction) {
  try {
    const { id } = req.params;
    const {
      realName,
      email,
      phone,
      roleId,
      department,
      status
    } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return Errors.notFound(res, '用户不存在');
    }

    // 检查邮箱是否被其他用户使用
    if (email && email !== existing.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return Errors.conflict(res, '邮箱已被其他用户使用');
      }
    }

    const updateData: any = {};
    if (realName !== undefined) updateData.realName = realName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (roleId !== undefined) {
      // 检查角色是否存在
      const role = await prisma.role.findUnique({ where: { id: parseInt(roleId) } });
      if (!role) {
        return Errors.badRequest(res, '角色不存在');
      }
      updateData.roleId = parseInt(roleId);
    }
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        department: true,
        status: true,
        updatedAt: true,
        role: { select: { id: true, roleName: true } }
      }
    });

    logger.info('用户更新成功', {
      userId: updated.id,
      operatorId: (req as any).user.userId
    });

    return success(res, updated, '用户更新成功');
  } catch (error) {
    logger.error('更新用户失败', { error: (error as Error).message, userId: req.params.id });
    return Errors.internal(res);
  }
}

/**
 * 删除用户（软删除，更新状态为 INACTIVE）
 * DELETE /api/v1/users/:id
 */
export async function deleteUser(req: Request, res: Response, _next: NextFunction) {
  try {
    const { id } = req.params;
    const operatorId = (req as any).user.userId;

    // 不能删除自己
    if (parseInt(id) === operatorId) {
      return Errors.badRequest(res, '不能删除当前登录用户');
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return Errors.notFound(res, '用户不存在');
    }

    // 软删除：更新状态为 INACTIVE
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'INACTIVE' }
    });

    logger.info('用户删除成功（软删除）', {
      userId: parseInt(id),
      operatorId
    });

    return success(res, null, '用户已停用');
  } catch (error) {
    logger.error('删除用户失败', { error: (error as Error).message, userId: req.params.id });
    return Errors.internal(res);
  }
}

/**
 * 重置用户密码
 * POST /api/v1/users/:id/reset-password
 */
export async function resetPassword(req: Request, res: Response, _next: NextFunction) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return Errors.badRequest(res, '缺少新密码');
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return Errors.notFound(res, '用户不存在');
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { passwordHash }
    });

    logger.info('密码重置成功', {
      userId: parseInt(id),
      operatorId: (req as any).user.userId
    });

    return success(res, null, '密码重置成功');
  } catch (error) {
    logger.error('重置密码失败', { error: (error as Error).message, userId: req.params.id });
    return Errors.internal(res);
  }
}

/**
 * 获取角色列表
 * GET /api/v1/roles
 */
export async function getRoles(_req: Request, res: Response, _next: NextFunction) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { users: true } } }
    });

    return success(res, roles);
  } catch (error) {
    logger.error('获取角色列表失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}
