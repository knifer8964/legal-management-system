// =====================================================
// 企业客户配置控制器 (虚拟法务部)
// =====================================================

import { Request, Response, NextFunction } from 'express';
import enterpriseConfigService from '../services/enterpriseConfigService';
import { success, Errors } from '../utils/responseUtil';

export class EnterpriseConfigController {
  // GET /clients/:clientId/enterprise-config
  async getByClient(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const clientId = this.parseClientId(req);
      if (clientId === null) return Errors.badRequest(res, '无效的客户ID');

      const config = await enterpriseConfigService.findByClientId(clientId);
      if (!config) return Errors.notFound(res, '企业配置不存在');
      return success(res, config);
    } catch (err: any) {
      return next(err);
    }
  }

  // POST /clients/:clientId/enterprise-config
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const clientId = this.parseClientId(req);
      if (clientId === null) return Errors.badRequest(res, '无效的客户ID');

      const config = await enterpriseConfigService.create({
        clientId,
        ...req.body,
      });
      return success(res, config, '企业配置创建成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // PUT /enterprise-configs/:id
  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');

      const config = await enterpriseConfigService.update(id, req.body);
      return success(res, config, '企业配置更新成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // DELETE /enterprise-configs/:id
  async remove(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return Errors.badRequest(res, '无效ID');

      await enterpriseConfigService.delete(id);
      return success(res, null, '企业配置删除成功');
    } catch (err: any) {
      return next(err);
    }
  }

  // GET /clients/:clientId/enterprise-config/members
  async getMembers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const clientId = this.parseClientId(req);
      if (clientId === null) return Errors.badRequest(res, '无效的客户ID');

      const members = await enterpriseConfigService.getMembers(clientId);
      return success(res, members);
    } catch (err: any) {
      return next(err);
    }
  }

  // POST /clients/:clientId/enterprise-config/members
  async addMember(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const clientId = this.parseClientId(req);
      if (clientId === null) return Errors.badRequest(res, '无效的客户ID');

      if (!req.body || !req.body.name) {
        return Errors.badRequest(res, '成员姓名(name)为必填');
      }

      const members = await enterpriseConfigService.addMember(clientId, req.body);
      return success(res, members, '成员添加成功', 201);
    } catch (err: any) {
      return next(err);
    }
  }

  // DELETE /clients/:clientId/enterprise-config/members/:index
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const clientId = this.parseClientId(req);
      if (clientId === null) return Errors.badRequest(res, '无效的客户ID');

      const index = parseInt(req.params.index, 10);
      if (isNaN(index)) return Errors.badRequest(res, '无效的成员索引');

      const members = await enterpriseConfigService.removeMember(clientId, index);
      return success(res, members, '成员移除成功');
    } catch (err: any) {
      return next(err);
    }
  }

  private parseClientId(req: Request): number | null {
    const clientId = parseInt(req.params.clientId, 10);
    return isNaN(clientId) ? null : clientId;
  }
}

export default new EnterpriseConfigController();
