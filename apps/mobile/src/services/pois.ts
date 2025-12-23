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
    const response = await api.get('/pois', { params });
    return response.data;
  },

  async getPOI(id: string): Promise<POI> {
    const response = await api.get(`/pois/${id}`);
    return response.data;
  },

  async createPOI(data: CreatePOIData): Promise<POI> {
    const response = await api.post('/pois', data);
    return response.data;
  },

  async updatePOI(id: string, data: Partial<CreatePOIData>): Promise<POI> {
    const response = await api.patch(`/pois/${id}`, data);
    return response.data;
  },

  async deletePOI(id: string): Promise<void> {
    await api.delete(`/pois/${id}`);
  },

  async ratePOI(id: string, rating: number): Promise<POI> {
    const response = await api.post(`/pois/${id}/rate`, { rating });
    return response.data;
  },

  async getMyPOIs(): Promise<POI[]> {
    const response = await api.get('/pois/me');
    return response.data;
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
