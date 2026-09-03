import { create } from 'zustand';
import { documentService } from '../services/documentService';
import {
  Document, CreateDocumentDto, UpdateDocumentDto, DocumentQueryParams, DocumentStats,
} from '../types/api';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface DocumentState {
  documents: Document[];
  loading: boolean;
  pagination: Pagination;
  stats: DocumentStats | null;
  fetchDocuments: (params?: DocumentQueryParams) => Promise<void>;
  fetchStats: (params?: { clientId?: number; matterId?: number }) => Promise<void>;
  createDocument: (data: CreateDocumentDto) => Promise<Document>;
  uploadDocument: (formData: FormData) => Promise<Document>;
  updateDocument: (id: number, data: UpdateDocumentDto) => Promise<Document>;
  deleteDocument: (id: number) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  loading: false,
  pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  stats: null,

  fetchDocuments: async (params = { page: 1, pageSize: 20 }) => {
    set({ loading: true });
    try {
      const result = await documentService.list(params);
      set({
        documents: result.data,
        pagination: result.pagination,
        loading: false,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchStats: async (params) => {
    const stats = await documentService.stats(params);
    set({ stats });
  },

  createDocument: async (data) => {
    const doc = await documentService.create(data);
    set((state) => ({ documents: [doc, ...state.documents] }));
    return doc;
  },

  uploadDocument: async (formData) => {
    const doc = await documentService.uploadDocument(formData);
    set((state) => ({ documents: [doc, ...state.documents] }));
    return doc;
  },

  updateDocument: async (id, data) => {
    const doc = await documentService.update(id, data);
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? doc : d)),
    }));
    return doc;
  },

  deleteDocument: async (id) => {
    await documentService.remove(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },
}));
