// =====================================================
// 企业客户配置服务 (虚拟法务部)
// =====================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { EnterpriseConfig } from '../types/api';

const prisma = new PrismaClient();

export interface EnterpriseMember {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  department?: string;
}

export interface CreateEnterpriseConfigDto {
  clientId: number;
  serviceLevel?: string;
  responseTime?: number;
  monthlyQuota?: number;
  usedQuota?: number;
  oaWebhookUrl?: string;
  oaApiKey?: string;
  oaApiSecret?: string;
  dingtalkToken?: string;
  wecomCorpId?: string;
  wecomAgentId?: string;
  wecomSecret?: string;
  members?: EnterpriseMember[];
  portalTitle?: string;
  portalLogo?: string;
  portalTheme?: string;
  customFields?: any;
}

export type UpdateEnterpriseConfigDto = Partial<Omit<CreateEnterpriseConfigDto, 'clientId'>>;

export class EnterpriseConfigService {
  // =====================================================
  // 获取企业客户配置
  // =====================================================
  async findByClientId(clientId: number): Promise<EnterpriseConfig | null> {
    const config = await prisma.enterpriseConfig.findUnique({
      where: { clientId },
      include: { client: true },
    });
    if (!config) return null;
    return this.format(config);
  }

  // =====================================================
  // 创建配置
  // =====================================================
  async create(data: CreateEnterpriseConfigDto): Promise<EnterpriseConfig> {
    const config = await prisma.enterpriseConfig.create({
      data: {
        clientId: data.clientId,
        serviceLevel: data.serviceLevel || 'STANDARD',
        responseTime: data.responseTime ?? 24,
        monthlyQuota: data.monthlyQuota ?? 0,
        usedQuota: data.usedQuota ?? 0,
        oaWebhookUrl: data.oaWebhookUrl || null,
        oaApiKey: data.oaApiKey || null,
        oaApiSecret: data.oaApiSecret || null,
        dingtalkToken: data.dingtalkToken || null,
        wecomCorpId: data.wecomCorpId || null,
        wecomAgentId: data.wecomAgentId || null,
        wecomSecret: data.wecomSecret || null,
        members: data.members ? JSON.stringify(data.members) : null,
        portalTitle: data.portalTitle || null,
        portalLogo: data.portalLogo || null,
        portalTheme: data.portalTheme || null,
        customFields: data.customFields ? JSON.stringify(data.customFields) : null,
      },
      include: { client: true },
    });
    return this.format(config);
  }

  // =====================================================
  // 更新配置
  // =====================================================
  async update(id: number, data: UpdateEnterpriseConfigDto): Promise<EnterpriseConfig> {
    const existing = await prisma.enterpriseConfig.findUnique({ where: { id } });
    if (!existing) throw new Error('企业配置不存在');

    const updateData: Prisma.EnterpriseConfigUncheckedUpdateInput = {};

    if (data.serviceLevel !== undefined) updateData.serviceLevel = data.serviceLevel;
    if (data.responseTime !== undefined) updateData.responseTime = data.responseTime;
    if (data.monthlyQuota !== undefined) updateData.monthlyQuota = data.monthlyQuota;
    if (data.usedQuota !== undefined) updateData.usedQuota = data.usedQuota;
    if (data.oaWebhookUrl !== undefined) updateData.oaWebhookUrl = data.oaWebhookUrl || null;
    if (data.oaApiKey !== undefined) updateData.oaApiKey = data.oaApiKey || null;
    if (data.oaApiSecret !== undefined) updateData.oaApiSecret = data.oaApiSecret || null;
    if (data.dingtalkToken !== undefined) updateData.dingtalkToken = data.dingtalkToken || null;
    if (data.wecomCorpId !== undefined) updateData.wecomCorpId = data.wecomCorpId || null;
    if (data.wecomAgentId !== undefined) updateData.wecomAgentId = data.wecomAgentId || null;
    if (data.wecomSecret !== undefined) updateData.wecomSecret = data.wecomSecret || null;
    if (data.members !== undefined) updateData.members = data.members ? JSON.stringify(data.members) : null;
    if (data.portalTitle !== undefined) updateData.portalTitle = data.portalTitle || null;
    if (data.portalLogo !== undefined) updateData.portalLogo = data.portalLogo || null;
    if (data.portalTheme !== undefined) updateData.portalTheme = data.portalTheme || null;
    if (data.customFields !== undefined) updateData.customFields = data.customFields ? JSON.stringify(data.customFields) : null;

    const config = await prisma.enterpriseConfig.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });
    return this.format(config);
  }

  // =====================================================
  // 删除配置
  // =====================================================
  async delete(id: number): Promise<void> {
    const existing = await prisma.enterpriseConfig.findUnique({ where: { id } });
    if (!existing) throw new Error('企业配置不存在');
    await prisma.enterpriseConfig.delete({ where: { id } });
  }

  // =====================================================
  // 获取成员列表
  // =====================================================
  async getMembers(clientId: number): Promise<EnterpriseMember[]> {
    const config = await prisma.enterpriseConfig.findUnique({ where: { clientId } });
    if (!config) return [];
    return this.normalizeMembers(config.members);
  }

  // =====================================================
  // 添加成员
  // =====================================================
  async addMember(clientId: number, memberData: EnterpriseMember): Promise<EnterpriseMember[]> {
    const config = await prisma.enterpriseConfig.findUnique({ where: { clientId } });
    if (!config) throw new Error('企业配置不存在，请先创建配置');

    const members = this.normalizeMembers(config.members);
    members.push(memberData);

    await prisma.enterpriseConfig.update({
      where: { clientId },
      data: { members: JSON.stringify(members) },
    });

    return members;
  }

  // =====================================================
  // 移除成员（按索引）
  // =====================================================
  async removeMember(clientId: number, memberIndex: number): Promise<EnterpriseMember[]> {
    const config = await prisma.enterpriseConfig.findUnique({ where: { clientId } });
    if (!config) throw new Error('企业配置不存在');

    const members = this.normalizeMembers(config.members);
    if (memberIndex < 0 || memberIndex >= members.length) {
      throw new Error('成员索引越界');
    }

    members.splice(memberIndex, 1);

    await prisma.enterpriseConfig.update({
      where: { clientId },
      data: { members: JSON.stringify(members) },
    });

    return members;
  }

  // =====================================================
  // 辅助方法
  // =====================================================
  private normalizeMembers(members: any): EnterpriseMember[] {
    if (!members) return [];
    if (Array.isArray(members)) return members;
    if (typeof members === 'string') {
      try {
        const parsed = JSON.parse(members);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private format(config: any): EnterpriseConfig {
    return {
      ...config,
      members: this.normalizeMembers(config.members),
      customFields: this.normalizeJson(config.customFields),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private normalizeJson(v: any): any {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  }
}

export default new EnterpriseConfigService();
