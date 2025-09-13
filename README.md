# MVP - Architecture & Implementation Plan (Location-Based & Nutrition-Focused)

## MVP Scope Definition

### Core User Journey
1. **App detects user location** → finds nearest Walmart stores
2. **User searches for items** (e.g., "bread") → sees Walmart products
3. **System displays nutrition scores** using Yuka-style algorithm
4. **User builds shopping list** from scored products
5. **System generates optimized route** for selected Walmart store
6. **User navigates store** with efficient path

### Key Features
- ✅ Automatic location-based store discovery
- ✅ Real-time store inventory scraping
- ✅ Robust nutrition scoring (Yuka-style)
- ✅ Product search with alternatives
- ✅ Route optimization within store
- ✅ Aisle-level navigation

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React PWA)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Location  │  │Product   │  │Nutrition │  │Route   │ │
│  │Services  │  │Search    │  │Scores    │  │Display │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │Store     │  │Product   │  │Nutrition │  │Route   │ │
│  │Locator   │  │Search    │  │Scoring   │  │Engine  │ │
│  │API       │  │API       │  │Engine    │  │API     │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │PostgreSQL    │  │Redis Cache  │  │Nutrition DBs │  │
│  │- Products    │  │- Store Data │  │- Open Food   │  │
│  │- Stores      │  │- Scores     │  │  Facts       │  │
│  │- Additives   │  │- Sessions   │  │- USDA        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Data Collection Pipeline                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Walmart Store │  │Nutrition    │  │Additives     │  │
│  │Scraper       │  │Aggregator   │  │Database      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Nutrition Scoring Infrastructure (Week 1)

### Task 1.1: Nutrition Data Pipeline Setup
- [ ] **Open Food Facts Integration**
  ```
  API Endpoints:
  - Product by barcode: /api/v2/product/{barcode}
  - Search products: /api/v2/search
  - Bulk download: CSV/MongoDB dump for offline processing
  ```
- [ ] **USDA FoodData Central Integration**
  - API key registration
  - Branded foods database access
  - Nutrient mapping to our schema
- [ ] **Nutritionix API** (backup source)
  - UPC lookup endpoint
  - Nutrient data extraction

### Task 1.2: Additives Database Creation
- [ ] **Build Additives Reference Table**
  ```sql
  CREATE TABLE additives (
    e_number VARCHAR(10),
    name VARCHAR(255),
    risk_level ENUM('green', 'yellow', 'orange', 'red'),
    point_deduction INTEGER,
    description TEXT,
    health_impacts TEXT[]
  );
  ```
- [ ] **Populate from Sources**:
  - Yuka's additive classifications
  - EWG Food Scores database
  - EU Food Additive Database
  - FDA GRAS list

### Task 1.3: Yuka-Style Scoring Algorithm Implementation
```javascript
// Scoring Engine Structure
class NutritionScorer {
  calculateScore(product) {
    // 1. Nutritional Quality (60% weight)
    const nutriScore = this.calculateNutriScore(product);
    // Adapted Nutri-Score: 0-100 scale
    
    // 2. Additives Impact (30% weight)
    const additivesScore = this.calculateAdditivesScore(product);
    // Green: 100, Yellow: 90, Orange: 80, Red: 60
    
    // 3. Organic Certification (10% weight)
    const organicScore = product.isOrganic ? 100 : 0;
    
    // Weighted final score
    return (nutriScore * 0.6) + (additivesScore * 0.3) + (organicScore * 0.1);
  }
}
```

### Task 1.4: Nutrition Data Quality Pipeline
- [ ] **Data Validation Rules**:
  - Required fields: calories, sugar, saturated fat, sodium
  - Consistency checks: calories vs macros
  - Outlier detection for suspicious values
- [ ] **Missing Data Strategy**:
  - Primary: Open Food Facts
  - Secondary: USDA Database
  - Tertiary: Walmart nutrition info
  - Fallback: Category averages

---

## Phase 2: Location-Based Store Discovery (Week 1-2)

### Task 2.1: Store Locator Service
- [ ] **Geolocation Implementation**
  ```javascript
  // Browser Geolocation API
  navigator.geolocation.getCurrentPosition()
  // Fallback: IP-based location
  ```
- [ ] **Walmart Store Finder Integration**
  - Reverse engineer store locator API
  - Extract store data:
    - Store ID
    - Address
    - Store type (Supercenter/Neighborhood)
    - Operating hours
    - Distance from user

### Task 2.2: Dynamic Store Inventory Scraping
- [ ] **Store-Specific URL Patterns**
  ```
  Base: walmart.com/store/{storeId}
  Search: /search?q={query}&store={storeId}
  Product: /ip/{productId}?store={storeId}
  ```
