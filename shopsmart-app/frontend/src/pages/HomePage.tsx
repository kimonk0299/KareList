import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Store,
  ShoppingCart,
  Activity,
  TrendingUp,
  MapPin,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Award
} from 'lucide-react';

import { useAuthStore } from '../stores/authStore';
import { useLocationStore } from '../stores/locationStore';
import { useShoppingListStore } from '../stores/shoppingListStore';
import { LoadingSkeleton, InlineSpinner } from '../components/UI/LoadingScreen';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { currentLocation, nearbyStores, isLocationLoading, requestLocation } = useLocationStore();
  const { lists, fetchLists, isLoading: listsLoading } = useShoppingListStore();

  useEffect(() => {
    // Fetch user's shopping lists on component mount
    fetchLists();
  }, [fetchLists]);

  const activeLists = lists.filter(list => list.status === 'active');
  const totalItems = lists.reduce((sum, list) => sum + (list.itemCount || 0), 0);

  const quickActions = [
    {
      icon: Search,
      label: 'Search Products',
      description: 'Find and compare groceries',
      path: '/search',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Store,
      label: 'Find Stores',
      description: 'Locate nearby stores',
      path: '/stores',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Plus,
      label: 'New List',
      description: 'Create shopping list',
      onClick: () => navigate('/lists?new=true'),
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Activity,
      label: 'Nutrition Analysis',
      description: 'Health score insights',
      path: '/nutrition',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const stats = [
    {
      icon: ShoppingCart,
      label: 'Active Lists',
      value: activeLists.length,
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: Store,
      label: 'Nearby Stores',
      value: nearbyStores.length,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Users,
      label: 'Total Items',
      value: totalItems,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: Award,
      label: 'Health Score',
      value: 'A+',
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'there'}! 👋
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Let's make your grocery shopping smarter and healthier
              </p>
            </div>
            
            {/* Location indicator */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
              {isLocationLoading ? (
                <InlineSpinner size="sm" />
              ) : currentLocation ? (
                <>
                  <MapPin size={16} className="text-green-500" />
                  <span>Location detected</span>
                </>
              ) : (
                <button
                  onClick={requestLocation}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <MapPin size={16} />
                  <span>Enable location</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-soft border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick || (() => navigate(action.path!))}
                className="group bg-white rounded-xl p-6 shadow-soft border border-gray-200 hover:shadow-soft-lg transition-all duration-200 text-left"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.label}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all mt-2" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Shopping Lists */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-soft border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Lists</h3>
              <button
                onClick={() => navigate('/lists')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {listsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" className="h-16" />
                ))
              ) : lists.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No shopping lists yet</p>
                  <button
                    onClick={() => navigate('/lists?new=true')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Create your first list
                  </button>
                </div>
              ) : (
                lists.slice(0, 3).map((list) => (
                  <div
                    key={list.id}
                    onClick={() => navigate(`/lists/${list.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart size={16} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{list.name}</p>
                        <p className="text-sm text-gray-500">
                          {list.itemCount || 0} items • {list.status}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Nearby Stores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-soft border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nearby Stores</h3>
              <button
                onClick={() => navigate('/stores')}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {!currentLocation ? (
                <div className="text-center py-8">
                  <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">Enable location to see nearby stores</p>
                  <button
                    onClick={requestLocation}
                    className="btn-primary"
                  >
                    Enable Location
                  </button>
                </div>
              ) : nearbyStores.length === 0 ? (
                <div className="text-center py-8">
                  <Store size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No nearby stores found</p>
                </div>
              ) : (
                nearbyStores.slice(0, 3).map((store) => (
                  <div
                    key={store.id}
                    onClick={() => navigate(`/stores/${store.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Store size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-sm text-gray-500">
                          {store.distance ? `${store.distance.toFixed(1)} miles` : 'Distance unknown'} • {store.chain}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Tips and Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Sparkles size={32} className="text-primary-100" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Smart Shopping Tips</h3>
              <p className="text-primary-100 mb-4">
                Did you know? Products with scores above 80 are considered excellent for your health. 
                Look for our green scores when shopping!
              </p>
              <button
                onClick={() => navigate('/nutrition')}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;