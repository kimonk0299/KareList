// Shared Constants for ShopSmart App

// Store Chains
export const STORE_CHAINS = {
  WALMART: 'walmart',
  TARGET: 'target', 
  COSTCO: 'costco',
  KROGER: 'kroger',
  AMAZON: 'amazon'
} as const;

export const STORE_CHAIN_NAMES = {
  [STORE_CHAINS.WALMART]: 'Walmart',
  [STORE_CHAINS.TARGET]: 'Target',
  [STORE_CHAINS.COSTCO]: 'Costco',
  [STORE_CHAINS.KROGER]: 'Kroger',
  [STORE_CHAINS.AMAZON]: 'Amazon'
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = {
  PRODUCE: 'produce',
  MEAT_SEAFOOD: 'meat-seafood',
  DAIRY: 'dairy',
  BAKERY: 'bakery',
  FROZEN: 'frozen',
  PANTRY: 'pantry',
  BEVERAGES: 'beverages',
  SNACKS: 'snacks',
  HEALTH_BEAUTY: 'health-beauty',
  HOUSEHOLD: 'household',
  BABY: 'baby',
  PETS: 'pets'
} as const;

export const CATEGORY_NAMES = {
  [PRODUCT_CATEGORIES.PRODUCE]: 'Fresh Produce',
  [PRODUCT_CATEGORIES.MEAT_SEAFOOD]: 'Meat & Seafood',
  [PRODUCT_CATEGORIES.DAIRY]: 'Dairy & Eggs',
  [PRODUCT_CATEGORIES.BAKERY]: 'Bakery & Bread',
  [PRODUCT_CATEGORIES.FROZEN]: 'Frozen Foods',
  [PRODUCT_CATEGORIES.PANTRY]: 'Pantry & Dry Goods',
  [PRODUCT_CATEGORIES.BEVERAGES]: 'Beverages',
  [PRODUCT_CATEGORIES.SNACKS]: 'Snacks & Candy',
  [PRODUCT_CATEGORIES.HEALTH_BEAUTY]: 'Health & Beauty',
  [PRODUCT_CATEGORIES.HOUSEHOLD]: 'Household Items',
  [PRODUCT_CATEGORIES.BABY]: 'Baby & Toddler',
  [PRODUCT_CATEGORIES.PETS]: 'Pet Supplies'
} as const;

// Nutrition Scoring
export const SCORING_WEIGHTS = {
  NUTRITIONAL_QUALITY: 0.6,
  ADDITIVES_IMPACT: 0.3,
  ORGANIC_BONUS: 0.1
} as const;

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  POOR: 0
} as const;

export const SCORE_COLORS = {
  EXCELLENT: '#16a34a', // green-600
  GOOD: '#65a30d',     // lime-600  
  FAIR: '#ea580c',     // orange-600
  POOR: '#dc2626'      // red-600
} as const;

// Additive Risk Levels
export const ADDITIVE_RISK_LEVELS = {
  GREEN: 'green',
  YELLOW: 'yellow', 
  ORANGE: 'orange',
  RED: 'red'
} as const;

export const ADDITIVE_POINT_DEDUCTIONS = {
  [ADDITIVE_RISK_LEVELS.GREEN]: 0,
  [ADDITIVE_RISK_LEVELS.YELLOW]: 5,
  [ADDITIVE_RISK_LEVELS.ORANGE]: 10,
  [ADDITIVE_RISK_LEVELS.RED]: 20
} as const;

// Product Certifications
export const CERTIFICATIONS = {
  ORGANIC: 'organic',
  NON_GMO: 'non-gmo',
  GLUTEN_FREE: 'gluten-free',
  VEGAN: 'vegan',
  VEGETARIAN: 'vegetarian',
  KOSHER: 'kosher',
  HALAL: 'halal',
  FAIR_TRADE: 'fair-trade'
} as const;

export const CERTIFICATION_NAMES = {
  [CERTIFICATIONS.ORGANIC]: 'USDA Organic',
  [CERTIFICATIONS.NON_GMO]: 'Non-GMO',
  [CERTIFICATIONS.GLUTEN_FREE]: 'Gluten-Free',
  [CERTIFICATIONS.VEGAN]: 'Vegan',
  [CERTIFICATIONS.VEGETARIAN]: 'Vegetarian',
  [CERTIFICATIONS.KOSHER]: 'Kosher',
  [CERTIFICATIONS.HALAL]: 'Halal',
  [CERTIFICATIONS.FAIR_TRADE]: 'Fair Trade'
} as const;

