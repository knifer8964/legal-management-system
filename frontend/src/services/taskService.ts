import httpService from '../http';
import { Task, TaskFormData, ApiResponse } from '../types/api';

class TaskService {
  async list(params?: { page?: number; pageSize?: number; matterId?: number; status?: string; priority?: string }) {
    const res = await httpService.get<{ items: Task[]; total: number; page: number; pageSize: number }>('/tasks', params);
    return res.data;
  }

  async getById(id: number) {
    const res = await httpService.get<Task>(`/tasks/${id}`);
    return res.data;
  }

  async create(data: TaskFormData) {
    const res = await httpService.post<Task>('/tasks', data);
    return res.data;
  }

  async update(id: number, data: Partial<TaskFormData>) {
    const res = await httpService.put<Task>(`/tasks/${id}`, data);
    return res.data;
  }

  async toggleStatus(id: number) {
    const res = await httpService.put<Task>(`/tasks/${id}/toggle`, {});
    return res.data;
  }

  async remove(id: number) {
    const res = await httpService.delete<null>(`/tasks/${id}`);
    return res.data;
  }
}

export const taskService = new TaskService();
