// Core Types for ShopSmart App

// User and Authentication
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  healthGoals: string[];
  preferredStores: string[];
  budgetRange?: {
    min: number;
    max: number;
  };
  organicPreference: 'required' | 'preferred' | 'no-preference';
}

// Location and Store
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Store {
  id: string;
  chain: StoreChain;
  name: string;
  address: string;
  location: Location;
  phone?: string;
  hours: StoreHours;
  services: StoreServices;
  layout?: StoreLayout;
  distance?: number; // in miles, calculated based on user location
}

export type StoreChain = 'walmart' | 'target' | 'costco' | 'kroger' | 'amazon';

export interface StoreHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}

export interface TimeRange {
  open: string; // "08:00"
  close: string; // "22:00"
  closed?: boolean;
}

export interface StoreServices {
  pharmacy: boolean;
  grocery: boolean;
  pickup: boolean;
  delivery: boolean;
  gastation: boolean;
}

export interface StoreLayout {
  type: 'supercenter' | 'neighborhood' | 'warehouse' | 'standard';
  departments: Department[];
  aisles: Aisle[];
  entrance: Location;
  checkouts: Location[];
}

export interface Department {
  id: string;
  name: string;
  location: Location;
  aisles: string[];
}

export interface Aisle {
  id: string;
  number: string;
  name: string;
  location: Location;
  categories: string[];
}

// Product and Nutrition
export interface Product {
  id: string;
  upc?: string;
  name: string;
  brand: string;
  description?: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  storeData: StoreProductData[];
  nutritionData?: NutritionData;
  scoring?: NutritionScoring;
  certifications: ProductCertification[];
  ingredients?: string[];
  allergens?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreProductData {
  storeId: string;
  storeChain: StoreChain;
  productId: string; // Store-specific product ID
  price: number;
  salePrice?: number;
  inStock: boolean;
  aisle?: string;
  section?: string;
  availability: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: Date;
}

export interface NutritionData {
  servingSize?: string;
  servingsPerContainer?: number;
  calories?: number;
  caloriesFromFat?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbs?: number;
  dietaryFiber?: number;
  sugars?: number;
  addedSugars?: number;
  protein?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  // Additional nutrients
  potassium?: number;
  vitaminD?: number;
}

export interface NutritionScoring {
  finalScore: number; // 0-100
  category: ScoreCategory;
  color: ScoreColor;
  breakdown: {
    nutritionalQuality: number; // 60% weight
    additivesImpact: number; // 30% weight
    organicBonus: number; // 10% weight
  };
  additives: AdditiveInfo[];
  improvements?: string[];
}

export type ScoreCategory = 'excellent' | 'good' | 'fair' | 'poor';
export type ScoreColor = 'green' | 'light-green' | 'orange' | 'red';

export interface AdditiveInfo {
  code: string;
  name: string;
  riskLevel: 'green' | 'yellow' | 'orange' | 'red';
  description?: string;
  pointDeduction: number;
}

export type ProductCertification = 
  | 'organic'
  | 'non-gmo'
  | 'gluten-free'
  | 'vegan'
  | 'vegetarian'
  | 'kosher'
  | 'halal'
  | 'fair-trade';

// Shopping List and Route
export interface ShoppingList {
  id: string;
  name: string;
  userId: string;
  items: ShoppingListItem[];
  stores: ShoppingListStore[];
  totalEstimatedCost: number;
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  id: string;
  productId?: string;
  customName?: string; // For manually entered items
  quantity: number;
  unit?: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  alternatives?: string[]; // Alternative product IDs
  storeAssignment?: string; // Store ID where this item will be purchased
}

export interface ShoppingListStore {
  storeId: string;
  items: string[]; // Item IDs assigned to this store
  estimatedCost: number;
  route?: StoreRoute;
  completed: boolean;
}

export interface StoreRoute {
  storeId: string;
  stops: RouteStop[];
  estimatedTime: number; // in minutes
  totalDistance: number; // in feet
  optimizationFactors: {
    temperature: boolean; // Frozen/refrigerated items last
    weight: boolean; // Heavy items first
    fragility: boolean; // Fragile items handled carefully
  };
}

export interface RouteStop {
  itemIds: string[];
  aisle: string;
  section?: string;
  order: number;
  estimatedTime: number;
  location?: Location;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search and Discovery
export interface ProductSearchParams {
  query: string;
  storeId?: string;
  category?: string;
  maxPrice?: number;
  minScore?: number;
  certifications?: ProductCertification[];
  sortBy?: 'relevance' | 'price' | 'score' | 'popularity';
  limit?: number;
  offset?: number;
}

export interface ProductSearchResult {
  products: Product[];
  suggestions?: string[];
  totalResults: number;
  searchTime: number;
  filters: SearchFilters;
}

export interface SearchFilters {
  categories: FilterOption[];
  priceRanges: FilterOption[];
  certifications: FilterOption[];
  stores: FilterOption[];
}

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

// Nutrition Database Integration
export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  categories: string;
  ingredients_text: string;
  nutriments: Record<string, number>;
  additives_tags: string[];
  labels_tags: string[];
  image_url?: string;
}

export interface USDAProduct {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients: USDANutrient[];
}

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;