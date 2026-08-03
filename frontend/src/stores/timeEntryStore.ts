import { create } from 'zustand';
import { timeEntryService } from '../services/timeEntryService';
import { TimeEntry, TimeEntryFormData } from '../types/api';

interface TimeEntryState {
  entries: TimeEntry[];
  total: number;
  loading: boolean;
  running: TimeEntry | null;
  elapsed: number; // seconds since start
  timerRef: number | null;
  fetchEntries: (params?: { page?: number; pageSize?: number; matterId?: number }) => Promise<void>;
  fetchRunning: () => Promise<void>;
  startTimer: (data: { matterId: number; clientId: number; description: string; isBillable?: boolean }) => Promise<void>;
  stopTimer: (id: number) => Promise<void>;
  createManual: (data: TimeEntryFormData) => Promise<void>;
  remove: (id: number) => Promise<void>;
  tickElapsed: () => void;
  clearTimer: () => void;
}

export const useTimeEntryStore = create<TimeEntryState>((set, get) => ({
  entries: [],
  total: 0,
  loading: false,
  running: null,
  elapsed: 0,
  timerRef: null,

  fetchEntries: async (params) => {
    set({ loading: true });
    try {
      const res = await timeEntryService.list(params);
      set({ entries: res.data.items, total: res.data.total, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchRunning: async () => {
    try {
      const res = await timeEntryService.getRunning();
      const running = res.data;
      if (running) {
        set({ running });
        const start = new Date(running.startTime).getTime();
        set({ elapsed: Math.floor((Date.now() - start) / 1000) });
      } else {
        set({ running: null, elapsed: 0 });
      }
    } catch { /* noop */ }
  },

  startTimer: async (data) => {
    const res = await timeEntryService.start(data);
    const running = res.data;
    set({ running });
    const start = new Date(running.startTime).getTime();
    set({ elapsed: Math.floor((Date.now() - start) / 1000) });
  },

  stopTimer: async (id) => {
    await timeEntryService.stop(id);
    set({ running: null, elapsed: 0 });
    get().fetchEntries({ page: 1, pageSize: 20 });
  },

  createManual: async (data) => {
    await timeEntryService.createManual(data);
    get().fetchEntries({ page: 1, pageSize: 20 });
  },

  remove: async (id) => {
    await timeEntryService.remove(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  tickElapsed: () => {
    const { running } = get();
    if (running) {
      const start = new Date(running.startTime).getTime();
      set({ elapsed: Math.floor((Date.now() - start) / 1000) });
    }
  },

  clearTimer: () => {
    const { timerRef } = get();
    if (timerRef) clearInterval(timerRef);
    set({ timerRef: null });
  },
}));
