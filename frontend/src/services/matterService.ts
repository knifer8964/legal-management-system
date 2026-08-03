import httpService from '../http';
import { Matter, MatterFormData, ApiResponse } from '../types/api';

class MatterService {
  async list(params?: { page?: number; pageSize?: number; status?: string; clientId?: number; keyword?: string }) {
    const res = await httpService.get<{ items: Matter[]; total: number; page: number; pageSize: number }>('/matters', params);
    return res.data;
  }

  async getById(id: number) {
    const res = await httpService.get<Matter>(`/matters/${id}`);
    return res.data;
  }

  async create(data: MatterFormData) {
    const res = await httpService.post<Matter>('/matters', data);
    return res.data;
  }

  async update(id: number, data: Partial<MatterFormData>) {
    const res = await httpService.put<Matter>(`/matters/${id}`, data);
    return res.data;
  }

  async updateStatus(id: number, status: string) {
    const res = await httpService.put<Matter>(`/matters/${id}/status`, { status });
    return res.data;
  }

  async remove(id: number) {
    const res = await httpService.delete<null>(`/matters/${id}`);
    return res.data;
  }

  async stats() {
    const res = await httpService.get<{ total: number; byStatus: Record<string, number>; byType: Record<string, number> }>('/matters/stats');
    return res.data;
  }

  async timeline(id: number) {
    const res = await httpService.get<{ id: number; eventType: string; title: string; description: string; createdAt: string }[]>(`/matters/${id}/timeline`);
    return res.data;
  }
}

export const matterService = new MatterService();
