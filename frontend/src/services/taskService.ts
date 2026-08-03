import httpService from './http';
import {
  Task, CreateTaskDto, UpdateTaskDto, TaskQueryParams,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class TaskService {
  async list(params?: TaskQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Task>>(`/tasks/${id}`);
    return res.data!;
  }

  async create(data: CreateTaskDto) {
    const res = await httpService.post<ApiResponse<Task>>('/tasks', data);
    return res.data!;
  }

  async update(id: number, data: UpdateTaskDto) {
    const res = await httpService.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return res.data!;
  }

  async toggle(id: number) {
    const res = await httpService.patch<ApiResponse<Task>>(`/tasks/${id}/toggle`);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/tasks/${id}`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<any>>('/tasks/stats');
    return res.data!;
  }
}

export const taskService = new TaskService();
