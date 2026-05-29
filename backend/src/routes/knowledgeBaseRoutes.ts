import { Router } from 'express';
import { authenticateToken } from '../middleware';
import {
  getKnowledgeBases,
  getKnowledgeBaseById,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  uploadDocument,
  searchKnowledgeBase,
} from '../controllers/knowledgeBaseController';

const router = Router();

// 所有接口需要认证
router.use(authenticateToken);

// 查询知识库列表
router.get('/', getKnowledgeBases);

// 查询单个知识库
router.get('/:id', getKnowledgeBaseById);

// 创建知识库（需要认证）
router.post('/', createKnowledgeBase);

// 更新知识库（需要 ADMIN 或所有者）
router.put('/:id', updateKnowledgeBase);

// 删除知识库（需要 ADMIN 或所有者）
router.delete('/:id', deleteKnowledgeBase);

// 上传文档到知识库（需要认证）
router.post('/:id/documents', uploadDocument);

// 搜索知识库
router.post('/:id/search', searchKnowledgeBase);

export default router;
