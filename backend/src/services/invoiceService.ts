// =====================================================
// 发票管理服务 (M8)
// =====================================================

import { PrismaClient, Prisma, InvoiceStatus } from '@prisma/client';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParams,
  Invoice,
} from '../types/api';

const prisma = new PrismaClient();

// 生成发票编号: INV-YYYYMMDD-XXXX
async function generateInvoiceNo(): Promise<string> {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const prefix = `INV-${dateStr}-`;

  // 查当天已有的最大编号
  const last = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });

  let seq = 1;
  if (last) {
    const parts = last.invoiceNo.split('-');
    seq = parseInt(parts[2]) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export class InvoiceService {
  // 创建发票
  async create(data: CreateInvoiceDto, userId: number): Promise<Invoice> {
    const invoiceNo = await generateInvoiceNo();

    // 计算金额
    const subtotal = Number(data.subtotal) || 0;
    const taxRate = Number(data.taxRate) || 0;
    const discount = Number(data.discount) || 0;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const totalAmount = Math.round((subtotal + taxAmount - discount) * 100) / 100;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        clientId: data.clientId,
        matterId: data.matterId || null,
        createdById: userId,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        totalAmount,
        paidAmount: 0,
        status: data.status || InvoiceStatus.DRAFT,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        items: data.items || null,
        notes: data.notes || null,
      },
      include: { client: true, matter: true, createdBy: true },
    });

    return this.format(invoice);
  }

  // 更新发票
  async update(id: number, data: UpdateInvoiceDto): Promise<Invoice> {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new Error('发票不存在');

    const updateData: any = {};

    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.matterId !== undefined) updateData.matterId = data.matterId || null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.items !== undefined) updateData.items = data.items;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.issueDate !== undefined) updateData.issueDate = data.issueDate ? new Date(data.issueDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.paidAt !== undefined) updateData.paidAt = data.paidAt ? new Date(data.paidAt) : null;

    // 金额重算
    const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : Number(existing.subtotal);
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : Number(existing.taxRate);
    const discount = data.discount !== undefined ? Number(data.discount) : Number(existing.discount);

    if (data.subtotal !== undefined || data.taxRate !== undefined || data.discount !== undefined) {
      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate;
      updateData.discount = discount;
      updateData.taxAmount = Math.round(subtotal * taxRate) / 100;
      updateData.totalAmount = Math.round((subtotal + updateData.taxAmount - discount) * 100) / 100;
    }

    // 如果标记为已支付，设置 paidAmount = totalAmount
    if (data.status === InvoiceStatus.PAID) {
      updateData.paidAmount = updateData.totalAmount || Number(existing.totalAmount);
      if (!existing.paidAt && !updateData.paidAt) {
        updateData.paidAt = new Date();
      }
    } else if (data.status === InvoiceStatus.PARTIAL && data.paidAmount !== undefined) {
      updateData.paidAmount = Number(data.paidAmount);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true, matter: true, createdBy: true },
    });

    return this.format(updated);
  }

  // 查询单条发票
  async findById(id: number): Promise<Invoice | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        matter: true,
        createdBy: true,
        timeEntries: true,
      },
    });
    if (!invoice) return null;
    return this.format(invoice);
  }

  // 删除发票
  async delete(id: number): Promise<void> {
    // 先解除关联的计时记录
    await prisma.timeEntry.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null, isBilled: false },
    });

    await prisma.invoice.delete({ where: { id } });
  }

  // 列表查询
  async findAll(params: InvoiceQueryParams): Promise<{
    data: Invoice[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      clientId,
      matterId,
      status,
      startDate,
      endDate,
      search,
    } = params;

    const where: Prisma.InvoiceWhereInput = {};
    if (clientId) where.clientId = clientId;
    if (matterId) where.matterId = matterId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: { client: true, matter: true, createdBy: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: invoices.map((inv) => this.format(inv)),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // 统计
  async getStats(params?: { clientId?: number; startDate?: string; endDate?: string }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (params?.clientId) where.clientId = params.clientId;

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [all, byStatus] = await Promise.all([
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, subtotal: true, taxAmount: true },
        _count: true,
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    const statusBreakdown: Record<string, { count: number; amount: number }> = {};
    for (const s of byStatus) {
      statusBreakdown[s.status] = {
        count: s._count,
        amount: Number(s._sum.totalAmount || 0),
      };
    }

    return {
      totalInvoices: all._count,
      totalAmount: Math.round(Number(all._sum.totalAmount || 0) * 100) / 100,
      totalPaid: Math.round(Number(all._sum.paidAmount || 0) * 100) / 100,
      totalUnpaid: Math.round(
        (Number(all._sum.totalAmount || 0) - Number(all._sum.paidAmount || 0)) * 100,
      ) / 100,
      statusBreakdown,
    };
  }

  // 将计时记录关联到发票（开票操作）
  async linkTimeEntries(invoiceId: number, timeEntryIds: number[]): Promise<Invoice> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('发票不存在');

    // 更新计时记录
    await prisma.timeEntry.updateMany({
      where: { id: { in: timeEntryIds } },
      data: { invoiceId, isBilled: true },
    });

    // 重算发票小计
    const entries = await prisma.timeEntry.findMany({
      where: { id: { in: timeEntryIds } },
    });
    const subtotal = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const taxAmount = Math.round(subtotal * Number(invoice.taxRate)) / 100;
    const totalAmount = Math.round((subtotal + taxAmount - Number(invoice.discount)) * 100) / 100;

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, taxAmount, totalAmount },
      include: { client: true, matter: true, createdBy: true },
    });

    return this.format(updated);
  }

  // 记录支付
  async recordPayment(id: number, amount: number): Promise<Invoice> {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('发票不存在');

    const newPaidAmount = Number(invoice.paidAmount) + amount;
    const totalAmount = Number(invoice.totalAmount);

    let newStatus: InvoiceStatus = invoice.status;
    let paidAt: Date | null = invoice.paidAt;

    if (newPaidAmount >= totalAmount) {
      newStatus = InvoiceStatus.PAID;
      paidAt = new Date();
    } else if (newPaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIAL;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt,
      },
      include: { client: true, matter: true, createdBy: true },
    });

    return this.format(updated);
  }

  private format(inv: any): Invoice {
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      taxRate: Number(inv.taxRate),
      taxAmount: Number(inv.taxAmount),
      discount: Number(inv.discount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      issueDate: inv.issueDate?.toISOString() || null,
      dueDate: inv.dueDate?.toISOString() || null,
      paidAt: inv.paidAt?.toISOString() || null,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      client: inv.client ? {
        id: inv.client.id,
        name: inv.client.name,
        clientType: inv.client.clientType,
      } : undefined,
      matter: inv.matter ? {
        id: inv.matter.id,
        matterNo: inv.matter.matterNo,
        title: inv.matter.title,
      } : undefined,
      createdBy: inv.createdBy ? {
        id: inv.createdBy.id,
        username: inv.createdBy.username,
        realName: inv.createdBy.realName,
      } : undefined,
    };
  }
}

export default new InvoiceService();
