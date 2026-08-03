import httpService from '../http';
import { Client, ClientFormData, ApiResponse } from '../types/api';

class ClientService {
  async list(params?: { page?: number; pageSize?: number; keyword?: string }) {
    const res = await httpService.get<{ items: Client[]; total: number; page: number; pageSize: number }>('/clients', params);
    return res.data;
  }

  async getById(id: number) {
    const res = await httpService.get<Client>(`/clients/${id}`);
    return res.data;
  }

  async create(data: ClientFormData) {
    const res = await httpService.post<Client>('/clients', data);
    return res.data;
  }

  async update(id: number, data: Partial<ClientFormData>) {
    const res = await httpService.put<Client>(`/clients/${id}`, data);
    return res.data;
  }

  async remove(id: number) {
    const res = await httpService.delete<null>(`/clients/${id}`);
    return res.data;
  }

  async stats() {
    const res = await httpService.get<{ total: number; byType: Record<string, number> }>('/clients/stats');
    return res.data;
  }
}

export const clientService = new ClientService();
