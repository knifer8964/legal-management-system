// 用户与权限服务
import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface CreateUserInput {
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
  roleId: number;
  department?: string;
  status?: UserStatus;
}

export interface UpdateUserInput {
  realName?: string;
  email?: string | null;
  phone?: string | null;
  roleId?: number;
  department?: string | null;
  status?: UserStatus;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  roleId?: number;
  status?: UserStatus;
  keyword?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function findAll(params: UserListParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    roleId,
    status,
    keyword,
    sortField = 'createdAt',
    sortOrder = 'desc'
  } = params;

  const skip = (page - 1) * pageSize;
  const where: any = {};

  if (roleId) where.roleId = roleId;
  if (status) where.status = status;
  if (keyword) {
    where.OR = [
      { username: { contains: keyword, mode: 'insensitive' } },
      { realName: { contains: keyword, mode: 'insensitive' } },
      { email: { contains: keyword, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        role: { select: { id: true, roleName: true } }
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: pageSize
    }),
    prisma.user.count({ where })
  ]);

  return {
    data: users,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  };
}

export async function findById(id: number) {
  return prisma.user.findUnique({
    where: { id },
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
      updatedAt: true,
      role: { select: { id: true, roleName: true, permissions: true } }
    }
  });
}

export async function create(data: CreateUserInput) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      realName: data.realName,
      email: data.email,
      phone: data.phone,
      roleId: data.roleId,
      department: data.department,
      status: data.status || 'ACTIVE'
    },
    select: {
      id: true,
      username: true,
      realName: true,
      email: true,
      phone: true,
      department: true,
      status: true,
      createdAt: true,
      role: { select: { id: true, roleName: true } }
    }
  });
}

export async function update(id: number, data: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      username: true,
      realName: true,
      email: true,
      phone: true,
      department: true,
      status: true,
      updatedAt: true,
      role: { select: { id: true, roleName: true } }
    }
  });
}

export async function deactivate(id: number) {
  return prisma.user.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: { id: true, status: true }
  });
}

export async function resetPassword(id: number, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true, updatedAt: true }
  });
}

export async function existsUsername(username: string, excludeId?: number) {
  const user = await prisma.user.findUnique({ where: { username } });
  return user ? (excludeId ? user.id !== excludeId : true) : false;
}

export async function existsEmail(email?: string, excludeId?: number) {
  if (!email) return false;
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? (excludeId ? user.id !== excludeId : true) : false;
}

export async function findAllRoles() {
  return prisma.role.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { users: true } } }
  });
}

export async function findRoleById(id: number) {
  return prisma.role.findUnique({ where: { id } });
}
