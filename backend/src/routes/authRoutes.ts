// 公司法务智慧管理系统 - 认证路由
// 功能: 登录、注册、获取当前用户信息

import { Router, Request, Response } from 'express';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';
import {
  login,
  register,
  getCurrentUser
} from '../controllers/authController';

const router = Router();

// 用户登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    await login(req, res);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  }
});

// 用户注册（需要管理员权限）
router.post(
  '/register',
  authenticateToken,
  checkPermission('users:write'),
  async (req: Request, res: Response) => {
    try {
      await register(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 获取当前登录用户信息
router.get(
  '/me',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await getCurrentUser(req, res);
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

// 用户登出（客户端删除Token即可，服务端可选记录）
router.post(
  '/logout',
  authenticateToken,
  (req: Request, res: Response) => {
    // 可选：将Token加入黑名单（需要Redis）
    res.json({
      message: '登出成功'
    });
  }
);

// 刷新Token
router.post(
  '/refresh',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      
      // 生成新Token
      const newToken = jwt.sign(
        {
          userId: user.userId,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.json({
        message: 'Token刷新成功',
        token: newToken
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器内部错误'
      });
    }
  }
);

export default router;
