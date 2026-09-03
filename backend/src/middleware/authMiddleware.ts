// 公司法务智慧管理系统 - 认证中间件
// 功能: JWT Token 验证、权限检查

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 扩展 Request 类型，添加 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
      };
    }
  }
}

// JWT Token 验证中间件
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '未提供认证令牌'
      });
    }
    
    // 验证 Token
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        // Token 过期
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Unauthorized',
            message: '令牌已过期，请重新登录'
          });
        }
        
        // Token 无效
        return res.status(403).json({
          error: 'Forbidden',
          message: '令牌无效'
        });
      }
      
      // 将用户信息附加到请求对象
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
      
      next();
      return;
    });
  } catch (error) {
    console.error('Token 验证失败:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }

  return;
}

// 权限检查中间件工厂
export function checkPermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: '未认证'
        });
      }
      
      // 从数据库查询用户最新权限
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { role: true }
      });
      
      if (!dbUser) {
        return res.status(404).json({
          error: 'Not Found',
          message: '用户不存在'
        });
      }
      
      const permissions = dbUser.role.permissions;
      
      // 通配权限 ["*"] 或 { all: true } — 管理员拥有所有权限
      if (Array.isArray(permissions) && permissions.includes('*')) {
        return next();
      }
      if (permissions && typeof permissions === 'object' && !Array.isArray(permissions) && permissions.all === true) {
        return next();
      }
      
      // 数组格式权限: ["user:read", "client:*", "matter:*", ...]
      if (Array.isArray(permissions)) {
        const [mod, act] = requiredPermission.split(':');
        const actionMap: Record<string, string> = {
          'view': 'read', 'read': 'read',
          'create': 'write', 'write': 'write', 'edit': 'write', 'update': 'write',
          'delete': 'delete', 'approve': 'approve', 'manage': 'admin',
        };
        const normalizedAction = actionMap[act] || act;
        
        for (const perm of permissions) {
          if (typeof perm !== 'string') continue;
          if (perm === '*') return next();
          const [pMod, pAct] = perm.split(':');
          if (pMod === mod && (pAct === '*' || pAct === normalizedAction || pAct === act)) {
            return next();
          }
        }
      }
      
      // 对象格式权限: { module: [actions] }
      if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
        const parts = requiredPermission.split(':');
        if (parts.length === 2) {
          const [module, action] = parts;
          const actionMap: Record<string, string> = {
            'view': 'read', 'read': 'read',
            'create': 'write', 'write': 'write', 'edit': 'write', 'update': 'write',
            'delete': 'delete', 'approve': 'approve', 'manage': 'admin',
          };
          const normalizedAction = actionMap[action] || action;
          
          if (permissions[module]) {
            const modulePerms = permissions[module];
            if (Array.isArray(modulePerms)) {
              if (modulePerms.includes(normalizedAction) || modulePerms.includes('admin') || modulePerms.includes('*')) {
                return next();
              }
            } else if (modulePerms === true || modulePerms === 'admin' || modulePerms === '*') {
              return next();
            }
          }
          
          if (permissions.system && Array.isArray(permissions.system) && permissions.system.includes('admin')) {
            return next();
          }
        }
      }
      
      // 权限不足
      return res.status(403).json({
        error: 'Forbidden',
        message: `权限不足，需要 ${requiredPermission} 权限`
      });
      
    } catch (error) {
      console.error('权限检查失败:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  };
}

// 可选认证中间件（不强制要求登录）
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (!err) {
          req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
          };
        }
      });
    }
    
    next();
  } catch (error) {
    // 可选认证失败不影响请求
    next();
  }
}