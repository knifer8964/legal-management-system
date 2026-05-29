import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * 获取 Agent 列表
 * GET /api/agents
 */
export async function getAgents(req: Request, res: Response, next: NextFunction) {
  try {
    const { agentType, status, ownerId } = req.query;
    const where: any = {};
    if (agentType) where.agentType = agentType;
    if (status) where.status = status;
    if (ownerId) where.ownerId = Number(ownerId);

    const agents = await prisma.agent.findMany({
      where,
      include: { owner: { select: { id: true, realName: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 0, data: agents });
  } catch (err) {
    return next(err);
  }
}

/**
 * 获取单个 Agent 详情
 * GET /api/agents/:id
 */
export async function getAgentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { owner: { select: { id: true, realName: true, username: true } } },
    });

    if (!agent) return res.status(404).json({ code: 404, message: 'Agent 不存在' });
    res.json({ code: 0, data: agent });
  } catch (err) {
    return next(err);
  }
}

/**
 * 创建 Agent
 * POST /api/agents
 * Body: { agentName, agentType, apiEndpoint?, apiKeyEncrypted?, capabilities?, ownerId }
 */
export async function createAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      agentName,
      agentType,
      apiEndpoint,
      apiKeyEncrypted,
      capabilities,
      ownerId,
    } = req.body;

    if (!agentName || !agentType || !ownerId) {
      return res.status(400).json({ code: 400, message: '缺少必填参数' });
    }

    // 检查 owner 是否存在
    const owner = await prisma.user.findUnique({ where: { id: Number(ownerId) } });
    if (!owner) return res.status(400).json({ code: 400, message: 'owner 用户不存在' });

    // 加密 apiKey（简单 AES-256-CBC 示例，生产环境用专业 KMS）
    let encryptedKey: string | undefined;
    if (apiKeyEncrypted) {
      const cipher = crypto.createCipheriv('aes-256-cbc', (process.env.API_KEY_SECRET || 'default-secret-key').padEnd(16, '0').slice(0, 16), Buffer.alloc(16, 0));
      encryptedKey = cipher.update(apiKeyEncrypted, 'utf8', 'hex') + cipher.final('hex');
    }

    const agent = await prisma.agent.create({
      data: {
        agentName,
        agentType,
        apiEndpoint,
        apiKeyEncrypted: encryptedKey,
        capabilities: capabilities ? JSON.parse(capabilities) : undefined,
        ownerId: Number(ownerId),
      },
    });

    res.status(201).json({ code: 0, data: agent, message: 'Agent 创建成功' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 更新 Agent
 * PUT /api/agents/:id
 */
export async function updateAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { agentName, agentType, apiEndpoint, apiKeyEncrypted, capabilities, status } = req.body;

    const updateData: any = {};
    if (agentName !== undefined) updateData.agentName = agentName;
    if (agentType !== undefined) updateData.agentType = agentType;
    if (apiEndpoint !== undefined) updateData.apiEndpoint = apiEndpoint;
    if (apiKeyEncrypted !== undefined) {
      // 重新加密
      const cipher = crypto.createCipheriv('aes-256-cbc', (process.env.API_KEY_SECRET || 'default-secret-key').padEnd(16, '0').slice(0, 16), Buffer.alloc(16, 0));
      updateData.apiKeyEncrypted = cipher.update(apiKeyEncrypted, 'utf8', 'hex') + cipher.final('hex');
    }
    if (capabilities !== undefined) updateData.capabilities = JSON.parse(capabilities);
    if (status !== undefined) updateData.status = status;

    const agent = await prisma.agent.update({ where: { id }, data: updateData });
    res.json({ code: 0, data: agent, message: 'Agent 更新成功' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 删除 Agent
 * DELETE /api/agents/:id
 */
export async function deleteAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await prisma.agent.delete({ where: { id } });
    res.json({ code: 0, message: 'Agent 删除成功' });
  } catch (err) {
    return next(err);
  }
}

/**
 * 测试 Agent 连通性
 * POST /api/agents/:id/test
 */
export async function testAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) return res.status(404).json({ code: 404, message: 'Agent 不存在' });

    if (!agent.apiEndpoint) {
      return res.json({ code: 0, data: { success: false, message: '未配置 API Endpoint' } });
    }

    // 简单连通性测试（超时 5 秒）
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(agent.apiEndpoint, { signal: controller.signal });
      clearTimeout(timeout);
      res.json({
        code: 0,
        data: {
          success: response.ok,
          status: response.status,
          message: response.ok ? '连通性测试通过' : 'HTTP ' + response.status,
        },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      res.json({
        code: 0,
        data: {
          success: false,
          message: fetchErr.name === 'AbortError' ? '连接超时（5秒）' : fetchErr.message,
        },
      });
    }
  } catch (err) {
    return next(err);
  }
}