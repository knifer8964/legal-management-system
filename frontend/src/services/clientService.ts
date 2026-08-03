import httpService from './http';
import {
  Client, CreateClientDto, UpdateClientDto, ClientQueryParams,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class ClientService {
  async list(params?: ClientQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Client>>>('/clients', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Client>>(`/clients/${id}`);
    return res.data!;
  }

  async create(data: CreateClientDto) {
    const res = await httpService.post<ApiResponse<Client>>('/clients', data);
    return res.data!;
  }

  async update(id: number, data: UpdateClientDto) {
    const res = await httpService.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/clients/${id}`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<{ total: number; byType: Record<string, number> }>>('/clients/stats');
    return res.data!;
  }
}

export const clientService = new ClientService();
