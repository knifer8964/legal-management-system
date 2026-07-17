import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 获取知识库列表
 * GET /api/knowledge-bases
 */
export async function getKnowledgeBases(req: Request, res: Response, next: NextFunction) {
  try {
    const { kbType, ownerId, isPublished } = req.query;
    const where: any = {};
    if (kbType) where.kbType = kbType;
    if (ownerId) where.ownerId = Number(ownerId);
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    const kbs = await prisma.knowledgeBase.findMany({
      where,
      include: { owner: { select: { id: true, realName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 0, data: kbs });
  } catch (err) {
    return next(err);
  }
}

/**
 * 获取单个知识库详情（含文档列表）
 * GET /api/knowledge-bases/:id
 */
export async function getKnowledgeBaseById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const kb = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, realName: true } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!kb) return res.status(404).json({ code: 404, message: '知识库不存在' });
    res.json({ code: 0, data: kb });
  } catch (err) {
    return next(err);
  }
}

/**
 * 创建知识库
 * POST /api/knowledge-bases
 */
export async function createKnowledgeBase(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, kbType, config } = req.body;
    const ownerId = (req as any).user.userId; // 从 JWT 中获取

    if (!name) return res.status(400).json({ code: 400, message: '缺少知识库名称' });

    const kb = await prisma.knowledgeBase.create({
      data: {
        name,
        description,
        kbType: kbType || 'PRIVATE',
        ownerId,
        config: config ? JSON.parse(config) : undefined,
      },
    });

    res.status(201).json({ code: 0, data: kb, message: '知识库创建成功' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 更新知识库
 * PUT /api/knowledge-bases/:id
 */
export async function updateKnowledgeBase(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { name, description, kbType, isPublished, config } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (kbType !== undefined) updateData.kbType = kbType;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (config !== undefined) updateData.config = JSON.parse(config);

    const kb = await prisma.knowledgeBase.update({ where: { id }, data: updateData });
    res.json({ code: 0, data: kb, message: '知识库更新成功' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 删除知识库（级联删除文档和分块）
 * DELETE /api/knowledge-bases/:id
 */
export async function deleteKnowledgeBase(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await prisma.knowledgeBase.delete({ where: { id } });
    res.json({ code: 0, message: '知识库删除成功' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 上传文档到知识库
 * POST /api/knowledge-bases/:id/documents
 * Body (multipart/form-data): file, title?
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const kbId = Number(req.params.id);
    const file = (req as any).file; // 需要 multer 中间件
    const title = req.body.title || file.originalname;

    if (!file) return res.status(400).json({ code: 400, message: '未上传文件' });

    // 保存文件到本地存储
    const uploadDir = path.join(__dirname, '../../uploads/knowledge-bases', String(kbId));
    await fs.mkdir(uploadDir, { recursive: true });

    // TODO: 这里应该调用文件处理服务（提取文本、分块、向量化）
    // 暂时只保存文件信息到数据库
    const doc = await prisma.document.create({
      data: {
        kbId,
        title,
        filePath: `/uploads/knowledge-bases/${kbId}/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedById: (req as any).user.userId,
        status: 'UPLOADED',
      },
    });

    res.status(201).json({ code: 0, data: doc, message: '文档上传成功，等待处理' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 搜索知识库（语义搜索，需要向量数据库支持）
 * POST /api/knowledge-bases/:id/search
 * Body: { query, topK? }
 */
export async function searchKnowledgeBase(req: Request, res: Response, next: NextFunction) {
  try {
    const kbId = Number(req.params.id);
    const { query, topK = 5 } = req.body;

    if (!query) return res.status(400).json({ code: 400, message: '缺少搜索关键词' });

    // TODO: 这里应该：
    // 1. 将 query 向量化
    // 2. 在 document_chunks 表中按向量相似度搜索
    // 3. 返回最相关的 chunks 及其所属文档

    // 暂时返回模糊匹配的文本搜索结果
    const chunks = await prisma.documentChunk.findMany({
      where: {
        kbId,
        content: { contains: query },
      },
      take: topK,
      include: { document: { select: { id: true, title: true } } },
    });

    res.json({ code: 0, data: chunks, message: '文本搜索结果（向量搜索待实现）' });
  } catch (err) {
    return next(err);
  }
}