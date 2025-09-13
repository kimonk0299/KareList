import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Store and hooks
import { useAuthStore } from './stores/authStore';
import { useLocationStore } from './stores/locationStore';

// Layout components
import Layout from './components/Layout/Layout';
import LoadingScreen from './components/UI/LoadingScreen';

// Page components (lazy loaded for better performance)
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const ProductDetailsPage = React.lazy(() => import('./pages/ProductDetailsPage'));
const StoresPage = React.lazy(() => import('./pages/StoresPage'));
const ShoppingListsPage = React.lazy(() => import('./pages/ShoppingListsPage'));
const ShoppingListDetailsPage = React.lazy(() => import('./pages/ShoppingListDetailsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const NutritionAnalysisPage = React.lazy(() => import('./pages/NutritionAnalysisPage'));

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route component (redirect to home if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const requestLocation = useLocationStore((state) => state.requestLocation);

  useEffect(() => {
    // Initialize authentication state from localStorage
    initializeAuth();
    
    // Request user location for store discovery
    requestLocation();
  }, [initializeAuth, requestLocation]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="product/:productId" element={<ProductDetailsPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="lists" element={<ShoppingListsPage />} />
            <Route path="lists/:listId" element={<ShoppingListDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="nutrition" element={<NutritionAnalysisPage />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </motion.div>
  );
};

export default App;