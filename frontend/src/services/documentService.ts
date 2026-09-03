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

  async uploadDocument(formData: FormData) {
    // axios 自动设置 multipart/form-data 及 boundary，无需手动指定 Content-Type
    const res = await httpService.post<ApiResponse<Document>>('/documents', formData);
    return res.data!;
  }

  async download(id: number, originalName?: string) {
    const token = localStorage.getItem('token');
    const url = `http://127.0.0.1:3000/api/v1/documents/${id}/download`;
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error('下载失败');
    }
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = originalName || `document-${id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
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
