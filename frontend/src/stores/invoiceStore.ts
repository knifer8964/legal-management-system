import { create } from 'zustand';
import { invoiceService } from '../services/invoiceService';
import { Invoice, CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryParams, Payment } from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  pagination: Pagination;
  fetchInvoices: (params?: InvoiceQueryParams) => Promise<void>;
  createInvoice: (data: CreateInvoiceDto) => Promise<Invoice>;
  updateInvoice: (id: number, data: UpdateInvoiceDto) => Promise<Invoice>;
  deleteInvoice: (id: number) => Promise<void>;
  recordPayment: (id: number, amount: number, method?: string, note?: string) => Promise<Invoice>;
  getPayments: (id: number) => Promise<Payment[]>;
  linkTimeEntries: (id: number, timeEntryIds: number[]) => Promise<Invoice>;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },

  fetchInvoices: async (params = { page: 1, pageSize: 10 }) => {
    set({ loading: true });
    try {
      const result = await invoiceService.list(params);
      set({ invoices: result.data, pagination: result.pagination, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  createInvoice: async (data) => {
    const invoice = await invoiceService.create(data);
    set((state) => ({
      invoices: [invoice, ...state.invoices],
    }));
    return invoice;
  },

  updateInvoice: async (id, data) => {
    const invoice = await invoiceService.update(id, data);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? invoice : inv)),
    }));
    return invoice;
  },

  deleteInvoice: async (id) => {
    await invoiceService.remove(id);
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id),
    }));
  },

  recordPayment: async (id, amount, method, note) => {
    const invoice = await invoiceService.recordPayment(id, amount, method, note);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? invoice : inv)),
    }));
    return invoice;
  },

  getPayments: async (id) => {
    return invoiceService.getPayments(id);
  },

  linkTimeEntries: async (id, timeEntryIds) => {
    const invoice = await invoiceService.linkTimeEntries(id, timeEntryIds);
    set((state) => ({
      invoices: state.invoices.map((inv) => (inv.id === id ? invoice : inv)),
    }));
    return invoice;
  },
}));
