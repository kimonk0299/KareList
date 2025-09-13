# ShopSmart - AI-Powered Grocery Shopping Super App

ShopSmart is a comprehensive grocery shopping application that combines nutrition scoring, store discovery, and route optimization to make grocery shopping smarter, healthier, and more efficient.

## 🚀 Features

### Core Features (MVP)
- **Nutrition Scoring**: Yuka-style health scoring (60% nutrition quality + 30% additives + 10% organic)
- **Store Discovery**: Find nearby Walmart, Target, Costco stores based on location
- **Product Search**: Search products with nutrition insights and store availability
- **Shopping Lists**: Create and manage smart shopping lists
- **Route Optimization**: Optimal in-store navigation paths

### Advanced Features (Future)
- Multi-store price comparison
- AR in-store navigation
- Family sharing and collaborative lists
- Health goal tracking
- Meal planning integration
- Social features and community reviews

## 🏗️ Architecture

### Frontend (React PWA)
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Animations**: Framer Motion
- **Maps**: React Leaflet
- **PWA**: Vite PWA plugin

### Backend (Node.js API)
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: JWT
- **Rate Limiting**: Redis-based
- **Data Sources**: Open Food Facts, USDA FoodData Central

### Infrastructure
- **Database**: PostgreSQL (products, stores, users, nutrition)
- **Cache**: Redis (API responses, sessions)
- **Container**: Docker Compose for development

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopsmart-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the database**
   ```bash
   npm run db:setup
   ```

5. **Run database migrations and seeds**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts both backend (port 3001) and frontend (port 3000) concurrently.

### API Endpoints

The backend provides the following API endpoints:

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update preferences

#### Stores
- `GET /api/stores/nearby` - Find nearby stores
- `GET /api/stores/:storeId` - Get store details
- `GET /api/stores/chains` - Get supported store chains

#### Products
- `GET /api/products/search` - Search products with nutrition scoring
- `GET /api/products/:productId` - Get product details
- `GET /api/products/:productId/alternatives` - Get healthier alternatives

#### Shopping Lists
- `GET /api/shopping-lists` - Get user's shopping lists
- `POST /api/shopping-lists` - Create new shopping list
- `GET /api/shopping-lists/:listId` - Get list details
- `POST /api/shopping-lists/:listId/items` - Add items to list
- `POST /api/shopping-lists/:listId/assign-stores` - Assign items to optimal stores

#### Nutrition
- `GET /api/nutrition/barcode/:upc` - Get nutrition by barcode
- `GET /api/nutrition/search` - Search nutrition data
- `POST /api/nutrition/score` - Calculate nutrition score
- `GET /api/nutrition/additives` - Get additives information

### Database Schema

Key database tables:
- **users** - User accounts and authentication
- **user_preferences** - Dietary restrictions, allergies, preferences  
- **stores** - Store locations and details
- **products** - Product catalog
- **nutrition_data** - Nutrition information and scores
- **additives** - Food additives with risk classifications
- **shopping_lists** - User shopping lists
- **shopping_list_items** - Items in shopping lists
- **store_routes** - Optimized in-store routes

## 📊 Nutrition Scoring Algorithm

The app uses a Yuka-inspired scoring system:

### Score Calculation (0-100 scale)
- **60% Nutritional Quality**: Based on Nutri-Score algorithm
  - Negative points: calories, saturated fat, sugar, sodium
  - Positive points: fiber, protein, fruits/vegetables
- **30% Additives Impact**: Penalizes harmful additives
  - Green (0 points): Natural/safe additives
  - Yellow (5 points): Limited concern
  - Orange (10 points): Moderate risk
  - Red (20 points): Avoid when possible
- **10% Organic Bonus**: Rewards organic certification

### Score Categories
- **Excellent (80-100)**: Green - Highly recommended
- **Good (60-79)**: Light green - Good choice
- **Fair (40-59)**: Orange - Acceptable occasionally  
- **Poor (0-39)**: Red - Not recommended

## 🗺️ Store Navigation

### Route Optimization Algorithm
1. **Department Ordering**: Heavy/bulky items first, frozen last
2. **Aisle Efficiency**: Minimize backtracking
3. **Temperature Zones**: Maintain cold chain
4. **Walking Distance**: Optimize path length
5. **Traffic Patterns**: Avoid congested areas

### Store Layout Support
- **Walmart Supercenters**: Full layout mapping
- **Target Stores**: Basic department routing
- **Costco Warehouses**: Bulk shopping optimization
- **Local Stores**: Generic layout templates

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/shopsmart
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
USDA_API_KEY=your_usda_api_key
PORT=3001
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME="ShopSmart"
VITE_ENABLE_PWA=true
```

## 📱 PWA Features

The frontend is a Progressive Web App with:
- **Offline Support**: Core functionality works without internet
- **Background Sync**: Sync data when connection restored
- **Push Notifications**: Shopping reminders and deals
- **App Install**: Add to home screen on mobile
- **Fast Loading**: Service worker caching

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests
npm run test:backend

# Frontend tests  
npm run test:frontend
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📈 Roadmap

### Phase 1 (MVP - Current)
- ✅ Nutrition scoring system
- ✅ Store discovery
- ✅ Basic product search
- ✅ Shopping list management
- ✅ User authentication

### Phase 2 (Q2 2024)
- [ ] Real-time store inventory
- [ ] Advanced route optimization
- [ ] Barcode scanning
- [ ] Price comparison
- [ ] Mobile app optimization

### Phase 3 (Q3 2024)
- [ ] AR in-store navigation
- [ ] Social features
- [ ] Meal planning integration
- [ ] Health goal tracking
- [ ] Family sharing

### Phase 4 (Q4 2024)
- [ ] Voice shopping assistant
- [ ] Smart recommendations
- [ ] Loyalty program integration
- [ ] Advanced analytics
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Open Food Facts**: Community-driven food database
- **USDA FoodData Central**: Comprehensive nutrition database
- **Yuka**: Inspiration for nutrition scoring methodology
- **React Community**: Amazing ecosystem and tools

## 🆘 Support

For support, email support@shopsmart.app or join our Discord community.

---

**ShopSmart** - Making every shopping trip healthier, faster, and smarter! 🛒✨