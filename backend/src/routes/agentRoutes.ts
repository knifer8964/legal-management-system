import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  testAgent,
} from '../controllers/agentController';

const router = Router();

// 所有接口需要认证
router.use(authenticate);

// 查询 Agent 列表（所有角色可查看）
router.get('/', getAgents);

// 查询单个 Agent
router.get('/:id', getAgentById);

// 创建 Agent（需要 ADMIN 或 LAWYER 角色）
router.post('/', authorize(['ADMIN', 'LAWYER']), createAgent);

// 更新 Agent（需要 ADMIN 或 LAWYER 角色）
router.put('/:id', authorize(['ADMIN', 'LAWYER']), updateAgent);

// 删除 Agent（需要 ADMIN 角色）
router.delete('/:id', authorize(['ADMIN']), deleteAgent);

// 测试 Agent 连通性
router.post('/:id/test', testAgent);

export default router;
