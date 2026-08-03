import { create } from 'zustand';
import { taskService } from '../services/taskService';
import { Task, TaskFormData } from '../types/api';

interface TaskState {
  tasks: Task[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchTasks: (params?: { page?: number; pageSize?: number; matterId?: number; status?: string }) => Promise<void>;
  create: (data: TaskFormData) => Promise<Task>;
  toggle: (id: number) => Promise<Task>;
  update: (id: number, data: Partial<TaskFormData>) => Promise<Task>;
  remove: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  total: 0,
  loading: false,
  error: null,

  fetchTasks: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await taskService.list(params);
      set({ tasks: res.data.items, total: res.data.total, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error?.message || '加载任务失败', loading: false });
    }
  },

  create: async (data) => {
    const res = await taskService.create(data);
    get().fetchTasks({ page: 1, pageSize: 50 });
    return res.data;
  },

  toggle: async (id) => {
    const res = await taskService.toggleStatus(id);
    // 局部更新列表中的条目
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? res.data : t)),
    }));
    return res.data;
  },

  update: async (id, data) => {
    const res = await taskService.update(id, data);
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? res.data : t)) }));
    return res.data;
  },

  remove: async (id) => {
    await taskService.remove(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },
}));