- [ ] **Real-Time Inventory Pipeline**:
  1. Detect user location
  2. Find nearest 3 Walmart stores
  3. Scrape inventory for user's search
  4. Cache results for 24 hours
  5. Return products with availability

### Task 2.3: Store Layout Mapping
- [ ] **Store-Specific Templates**:
  ```javascript
  const storeLayouts = {
    'supercenter': {
      entrance: 'front',
      produce: 'front-left',
      dairy: 'back-wall',
      frozen: 'right-side',
      checkout: 'front'
    },
    'neighborhood': {
      // Smaller format layout
    }
  };
  ```
- [ ] **Aisle Extraction Strategy**:
  - Scrape from product pages
  - Pattern recognition for consistency
  - Manual validation for top 100 products

---

## Phase 3: Product Search & Discovery (Week 2)

### Task 3.1: Search Engine Implementation
- [ ] **Multi-Level Search**:
  ```javascript
  async searchProducts(query, storeId, location) {
    // 1. Search Walmart inventory
    const walmartProducts = await scrapeWalmartSearch(query, storeId);
    
    // 2. Match to nutrition databases
    const enrichedProducts = await matchNutritionData(walmartProducts);
    
    // 3. Calculate scores
    const scoredProducts = await calculateScores(enrichedProducts);
    
    // 4. Sort by score and relevance
    return sortByScoreAndRelevance(scoredProducts);
  }
  ```

### Task 3.2: Product Matching Pipeline
- [ ] **UPC/Barcode Matching**:
  - Primary key for database joins
  - Fallback to name matching
- [ ] **Fuzzy Matching Algorithm**:
  - Handle typos and variations
  - Brand name normalization
  - Size/quantity extraction
- [ ] **Category Inference**:
  - Bread → Bakery → Multiple sub-types
  - Use Walmart's category taxonomy

### Task 3.3: Product Data Enrichment
- [ ] **Data Points to Collect**:
  ```javascript
  const productSchema = {
    // Walmart Data
    walmartId: String,
    name: String,
    brand: String,
    price: Number,
    imageUrl: String,
    aisle: String,
    inStock: Boolean,
    
    // Nutrition Data
    upc: String,
    calories: Number,
    sugar: Number,
    saturatedFat: Number,
    sodium: Number,
    fiber: Number,
    protein: Number,
    
    // Additives
    ingredients: String[],
    additives: [{
      code: String,
      name: String,
      riskLevel: String
    }],
    
    // Certifications
    isOrganic: Boolean,
    isNonGMO: Boolean,
    
    // Scoring
    nutritionScore: Number,
    additivesScore: Number,
    organicScore: Number,
    finalScore: Number,
    scoreCategory: String // excellent/good/poor/bad
  };
  ```

---

## Phase 4: Backend Services (Week 2-3)

### Task 4.1: Core API Endpoints
- [ ] **Location & Store APIs**:
  ```
  GET /api/stores/nearby
  Query: lat, lng, radius
  Returns: Nearest Walmart stores with details
  
  GET /api/stores/{storeId}/info
  Returns: Store details, hours, services
  ```

- [ ] **Product Search API**:
  ```
  GET /api/products/search
  Query: q (search term), storeId, limit, offset
  Returns: Products with nutrition scores
  
  Response:
  {
    products: [{
      walmart: { name, price, aisle, inStock },
      nutrition: { calories, sugar, ... },
      scoring: { 
        nutritionalQuality: 78,
        additivesImpact: 90,
        organicBonus: 0,
        finalScore: 76,
        category: "excellent",
        color: "green"
      }
    }],
    totalResults: 125,
    searchTime: 0.34
  }
  ```

- [ ] **Nutrition Details API**:
  ```
  GET /api/products/{upc}/nutrition
  Returns: Complete nutrition breakdown
  
  GET /api/products/{upc}/alternatives
  Returns: Similar products with better scores
  ```

### Task 4.2: Caching Strategy
- [ ] **Redis Cache Layers**:
  ```javascript
  // Cache Configuration
  const cacheConfig = {
    storeInventory: 24 * 60 * 60, // 24 hours
    nutritionScores: 7 * 24 * 60 * 60, // 1 week
    productSearch: 60 * 60, // 1 hour
    storeLocations: 30 * 24 * 60 * 60 // 30 days
  };
  ```

### Task 4.3: Background Jobs
- [ ] **Scheduled Tasks**:
  - Daily: Update store inventories
  - Weekly: Refresh nutrition database
  - Hourly: Clear expired cache
  - Real-time: Score calculation queue

