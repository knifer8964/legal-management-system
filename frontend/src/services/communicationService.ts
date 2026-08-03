import httpService from '../http';
import { Communication, CommunicationFormData } from '../types/api';

class CommunicationService {
  async list(params?: { page?: number; pageSize?: number; matterId?: number; clientId?: number }) {
    const res = await httpService.get<{ items: Communication[]; total: number; page: number; pageSize: number }>('/communications', params);
    return res.data;
  }

  async getById(id: number) {
    const res = await httpService.get<Communication>(`/communications/${id}`);
    return res.data;
  }

  async create(data: CommunicationFormData) {
    const res = await httpService.post<Communication>('/communications', data);
    return res.data;
  }

  async update(id: number, data: Partial<CommunicationFormData>) {
    const res = await httpService.put<Communication>(`/communications/${id}`, data);
    return res.data;
  }

  async remove(id: number) {
    const res = await httpService.delete<null>(`/communications/${id}`);
    return res.data;
  }
}

export const communicationService = new CommunicationService();
