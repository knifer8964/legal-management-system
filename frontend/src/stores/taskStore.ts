import { create } from 'zustand';
import { taskService } from '../services/taskService';
import { Task, CreateTaskDto, UpdateTaskDto, TaskQueryParams } from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  pagination: Pagination;
  fetchTasks: (params?: TaskQueryParams) => Promise<void>;
  createTask: (data: CreateTaskDto) => Promise<Task>;
  updateTask: (id: number, data: UpdateTaskDto) => Promise<Task>;
  toggleTask: (id: number) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchTasks: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await taskService.list(params);
      set({
        tasks: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (data) => {
    const task = await taskService.create(data);
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, data) => {
    const task = await taskService.update(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    }));
    return task;
  },

  toggleTask: async (id) => {
    const task = await taskService.toggle(id);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    }));
    return task;
  },

  deleteTask: async (id) => {
    await taskService.remove(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
}));