---

## Phase 5: Frontend Implementation (Week 3-4)

### Task 5.1: Location-Aware Interface
- [ ] **Location Permission Flow**:
  ```javascript
  // Progressive enhancement
  1. Request location permission
  2. If denied: Manual zip code entry
  3. Show nearest stores
  4. Allow store selection/change
  ```

- [ ] **Store Selector Component**:
  - Map view with store pins
  - List view with distances
  - Store details (hours, services)
  - "Select This Store" action

### Task 5.2: Product Search Interface
- [ ] **Search Bar with Autocomplete**:
  - Debounced API calls
  - Category suggestions
  - Recent searches
  - Voice input option

- [ ] **Search Results Display**:
  ```javascript
  // Product Card Component
  <ProductCard>
    <ProductImage />
    <ProductName />
    <Brand />
    <Price />
    <ScoreBadge score={76} category="excellent" />
    <ScoreBreakdown>
      <NutritionalQuality: 78/100 />
      <Additives: No harmful additives />
      <Organic: Not organic />
    </ScoreBreakdown>
    <AisleLocation>Aisle 7</AisleLocation>
    <AddToListButton />
  </ProductCard>
  ```

### Task 5.3: Nutrition Score Visualization
- [ ] **Score Display Components**:
  ```javascript
  // Visual representation
  - Circular progress indicator (0-100)
  - Color coding (green/light-green/orange/red)
  - Expandable details panel
  - Comparison view for alternatives
  ```

- [ ] **Score Explanation Modal**:
  - Why this score?
  - Breakdown by category
  - Improvement suggestions
  - Link to full nutrition facts

### Task 5.4: Shopping List Management
- [ ] **List Builder Features**:
  - Add from search results
  - Manual entry with matching
  - Quantity adjustment
  - Category grouping
  - Multiple lists support

- [ ] **Smart Suggestions**:
  - "Users also bought"
  - "Healthier alternative available"
  - "On sale at your store"

---

## Phase 6: Route Optimization (Week 4-5)

### Task 6.1: Store Navigation Engine
- [ ] **Route Calculation**:
  ```javascript
  class RouteOptimizer {
    optimizeRoute(shoppingList, storeLayout) {
      // Group by department
      const departments = this.groupByDepartment(shoppingList);
      
      // Order departments efficiently
      const route = this.calculateOptimalPath(departments);
      
      // Consider special items
      this.adjustForTemperature(route); // Frozen last
      this.adjustForWeight(route); // Heavy items first
      
      return {
        stops: route,
        estimatedTime: this.calculateTime(route),
        totalDistance: this.calculateDistance(route)
      };
    }
  }
  ```

### Task 6.2: Visual Navigation
- [ ] **Store Map View**:
  - SVG-based store layout
  - Highlighted path
  - Current location indicator
  - Department labels

- [ ] **List View with Aisles**:
  - Ordered by optimal route
  - Aisle numbers prominent
  - Check-off functionality
  - Skip item option

---

## Data Collection Priorities

### Week 1: Foundation
1. **Set up Open Food Facts integration** - Critical for nutrition data
2. **Build additives database** - Required for scoring
3. **Create scoring algorithm** - Core differentiator
4. **Test with 50 common products** - Validate approach

### Week 2: Walmart Integration  
1. **Implement store locator** - User entry point
2. **Scrape product inventory** - Real-time data
3. **Extract aisle information** - Navigation feature
4. **Match products to nutrition** - Complete data

### Week 3: Search & Discovery
1. **Build search API** - User interaction
2. **Implement product matching** - Data accuracy
3. **Create scoring pipeline** - Real-time calculation
4. **Design alternatives system** - User value

---

## Critical Implementation Details

### Nutrition Data Matching Strategy
```javascript
async function matchProductToNutrition(walmartProduct) {
  // Priority 1: UPC/Barcode match
  if (walmartProduct.upc) {
    const offData = await openFoodFacts.getByBarcode(walmartProduct.upc);
    if (offData) return offData;
  }
  
  // Priority 2: Brand + Name match
  const searchQuery = `${walmartProduct.brand} ${walmartProduct.name}`;
  const matches = await openFoodFacts.search(searchQuery);
  if (matches.length > 0) {
    return findBestMatch(matches, walmartProduct);
  }
  
  // Priority 3: USDA Database
  const usdaMatch = await usdaDb.search(searchQuery);
  if (usdaMatch) return usdaMatch;
  
  // Priority 4: Category average (last resort)
  return getCategoryAverage(walmartProduct.category);
}
```

