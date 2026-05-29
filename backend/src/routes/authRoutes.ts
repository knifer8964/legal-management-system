// 公司法务智慧管理系统 - 认证路由
// 功能: 登录、注册、获取当前用户信息、刷新Token

import { Router, Request, Response } from 'express';
import { authenticateToken, checkPermission, validate, authSchemas } from '../middleware';
import { login, register, getCurrentUser } from '../controllers/authController';

const router = Router();

// 用户登录
router.post('/login', validate(authSchemas.login), async (req: Request, res: Response) => {
  await login(req, res);
});

// 用户注册（需要管理员权限）
router.post(
  '/register',
  authenticateToken,
  checkPermission('users:write'),
  validate(authSchemas.register),
  async (req: Request, res: Response) => {
    await register(req, res);
  }
);

// 获取当前登录用户信息
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  await getCurrentUser(req, res);
});

// 用户登出（客户端删除Token即可）
router.post('/logout', authenticateToken, (_req: Request, res: Response) => {
  res.json({ success: true, message: '登出成功' });
});

// 刷新Token
router.post('/refresh', authenticateToken, async (req: Request, res: Response) => {
  const user = req.user!;
  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  const newToken = jwt.sign(
    { userId: user.userId, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ success: true, message: 'Token刷新成功', data: { token: newToken } });
});

export default router;
