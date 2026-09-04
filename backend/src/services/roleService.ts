// =====================================================
// 角色管理服务 - 业务逻辑层
// =====================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RoleCreateInput {
  roleName: string;
  description?: string | null;
  permissions?: any;
}

export interface RoleUpdateInput {
  roleName?: string;
  description?: string | null;
  permissions?: any;
}

export interface RoleQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export class RoleService {
  // =====================================================
  // 角色列表（分页 + 搜索）
  // =====================================================
  async findAll(params: RoleQueryParams): Promise<{
    data: any[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const { page = 1, pageSize = 20, keyword } = params;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { roleName: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { users: true } } },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      data: roles.map((role) => this.formatRole(role)),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 序列化权限为 JSON 字符串（SQLite 存储）
  private serializePermissions(p: any): string | null {
    if (p === null || p === undefined) return null;
    if (typeof p === 'string') return p;
    return JSON.stringify(p);
  }

  // 反序列化权限（返回给前端时还原为数组/对象）
  private deserializePermissions(p: any): any {
    if (p === null || p === undefined) return null;
    if (typeof p === 'string') {
      try { return JSON.parse(p); } catch { return p; }
    }
    return p;
  }

  // 格式化角色（将 permissions 字符串还原为对象/数组）
  private formatRole(role: any): any {
    return {
      ...role,
      permissions: this.deserializePermissions(role.permissions),
    };
  }

  // =====================================================
  // 角色详情
  // =====================================================
  async findById(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    return role ? this.formatRole(role) : null;
  }

  // =====================================================
  // 创建角色
  // =====================================================
  async create(data: RoleCreateInput) {
    // 检查角色名是否已存在
    const existing = await prisma.role.findUnique({
      where: { roleName: data.roleName },
    });
    if (existing) {
      throw new Error('角色名已存在');
    }

    return prisma.role.create({
      data: {
        roleName: data.roleName,
        description: data.description ?? null,
        permissions: this.serializePermissions(data.permissions),
      },
      include: { _count: { select: { users: true } } },
    }).then((role) => this.formatRole(role));
  }

  // =====================================================
  // 更新角色
  // =====================================================
  async update(id: number, data: RoleUpdateInput) {
    // 检查角色名是否被其他角色占用
    if (data.roleName !== undefined) {
      const existing = await prisma.role.findUnique({
        where: { roleName: data.roleName },
      });
      if (existing && existing.id !== id) {
        throw new Error('角色名已存在');
      }
    }

    const updateData: any = {};
    if (data.roleName !== undefined) updateData.roleName = data.roleName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.permissions !== undefined) updateData.permissions = this.serializePermissions(data.permissions);

    return prisma.role.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { users: true } } },
    }).then((role) => this.formatRole(role));
  }

  // =====================================================
  // 删除角色（仍有用户关联时不允许删除）
  // =====================================================
  async delete(id: number): Promise<void> {
    const userCount = await prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw new Error(`该角色下还有 ${userCount} 个用户，无法删除`);
    }

    await prisma.role.delete({ where: { id } });
  }

  // =====================================================
  // 获取角色下的用户列表
  // =====================================================
  async getUsers(roleId: number) {
    return prisma.user.findMany({
      where: { roleId },
      select: {
        id: true,
        username: true,
        realName: true,
        email: true,
        phone: true,
        department: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
  }
}

export default new RoleService();
