import httpService from './http';
import {
  TimeEntry, CreateTimeEntryDto, UpdateTimeEntryDto, TimeEntryQueryParams,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class TimeEntryService {
  async list(params?: TimeEntryQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<TimeEntry>>>('/time-entries', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<TimeEntry>>(`/time-entries/${id}`);
    return res.data!;
  }

  async getRunning() {
    const res = await httpService.get<ApiResponse<TimeEntry | null>>('/time-entries/running');
    return res.data!;
  }

  async start(data: CreateTimeEntryDto) {
    const res = await httpService.post<ApiResponse<TimeEntry>>('/time-entries/start', data);
    return res.data!;
  }

  async stop(id: number) {
    const res = await httpService.patch<ApiResponse<TimeEntry>>(`/time-entries/${id}/stop`);
    return res.data!;
  }

  async createManual(data: CreateTimeEntryDto & { startTime: string; endTime: string }) {
    const res = await httpService.post<ApiResponse<TimeEntry>>('/time-entries/manual', data);
    return res.data!;
  }

  async update(id: number, data: UpdateTimeEntryDto) {
    const res = await httpService.put<ApiResponse<TimeEntry>>(`/time-entries/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/time-entries/${id}`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<any>>('/time-entries/stats');
    return res.data!;
  }
}

export const timeEntryService = new TimeEntryService();
