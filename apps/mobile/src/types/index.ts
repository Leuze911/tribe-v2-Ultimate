export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalPois: number;
  badges: Badge[];
  createdAt: string;
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
  category: Category;
  images: string[];
  rating?: number;
  totalRatings: number;
  author: {
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
  refreshToken: string;
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
