import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Store, 
  Product, 
  ProductSearchParams,
  ShoppingList,
  ShoppingListItem,
  Location,
  NutritionData,
  NutritionScoring
} from '@/shared/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      });
    }

    // Handle HTTP errors
    const { status, data } = error.response;
    
    if (status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-store');
      window.location.href = '/login';
    }

    return Promise.reject({
      message: data?.error || data?.message || 'An error occurred',
      code: data?.code || `HTTP_${status}`,
      status
    });
  }
);

// Auth API
export const authApi = {
  setToken: (token: string) => {
    localStorage.setItem('auth-token', token);
  },

  clearToken: () => {
    localStorage.removeItem('auth-token');
  },

  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> => {
    return api.post('/users/login', credentials);
  },

  register: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password: string;
    preferences?: any;
  }): Promise<ApiResponse<{ user: User; token: string }>> => {
    return api.post('/users/register', userData);
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return api.get('/users/profile');
  },

  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<Partial<User>>> => {
    return api.put('/users/profile', updates);
  },

  updatePreferences: async (preferences: any): Promise<ApiResponse<any>> => {
    return api.put('/users/preferences', preferences);
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> => {
    return api.post('/users/change-password', passwordData);
  }
};

// Stores API
export const storesApi = {
  findNearby: async (params: {
    lat: number;
    lng: number;
    radius?: number;
    chains?: string[];
  }): Promise<ApiResponse<{ stores: Store[]; location: Location; radius: number; count: number }>> => {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.chains && { chains: params.chains.join(',') })
    });

    return api.get(`/stores/nearby?${queryParams}`);
  },

  getStore: async (storeId: string): Promise<ApiResponse<Store>> => {
    return api.get(`/stores/${storeId}`);
  },

  getChains: async (): Promise<ApiResponse<Array<{ id: string; name: string; displayName: string }>>> => {
    return api.get('/stores/chains');
  },

  searchStores: async (params: {
    q: string;
    lat?: number;
    lng?: number;
    radius?: number;
    chain?: string;
  }): Promise<ApiResponse<{ stores: Store[]; query: string; count: number }>> => {
    const queryParams = new URLSearchParams({
      q: params.q,
      ...(params.lat && { lat: params.lat.toString() }),
      ...(params.lng && { lng: params.lng.toString() }),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.chain && { chain: params.chain })
    });

    return api.get(`/stores/search?${queryParams}`);
  }
};

