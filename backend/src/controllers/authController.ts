// 公司法务智慧管理系统 - 认证控制器
// 功能: 用户登录、注册、获取当前用户信息
// 统一响应格式: { success, data, message? }

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../index';
import { success, created, Errors } from '../utils/responseUtil';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 将权限对象转换为权限代码数组
function extractPermissionCodes(permissions: any): string[] {
  if (!permissions) return [];
  
  const codes: string[] = [];
  for (const [module, actions] of Object.entries(permissions)) {
    if (Array.isArray(actions)) {
      for (const action of actions) {
        codes.push(`${module}:${action}`);
      }
    }
  }
  return codes;
}

// 用户登录
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return Errors.badRequest(res, '用户名和密码不能为空');
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });

    if (!user) {
      return Errors.unauthorized(res, '用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return Errors.unauthorized(res, '用户名或密码错误');
    }

    if (user.status === 'INACTIVE' || user.status === 'LOCKED') {
      return Errors.forbidden(res, '账号已被禁用或锁定，请联系管理员');
    }

    // 从 role.permissions JSON 提取权限代码
    const permissionCodes = extractPermissionCodes(user.role.permissions);

    // 生成 JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role.roleName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    logger.info('用户登录成功', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    // 返回格式与前端 LoginResponse 对齐
    return success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.realName,
        role: user.role.roleName,
        permissions: permissionCodes,
        email: user.email,
        avatar: null
      }
    }, '登录成功');

  } catch (error) {
    logger.error('登录失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

// 用户注册（仅管理员可操作）
export async function register(req: Request, res: Response) {
  try {
    const { username, password, realName, email, phone, roleId } = req.body;

    if (!username || !password || !realName || !roleId) {
      return Errors.badRequest(res, '缺少必填字段');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return Errors.conflict(res, '用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        realName,
        email,
        phone,
        roleId: parseInt(roleId)
      },
      include: { role: true }
    });

    logger.info('用户创建成功', {
      operator: (req as any).user?.username,
      newUserId: newUser.id,
      newUsername: newUser.username
    });

    return created(res, {
      id: newUser.id,
      username: newUser.username,
      realName: newUser.realName,
      email: newUser.email,
      role: newUser.role.roleName
    }, '用户创建成功');

  } catch (error) {
    logger.error('用户注册失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

// 获取当前用户信息
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return Errors.notFound(res, '用户不存在');
    }

    const permissionCodes = extractPermissionCodes(user.role.permissions);

    return success(res, {
      id: user.id,
      username: user.username,
      name: user.realName,
      role: user.role.roleName,
      permissions: permissionCodes,
      email: user.email,
      phone: user.phone,
      avatar: null,
      lastLoginAt: user.lastLoginAt
    });

  } catch (error) {
    logger.error('获取用户信息失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}

// 修改密码
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return Errors.badRequest(res, '请输入旧密码和新密码');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return Errors.notFound(res, '用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return Errors.badRequest(res, '旧密码不正确');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return success(res, null, '密码修改成功');

  } catch (error) {
    logger.error('修改密码失败', { error: (error as Error).message });
    return Errors.internal(res);
  }
}
