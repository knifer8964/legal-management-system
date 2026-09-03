// =====================================================
// 文档管理服务 (M9)
// =====================================================

import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentQueryParams,
  Document,
} from '../types/api';

const prisma = new PrismaClient();

export class DocumentService {
  // 创建文档（元数据）
  async create(data: CreateDocumentDto, userId: number): Promise<Document> {
    const doc = await prisma.document.create({
      data: {
        fileName: data.fileName,
        originalName: data.originalName || data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize || 0,
        mimeType: data.mimeType || 'application/octet-stream',
        fileHash: data.fileHash || null,
        clientId: data.clientId || null,
        matterId: data.matterId || null,
        uploaderId: userId || null,
        category: data.category || null,
        tags: data.tags ?? undefined,
        description: data.description || null,
      },
      include: { client: true, matter: true },
    });

    return this.format(doc);
  }

  // 更新文档（仅 category/tags/description/clientId/matterId）
  async update(id: number, data: UpdateDocumentDto): Promise<Document> {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) throw new Error('文档不存在');

    const updateData: Prisma.DocumentUncheckedUpdateInput = {};

    if (data.clientId !== undefined) updateData.clientId = data.clientId || null;
    if (data.matterId !== undefined) updateData.matterId = data.matterId || null;
    if (data.category !== undefined) updateData.category = data.category || null;
    if (data.tags !== undefined) updateData.tags = data.tags ?? Prisma.JsonNull;
    if (data.description !== undefined) updateData.description = data.description || null;

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      include: { client: true, matter: true },
    });

    return this.format(updated);
  }

  // 查询单条文档
  async findById(id: number): Promise<Document | null> {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { client: true, matter: true },
    });
    if (!doc) return null;
    return this.format(doc);
  }

  // 物理删除文档
  async delete(id: number): Promise<void> {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) throw new Error('文档不存在');
    await prisma.document.delete({ where: { id } });
  }

  // 列表查询（分页 + 筛选 + 搜索）
  async findAll(params: DocumentQueryParams): Promise<{
    data: Document[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      clientId,
      matterId,
      category,
      search,
    } = params;

    const where: Prisma.DocumentWhereInput = {};
    if (clientId) where.clientId = clientId;
    if (matterId) where.matterId = matterId;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { originalName: { contains: search } },
        { description: { contains: search } },
        { client: { name: { contains: search } } },
        { matter: { title: { contains: search } } },
      ];
    }

    const [total, docs] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        include: { client: true, matter: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: docs.map((d) => this.format(d)),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // 统计（按分类分组）
  async getStats(params?: { clientId?: number; matterId?: number }) {
    const where: Prisma.DocumentWhereInput = {};
    if (params?.clientId) where.clientId = params.clientId;
    if (params?.matterId) where.matterId = params.matterId;

    const [totalCount, totalSize, byCategory] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.aggregate({
        where,
        _sum: { fileSize: true },
      }),
      prisma.document.groupBy({
        by: ['category'],
        where,
        _count: true,
        _sum: { fileSize: true },
      }),
    ]);

    const categoryBreakdown: Record<string, { count: number; totalSize: number }> = {};
    for (const c of byCategory) {
      const key = c.category || 'UNCATEGORIZED';
      categoryBreakdown[key] = {
        count: c._count,
        totalSize: Number(c._sum.fileSize || 0),
      };
    }

    return {
      totalDocuments: totalCount,
      totalSize: Number(totalSize._sum.fileSize || 0),
      categoryBreakdown,
    };
  }

  private format(doc: any): Document {
    return {
      ...doc,
      fileSize: Number(doc.fileSize),
      createdAt: doc.createdAt.toISOString(),
      client: doc.client
        ? {
            id: doc.client.id,
            name: doc.client.name,
            clientType: doc.client.clientType,
          }
        : undefined,
      matter: doc.matter
        ? {
            id: doc.matter.id,
            matterNo: doc.matter.matterNo,
            title: doc.matter.title,
          }
        : undefined,
    };
  }
}

export default new DocumentService();