### Additives Extraction Pipeline
```javascript
function extractAdditives(ingredientsList) {
  const additives = [];
  const eNumberPattern = /E\d{3}[a-z]?/gi;
  
  // Parse ingredients
  const ingredients = ingredientsList.split(',').map(i => i.trim());
  
  for (const ingredient of ingredients) {
    // Check E-numbers
    const eNumbers = ingredient.match(eNumberPattern);
    if (eNumbers) {
      additives.push(...eNumbers);
    }
    
    // Check common additive names
    const additive = additiveDatabase.findByName(ingredient);
    if (additive) {
      additives.push(additive);
    }
  }
  
  return additives.map(a => ({
    code: a.code,
    name: a.name,
    riskLevel: a.riskLevel,
    pointDeduction: a.pointDeduction
  }));
}
```

### Store-Specific Scraping
```python
class WalmartStoreScraper:
    def __init__(self, store_id):
        self.store_id = store_id
        self.session = self.create_session()
        
    def search_products(self, query):
        """Search products at specific store"""
        url = f"https://www.walmart.com/search"
        params = {
            'q': query,
            'store': self.store_id,
            'affinityOverride': 'store_led'  # Force store-specific results
        }
        
        response = self.session.get(url, params=params)
        products = self.parse_search_results(response)
        
        # Extract store-specific data
        for product in products:
            product['aisle'] = self.extract_aisle(product)
            product['in_stock'] = self.check_availability(product)
            
        return products
```

---

## Testing Strategy

### Unit Testing Priorities
1. **Nutrition Scoring Algorithm** - Must be 100% accurate
2. **Additives Classification** - Safety critical
3. **Product Matching Logic** - Data quality
4. **Route Optimization** - User experience

### Integration Testing
1. **Location → Store → Products** flow
2. **Search → Score → Display** pipeline
3. **List → Route → Navigation** sequence

### User Acceptance Testing
- **Test Scenario 1**: Search for "bread"
  - See 10+ options with scores
  - Understand why whole grain scores higher
  - Add preferred option to list
  
- **Test Scenario 2**: Build weekly shopping list
  - 20 items across departments
  - See optimized route
  - Complete shop 25% faster

---

## MVP Success Metrics

### Technical Metrics
- **Nutrition Data Coverage**: 95% of searched products
- **Scoring Accuracy**: Matches Yuka within 10 points
- **Location Accuracy**: Correct store 99% of time
- **Search Speed**: <2 seconds for results

### User Metrics
- **Search Success Rate**: 90% find desired product
- **Score Understanding**: 80% understand scoring
- **Route Efficiency**: 20% time reduction
- **Return Usage**: 60% use app twice

### Data Quality Metrics
- **Additive Detection**: 99% accuracy
- **Organic Identification**: 95% accuracy
- **Aisle Accuracy**: 90% correct locations
- **Inventory Accuracy**: 85% in-stock reliability

---

## Deployment Strategy

### Local Development
```bash
# Environment setup
npm install
docker-compose up -d  # PostgreSQL, Redis
npm run seed-nutrition  # Load Open Food Facts data
npm run seed-additives  # Load additives database
npm run dev  # Start development server
```

### Staging Environment
- Deploy to Heroku/Railway for testing
- Use production Walmart store (not test data)
- Limited to 3 stores initially
- Beta user access only

### Production MVP
- AWS/GCP deployment
- CloudFlare CDN
- Rate limiting on scraping
- Error monitoring (Sentry)
- Analytics (Mixpanel)

---

## Execution Plan

### 1: Nutrition Foundation
- Mon: Open Food Facts integration
- Tue: Additives database setup
- Wed: Yuka scoring algorithm
- Thu: Testing with real products
- Fri: API endpoint creation

### 2: Location & Search
- Mon: Location services setup
- Tue: Store finder implementation
- Wed: Walmart scraping pipeline
- Thu: Product search API
- Fri: Integration testing

### 3: Frontend Core
- Mon: Location permission flow
- Tue: Store selector UI
- Wed: Product search interface
- Thu: Nutrition score display
- Fri: Shopping list builder

### 4: Route Optimization
- Mon: Store layout mapping
- Tue: Route algorithm development
- Wed: Navigation UI
- Thu: Testing in real store
- Fri: Performance optimization

### 5: Polish & Testing
- Mon-Tue: End-to-end testing
- Wed: User acceptance testing
- Thu: Bug fixes
- Fri: Demo preparation

### 6: Launch
- Mon: Final testing
- Tue: Deploy to production
- Wed: Beta user onboarding
- Thu: Monitor and fix issues
- Fri: Collect feedback and iterate
