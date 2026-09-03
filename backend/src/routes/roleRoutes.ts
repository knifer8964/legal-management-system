// =====================================================
// 角色管理路由
// =====================================================

import { Router } from 'express';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';
import {
  findAll,
  findById,
  create,
  update,
  remove,
  getUsers,
} from '../controllers/roleController';

const router = Router();

// 所有路由需要认证
router.use(authenticateToken);

// 获取角色列表（分页）— 读取权限默认所有认证用户拥有
router.get('/', findAll);

// 创建角色（需要角色写权限）
router.post('/', checkPermission('role:write'), create);

// 角色详情 — 必须在 /:id/users 之前
router.get('/:id', findById);

// 更新角色（需要角色写权限）
router.put('/:id', checkPermission('role:write'), update);

// 删除角色（需要角色删除权限）
router.delete('/:id', checkPermission('role:delete'), remove);

// 角色下的用户列表
router.get('/:id/users', getUsers);

export default router;
