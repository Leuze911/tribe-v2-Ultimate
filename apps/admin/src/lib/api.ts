const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Location {
  id: string;
  name: string;
  category: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string;
  photos: string[];
  status: 'pending' | 'validated' | 'rejected';
  pointsAwarded: number;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  collector: {
    id: string;
    fullName: string | null;
    email: string;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Stats {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = 'Bearer ' + this.token;
    }

    const response = await fetch(API_URL + endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  }

  async getLocations(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    city?: string;
  } = {}): Promise<PaginatedResponse<Location>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.category) searchParams.set('category', params.category);
    if (params.city) searchParams.set('city', params.city);

    const queryStr = searchParams.toString();
    return this.request('/api/v1/locations' + (queryStr ? '?' + queryStr : ''));
  }

  async getLocation(id: string): Promise<Location> {
    return this.request('/api/v1/locations/' + id);
  }

  async validateLocation(
    id: string,
    action: 'validate' | 'reject',
    reason?: string,
    pointsToAward?: number
  ): Promise<Location> {
    return this.request('/api/v1/locations/' + id + '/validate', {
      method: 'PATCH',
      body: JSON.stringify({ action, reason, pointsToAward }),
    });
  }

  async getStats(): Promise<Stats> {
    const [total, pending, validated, rejected] = await Promise.all([
      this.getLocations({ limit: 1 }),
      this.getLocations({ limit: 1, status: 'pending' }),
      this.getLocations({ limit: 1, status: 'validated' }),
      this.getLocations({ limit: 1, status: 'rejected' }),
    ]);

    return {
      total: total.total,
      pending: pending.total,
      validated: validated.total,
      rejected: rejected.total,
    };
  }
}

export const api = new ApiClient();
