import httpService from './http';
import {
  Matter, CreateMatterDto, UpdateMatterDto, MatterQueryParams,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class MatterService {
  async list(params?: MatterQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Matter>>>('/matters', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Matter>>(`/matters/${id}`);
    return res.data!;
  }

  async create(data: CreateMatterDto) {
    const res = await httpService.post<ApiResponse<Matter>>('/matters', data);
    return res.data!;
  }

  async update(id: number, data: UpdateMatterDto) {
    const res = await httpService.put<ApiResponse<Matter>>(`/matters/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/matters/${id}`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<any>>('/matters/stats');
    return res.data!;
  }
}

export const matterService = new MatterService();
