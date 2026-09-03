import httpService from './http';
import {
  Document, CreateDocumentDto, UpdateDocumentDto, DocumentQueryParams,
  DocumentStats, ApiResponse, PaginatedResponse,
} from '../types/api';

class DocumentService {
  async list(params?: DocumentQueryParams) {
    const res = await httpService.get<ApiResponse<PaginatedResponse<Document>>>('/documents', params);
    return res.data!;
  }

  async stats(params?: { clientId?: number; matterId?: number }) {
    const res = await httpService.get<ApiResponse<DocumentStats>>('/documents/stats', params);
    return res.data!;
  }

  async getById(id: number) {
    const res = await httpService.get<ApiResponse<Document>>(`/documents/${id}`);
    return res.data!;
  }

  async create(data: CreateDocumentDto) {
    const res = await httpService.post<ApiResponse<Document>>('/documents', data);
    return res.data!;
  }

  async update(id: number, data: UpdateDocumentDto) {
    const res = await httpService.put<ApiResponse<Document>>(`/documents/${id}`, data);
    return res.data!;
  }

  async remove(id: number) {
    const res = await httpService.delete<ApiResponse<null>>(`/documents/${id}`);
    return res.data!;
  }
}

export const documentService = new DocumentService();
