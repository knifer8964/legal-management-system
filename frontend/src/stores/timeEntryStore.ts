import { create } from 'zustand';
import { timeEntryService } from '../services/timeEntryService';
import { TimeEntry, CreateTimeEntryDto, UpdateTimeEntryDto, TimeEntryQueryParams } from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface TimeEntryState {
  entries: TimeEntry[];
  running: TimeEntry | null;
  elapsed: number; // seconds
  loading: boolean;
  pagination: Pagination;
  fetchEntries: (params?: TimeEntryQueryParams) => Promise<void>;
  fetchRunning: () => Promise<void>;
  tickElapsed: () => void;
  startTimer: (data: CreateTimeEntryDto) => Promise<TimeEntry>;
  stopTimer: (id: number) => Promise<TimeEntry>;
  updateEntry: (id: number, data: UpdateTimeEntryDto) => Promise<TimeEntry>;
  deleteEntry: (id: number) => Promise<void>;
}

let timerInterval: any = null;

export const useTimeEntryStore = create<TimeEntryState>((set, get) => ({
  entries: [],
  running: null,
  elapsed: 0,
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchEntries: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await timeEntryService.list(params);
      set({ entries: result.data, pagination: result.pagination, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  fetchRunning: async () => {
    const running = await timeEntryService.getRunning();
    set({ running });
    if (running) {
      const start = new Date(running.startTime).getTime();
      const now = Date.now();
      set({ elapsed: Math.floor((now - start) / 1000) });
      if (!timerInterval) {
        timerInterval = setInterval(() => get().tickElapsed(), 1000);
      }
    } else {
      set({ elapsed: 0 });
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  },

  tickElapsed: () => {
    const { running } = get();
    if (running) {
      const start = new Date(running.startTime).getTime();
      set({ elapsed: Math.floor((Date.now() - start) / 1000) });
    }
  },

  startTimer: async (data) => {
    const entry = await timeEntryService.start(data);
    set({ running: entry });
    await get().fetchRunning();
    return entry;
  },

  stopTimer: async (id) => {
    const entry = await timeEntryService.stop(id);
    set((state) => ({
      entries: [entry, ...state.entries],
      running: null,
      elapsed: 0,
    }));
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    return entry;
  },

  updateEntry: async (id, data) => {
    const entry = await timeEntryService.update(id, data);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? entry : e)),
    }));
    return entry;
  },

  deleteEntry: async (id) => {
    await timeEntryService.remove(id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
  },
}));