// Search and Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SEARCH_RADIUS = 25; // miles

// Cache Durations (in seconds)
export const CACHE_DURATIONS = {
  STORE_INVENTORY: 24 * 60 * 60,      // 24 hours
  NUTRITION_SCORES: 7 * 24 * 60 * 60,  // 1 week
  PRODUCT_SEARCH: 60 * 60,             // 1 hour
  STORE_LOCATIONS: 30 * 24 * 60 * 60,  // 30 days
  USER_SESSION: 24 * 60 * 60           // 24 hours
} as const;

// External API Endpoints
export const EXTERNAL_APIS = {
  OPEN_FOOD_FACTS: {
    BASE_URL: 'https://world.openfoodfacts.org',
    PRODUCT_BY_BARCODE: '/api/v2/product',
    SEARCH: '/cgi/search.pl'
  },
  USDA_FOOD_DATA: {
    BASE_URL: 'https://api.nal.usda.gov/fdc/v1',
    SEARCH: '/foods/search',
    FOOD_DETAILS: '/food'
  },
  WALMART_API: {
    BASE_URL: 'https://www.walmart.com',
    STORE_FINDER: '/store/finder',
    SEARCH: '/search',
    PRODUCT_DETAILS: '/ip'
  }
} as const;

// Department Order (for route optimization)
export const DEPARTMENT_ORDER = [
  'pharmacy',      // First - if needed
  'household',     // Heavy/bulky items first
  'pantry',        // Dry goods
  'beverages',     // Heavy liquids
  'health-beauty', // Personal care
  'baby',          // Baby items
  'pets',          // Pet supplies
  'snacks',        // Snacks and candy
  'bakery',        // Fresh baked goods
  'produce',       // Fresh fruits/vegetables
  'meat-seafood',  // Fresh proteins
  'dairy',         // Refrigerated items
  'frozen'         // Frozen items last
] as const;

// Temperature Sensitivity (for route optimization)
export const TEMPERATURE_CATEGORIES = {
  AMBIENT: 'ambient',      // Room temperature
  REFRIGERATED: 'refrigerated', // 32-40°F
  FROZEN: 'frozen'         // 0°F or below
} as const;

export const CATEGORY_TEMPERATURE_MAP = {
  [PRODUCT_CATEGORIES.PRODUCE]: TEMPERATURE_CATEGORIES.REFRIGERATED,
  [PRODUCT_CATEGORIES.MEAT_SEAFOOD]: TEMPERATURE_CATEGORIES.REFRIGERATED,
  [PRODUCT_CATEGORIES.DAIRY]: TEMPERATURE_CATEGORIES.REFRIGERATED,
  [PRODUCT_CATEGORIES.BAKERY]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.FROZEN]: TEMPERATURE_CATEGORIES.FROZEN,
  [PRODUCT_CATEGORIES.PANTRY]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.BEVERAGES]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.SNACKS]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.HEALTH_BEAUTY]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.HOUSEHOLD]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.BABY]: TEMPERATURE_CATEGORIES.AMBIENT,
  [PRODUCT_CATEGORIES.PETS]: TEMPERATURE_CATEGORIES.AMBIENT
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // Validation
  INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
  REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // External Services
  STORE_API_ERROR: 'EXTERNAL_STORE_API_ERROR',
  NUTRITION_API_ERROR: 'EXTERNAL_NUTRITION_API_ERROR',
  LOCATION_SERVICE_ERROR: 'EXTERNAL_LOCATION_SERVICE_ERROR',
  
  // System
  INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'SYSTEM_RATE_LIMIT_EXCEEDED'
} as const;

// API Rate Limits (requests per window)
export const RATE_LIMITS = {
  SEARCH_API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 1000
  },
  STORE_API: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour  
    MAX_REQUESTS: 500
  },
  USER_API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 200
  }
} as const;

// Route Optimization
export const ROUTE_OPTIMIZATION = {
  MAX_WALKING_DISTANCE: 1000, // feet
  AVERAGE_WALKING_SPEED: 3,   // mph
  ITEM_PICKUP_TIME: 30,       // seconds per item
  AISLE_TRANSITION_TIME: 15,  // seconds between aisles
  DEPARTMENT_TRANSITION_TIME: 60 // seconds between departments
} as const;

// Regex Patterns
export const REGEX_PATTERNS = {
  UPC: /^\d{12}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  E_NUMBER: /E\d{3}[a-z]?/gi
} as const;