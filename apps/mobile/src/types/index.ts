export interface User {
  id: string;
  email: string;
  fullName?: string;       // API field (was displayName)
  phone?: string;
  avatarUrl?: string;      // API field (was avatar)
  role: 'collector' | 'validator' | 'admin';
  points: number;          // API field (was xp)
  level: number;
  createdAt: string;
  // Computed/optional fields for UI (populated by other API calls)
  xpToNextLevel?: number;
  totalPois?: number;
  badges?: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface POI {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: Category;
  categoryId?: string;
  images: string[];
  rating?: number;
  totalRatings: number;
  status?: 'pending' | 'validated' | 'rejected';
  userId?: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  distance?: number;
  createdAt: string;
}

export interface CreatePOIData {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  images?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;  // Optional - backend doesn't provide it
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends Location {
  latitudeDelta: number;
  longitudeDelta: number;
}
