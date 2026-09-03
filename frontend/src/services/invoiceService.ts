import httpService from './http';
import {
  Invoice, CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryParams,
  ApiResponse, PaginatedResponse,
} from '../types/api';

class InvoiceService {
  async list(params?: InvoiceQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Invoice>>>('/invoices', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return res.data!;
  }

  async create(data: CreateInvoiceDto) {
    const res = await httpService.post<ApiResponse<Invoice>>('/invoices', data);
    return res.data!;
  }

  async update(id: number, data: UpdateInvoiceDto) {
    const res = await httpService.put<ApiResponse<Invoice>>(`/invoices/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/invoices/${id}`);
    return res.data!;
  }

  async stats() {
    const res = await httpService.get<ApiResponse<any>>('/invoices/stats');
    return res.data!;
  }

  async linkTimeEntries(id: number, timeEntryIds: number[]) {
    const res = await httpService.post<ApiResponse<Invoice>>(`/invoices/${id}/link-time-entries`, { timeEntryIds });
    return res.data!;
  }

  async recordPayment(id: number, amount: number) {
    const res = await httpService.post<ApiResponse<Invoice>>(`/invoices/${id}/payment`, { amount });
    return res.data!;
  }
}

export const invoiceService = new InvoiceService();
