// 公司法务智慧管理系统 - 认证控制器
// 功能: 用户登录、注册、Token 验证

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../index';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 用户登录
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '用户名和密码不能为空'
      });
    }
    
    // 查询用户
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '用户名或密码错误'
      });
    }
    
    // 检查账号状态
    if (user.status === 'INACTIVE' || user.status === 'LOCKED') {
      return res.status(403).json({
        error: 'Forbidden',
        message: '账号已被禁用或锁定，请联系管理员'
      });
    }
    
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
    
    // 记录日志
    logger.info('用户登录成功', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });
    
    // 返回结果
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        role: user.role.roleName,
        permissions: user.role.permissions
      }
    });
    
  } catch (error) {
    logger.error('登录失败', { error: (error as Error).message });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }

  return;
}

// 用户注册（仅管理员可操作）
export async function register(req: Request, res: Response) {
  try {
    const { username, password, realName, email, phone, roleId } = req.body;
    
    // 参数验证
    if (!username || !password || !realName || !roleId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '缺少必填字段'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: '用户名已存在'
      });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
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
      operator: (req as any).user.username,
      newUserId: newUser.id,
      newUsername: newUser.username
    });
    
    res.status(201).json({
      message: '用户创建成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        realName: newUser.realName,
        email: newUser.email,
        role: newUser.role.roleName
      }
    });
    
  } catch (error) {
    logger.error('用户注册失败', { error: (error as Error).message });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }

  return;
}

// 验证 Token 中间件
export async function authenticateToken(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '未提供认证令牌'
      });
    }
    
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '令牌无效或已过期'
        });
      }
      
      (req as any).user = user;
      next();
      return;
    });
    return;
  } catch (error) {
    logger.error('Token 验证失败', { error: (error as Error).message });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }

  return;
}

// 检查权限中间件
export function checkPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const user = (req as any).user;
      
      // 从数据库重新查询用户权限（确保最新）
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { role: true }
      });
      
      if (!dbUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: '用户不存在'
        });
      }
      
      const permissions = dbUser.role.permissions as any;
      
      // 检查权限（支持通配符）
      if (permissions.all === true) {
        return next(); // 管理员拥有所有权限
      }
      
      if (!permissions[requiredPermission]) {
        return res.status(403).json({
          error: 'Forbidden',
          message: '权限不足'
        });
      }
      
      next();
      
    } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
  };
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
      return res.status(404).json({
        error: 'Not Found',
        message: '用户不存在'
      });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        role: user.role.roleName,
        permissions: user.role.permissions,
        lastLoginAt: user.lastLoginAt
      }
    });
    
  } catch (error) {
    logger.error('获取用户信息失败', { error: (error as Error).message });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }

  return;
}
