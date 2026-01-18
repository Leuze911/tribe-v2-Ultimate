import api from './api';
import type { POI, CreatePOIData, Category } from '../types';

export interface GetPOIsParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const poisService = {
  async getPOIs(params: GetPOIsParams = {}): Promise<POI[]> {
    const response = await api.get('/locations', { params });
    // API returns { data: [...], total, page, ... } - extract the array
    return response.data.data || response.data || [];
  },

  async getPOI(id: string): Promise<POI> {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },

  async createPOI(data: CreatePOIData): Promise<POI> {
    const response = await api.post('/locations', data);
    return response.data;
  },

  async updatePOI(id: string, data: Partial<CreatePOIData>): Promise<POI> {
    const response = await api.put(`/locations/${id}`, data);
    return response.data;
  },

  async deletePOI(id: string): Promise<void> {
    await api.delete(`/locations/${id}`);
  },

  async ratePOI(id: string, rating: number): Promise<POI> {
    const response = await api.post(`/locations/${id}/rate`, { rating });
    return response.data;
  },

  async getMyPOIs(): Promise<POI[]> {
    // L'API n'a pas d'endpoint /me, on filtre côté client ou utilise nearby
    const response = await api.get('/locations');
    // API returns { data: [...], total, page, ... } - extract the array
    return response.data.data || response.data || [];
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },

  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as unknown as Blob);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  },
};

export default poisService;
