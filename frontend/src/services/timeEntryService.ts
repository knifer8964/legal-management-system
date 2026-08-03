import httpService from '../http';
import { TimeEntry, TimeEntryFormData } from '../types/api';

class TimeEntryService {
  async list(params?: { page?: number; pageSize?: number; matterId?: number; clientId?: number; isBillable?: boolean; startDate?: string; endDate?: string }) {
    const res = await httpService.get<{ items: TimeEntry[]; total: number; page: number; pageSize: number }>('/time-entries', params);
    return res.data;
  }

  async getById(id: number) {
    const res = await httpService.get<TimeEntry>(`/time-entries/${id}`);
    return res.data;
  }

  async start(data: { matterId: number; clientId: number; description: string; isBillable?: boolean }) {
    const res = await httpService.post<TimeEntry>('/time-entries/start', data);
    return res.data;
  }

  async stop(id: number) {
    const res = await httpService.put<TimeEntry>(`/time-entries/${id}/stop`, {});
    return res.data;
  }

  async getRunning() {
    const res = await httpService.get<TimeEntry | null>('/time-entries/running');
    return res.data;
  }

  async createManual(data: TimeEntryFormData) {
    const res = await httpService.post<TimeEntry>('/time-entries/manual', data);
    return res.data;
  }

  async update(id: number, data: Partial<TimeEntryFormData>) {
    const res = await httpService.put<TimeEntry>(`/time-entries/${id}`, data);
    return res.data;
  }

  async remove(id: number) {
    const res = await httpService.delete<null>(`/time-entries/${id}`);
    return res.data;
  }

  async stats(params?: { startDate?: string; endDate?: string }) {
    const res = await httpService.get<{ totalDuration: number; totalAmount: number; totalEntries: number }>('/time-entries/stats', params);
    return res.data;
  }
}

export const timeEntryService = new TimeEntryService();
