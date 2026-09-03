// =====================================================
// 文档管理路由 (M9)
// =====================================================

import { Router } from 'express';
import documentController from '../controllers/documentController';
import { authenticateToken, checkPermission } from '../middleware/authMiddleware';
import { uploadDocument, handleMulterError } from '../middleware/upload';

const router = Router();
router.use(authenticateToken);

// 特殊操作 (必须在 :id 之前)
router.get('/stats', (req, res, next) => documentController.getStats(req, res, next));

// CRUD
router.get('/', (req, res, next) => documentController.findAll(req, res, next));
// 文件上传（multipart/form-data，字段名为 file）
router.post('/', checkPermission('document:write'), uploadDocument.single('file'), (req, res, next) => documentController.upload(req, res, next));
router.get('/:id', (req, res, next) => documentController.findById(req, res, next));
router.put('/:id', checkPermission('document:write'), (req, res, next) => documentController.update(req, res, next));
router.delete('/:id', checkPermission('document:delete'), (req, res, next) => documentController.delete(req, res, next));

// 文件下载
router.get('/:id/download', (req, res, next) => documentController.download(req, res, next));

// multer 错误处理（放在路由之后）
router.use(handleMulterError);

export default router;
