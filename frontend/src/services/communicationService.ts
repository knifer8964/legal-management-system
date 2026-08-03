import httpService from './http';
import {
  Communication, CreateCommunicationDto, UpdateCommunicationDto, CommunicationQueryParams,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class CommunicationService {
  async list(params?: CommunicationQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Communication>>>('/communications', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Communication>>(`/communications/${id}`);
    return res.data!;
  }

  async create(data: CreateCommunicationDto) {
    const res = await httpService.post<ApiResponse<Communication>>('/communications', data);
    return res.data!;
  }

  async update(id: number, data: UpdateCommunicationDto) {
    const res = await httpService.put<ApiResponse<Communication>>(`/communications/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/communications/${id}`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<any>>('/communications/stats');
    return res.data!;
  }
}

export const communicationService = new CommunicationService();
