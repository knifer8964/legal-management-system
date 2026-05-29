import { Router } from 'express';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getRoles
} from '../controllers/userController';

const router = Router();

// 获取用户列表（需要用户查看权限）
router.get('/', authenticateToken, checkPermission('user:view'), getUsers);

// 获取单个用户详情（需要用户查看权限）
router.get('/:id', authenticateToken, checkPermission('user:view'), getUserById);

// 创建用户（需要用户创建权限）
router.post('/', authenticateToken, checkPermission('user:create'), createUser);

// 更新用户（需要用户编辑权限）
router.put('/:id', authenticateToken, checkPermission('user:edit'), updateUser);

// 删除/停用用户（需要用户删除权限）
router.delete('/:id', authenticateToken, checkPermission('user:delete'), deleteUser);

// 重置用户密码（需要用户管理权限）
router.post('/:id/reset-password', authenticateToken, checkPermission('user:manage'), resetPassword);

// 获取角色列表（需要角色查看权限）
router.get('/roles', authenticateToken, checkPermission('role:view'), getRoles);

export default router;