// Products API
export const productsApi = {
  search: async (params: ProductSearchParams): Promise<ApiResponse<{
    products: Product[];
    totalResults: number;
    searchTime: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>> => {
    const queryParams = new URLSearchParams({
      q: params.query,
      ...(params.storeId && { storeId: params.storeId }),
      ...(params.category && { category: params.category }),
      ...(params.maxPrice && { maxPrice: params.maxPrice.toString() }),
      ...(params.minScore && { minScore: params.minScore.toString() }),
      ...(params.certifications && { certifications: params.certifications.join(',') }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.limit && { limit: params.limit.toString() }),
      ...(params.offset && { offset: params.offset.toString() })
    });

    return api.get(`/products/search?${queryParams}`);
  },

  getProduct: async (productId: string, storeId?: string): Promise<ApiResponse<Product>> => {
    const queryParams = storeId ? `?storeId=${storeId}` : '';
    return api.get(`/products/${productId}${queryParams}`);
  },

  getAlternatives: async (productId: string, storeId?: string, limit?: number): Promise<ApiResponse<{
    originalProduct: { id: string; name: string; brand: string; score: number };
    alternatives: Product[];
    count: number;
  }>> => {
    const queryParams = new URLSearchParams({
      ...(storeId && { storeId }),
      ...(limit && { limit: limit.toString() })
    });

    return api.get(`/products/${productId}/alternatives?${queryParams}`);
  },

  enrichProducts: async (products: Partial<Product>[]): Promise<ApiResponse<{
    results: Array<{ product: Partial<Product>; nutrition: NutritionData | null; enriched: boolean }>;
    enrichedCount: number;
    totalProducts: number;
    enrichmentRate: number;
  }>> => {
    return api.post('/products/enrich', { products });
  },

  getCategories: async (): Promise<ApiResponse<Array<{ name: string; count: number }>>> => {
    return api.get('/products/categories');
  }
};

// Shopping Lists API
export const shoppingListApi = {
  getLists: async (status?: string): Promise<ApiResponse<ShoppingList[]>> => {
    const queryParams = status ? `?status=${status}` : '';
    return api.get(`/shopping-lists${queryParams}`);
  },

  getList: async (listId: string): Promise<ApiResponse<ShoppingList>> => {
    return api.get(`/shopping-lists/${listId}`);
  },

  createList: async (data: { name: string; items?: Partial<ShoppingListItem>[] }): Promise<ApiResponse<ShoppingList>> => {
    return api.post('/shopping-lists', data);
  },

  updateList: async (listId: string, updates: Partial<ShoppingList>): Promise<ApiResponse<ShoppingList>> => {
    return api.put(`/shopping-lists/${listId}`, updates);
  },

  deleteList: async (listId: string): Promise<ApiResponse<void>> => {
    return api.delete(`/shopping-lists/${listId}`);
  },

  addItems: async (listId: string, items: Partial<ShoppingListItem>[]): Promise<ApiResponse<ShoppingListItem[]>> => {
    return api.post(`/shopping-lists/${listId}/items`, { items });
  },

  updateItem: async (listId: string, itemId: string, updates: Partial<ShoppingListItem>): Promise<ApiResponse<ShoppingListItem>> => {
    return api.put(`/shopping-lists/${listId}/items/${itemId}`, updates);
  },

  removeItem: async (listId: string, itemId: string): Promise<ApiResponse<void>> => {
    return api.delete(`/shopping-lists/${listId}/items/${itemId}`);
  },

  assignStores: async (listId: string, options: {
    preferredStores?: string[];
    optimizeForPrice?: boolean;
  }): Promise<ApiResponse<{
    storeAssignments: Array<{ storeId: string; itemCount: number; estimatedCost: number }>;
    totalEstimatedCost: number;
  }>> => {
    return api.post(`/shopping-lists/${listId}/assign-stores`, options);
  }
};

// Nutrition API
export const nutritionApi = {
  getByBarcode: async (upc: string): Promise<ApiResponse<{
    upc: string;
    nutrition: NutritionData;
    scoring: NutritionScoring;
  }>> => {
    return api.get(`/nutrition/barcode/${upc}`);
  },

  search: async (query: string, brand?: string, limit?: number): Promise<ApiResponse<{
    results: Array<{ nutrition: NutritionData; scoring: NutritionScoring | null }>;
    query: string;
    brand?: string;
    count: number;
    totalFound: number;
  }>> => {
    const queryParams = new URLSearchParams({
      q: query,
      ...(brand && { brand }),
      ...(limit && { limit: limit.toString() })
    });

    return api.get(`/nutrition/search?${queryParams}`);
  },

  calculateScore: async (nutritionData: NutritionData): Promise<ApiResponse<NutritionScoring>> => {
    return api.post('/nutrition/score', { nutritionData });
  },

  batchCalculateScores: async (nutritionDataList: NutritionData[]): Promise<ApiResponse<{
    scores: NutritionScoring[];
    count: number;
  }>> => {
    return api.post('/nutrition/batch-score', { nutritionDataList });
  },

  getAdditives: async (riskLevel?: string, search?: string): Promise<ApiResponse<{
    additives: any[];
    summary: Array<{ riskLevel: string; count: number }>;
    total: number;
  }>> => {
    const queryParams = new URLSearchParams({
      ...(riskLevel && { riskLevel }),
      ...(search && { search })
    });

    return api.get(`/nutrition/additives?${queryParams}`);
  },

  getAdditive: async (eNumber: string): Promise<ApiResponse<{
    additive: any;
    examples: Array<{ id: string; name: string; brand: string; category: string }>;
  }>> => {
    return api.get(`/nutrition/additives/${eNumber}`);
  },

  analyzeIngredients: async (ingredients: string): Promise<ApiResponse<{
    additives: any[];
    additivesScore: number;
    riskAssessment: string;
    recommendations: string[];
  }>> => {
    return api.post('/nutrition/analyze-ingredients', { ingredients });
  },

  getTrends: async (category?: string, timeframe?: string): Promise<ApiResponse<{
    categoryDistribution: Array<{ category: string; count: number }>;
    averageScore: number;
    totalScoredProducts: number;
    additiveRiskDistribution: Array<{ riskLevel: string; count: number }>;
  }>> => {
    const queryParams = new URLSearchParams({
      ...(category && { category }),
      ...(timeframe && { timeframe })
    });

    return api.get(`/nutrition/analysis/trends?${queryParams}`);
  },

  getScoreDistribution: async (category?: string): Promise<ApiResponse<{
    distribution: Array<{ range: string; count: number; min: number; max: number }>;
    topPerformers: Array<{ id: string; name: string; brand: string; category: string; score: number }>;
    bottomPerformers: Array<{ id: string; name: string; brand: string; category: string; score: number }>;
  }>> => {
    const queryParams = category ? `?category=${category}` : '';
    return api.get(`/nutrition/health-scores/distribution${queryParams}`);
  }
};

export default api;