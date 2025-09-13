import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  MapPin,
  Bell,
  User as UserIcon,
  ChevronDown,
  ShoppingCart,
  Settings,
  LogOut,
  Home
} from 'lucide-react';

import { User, Location } from '@/shared/types';
import { useAuthStore } from '../../stores/authStore';
import { InlineSpinner } from '../UI/LoadingScreen';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
  location: Location | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, user, location: userLocation }) => {
  const navigate = useNavigate();
  const currentPath = useLocation();
  const logout = useAuthStore((state) => state.logout);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      searchInputRef.current?.blur();
    }
  };

  // Handle quick navigation
  const handleQuickNav = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = currentPath.pathname;
    switch (path) {
      case '/': return 'Home';
      case '/search': return 'Search Products';
      case '/stores': return 'Find Stores';
      case '/lists': return 'Shopping Lists';
      case '/profile': return 'Profile';
      case '/nutrition': return 'Nutrition Analysis';
      default:
        if (path.startsWith('/product/')) return 'Product Details';
        if (path.startsWith('/lists/')) return 'Shopping List';
        return 'ShopSmart';
    }
  };

  const formatLocation = (loc: Location | null) => {
    if (!loc) return 'Location not set';
    return `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>

            {/* Logo and page title */}
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={() => navigate('/')}
              >
                <span className="text-white font-bold text-sm">S</span>
              </motion.div>
              
              <div className="hidden sm:block">
                <h1 className="font-semibold text-gray-900">{getPageTitle()}</h1>
                {userLocation && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>{formatLocation(userLocation)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearch} className="relative">
              <motion.div
                animate={{
                  boxShadow: searchFocused 
                    ? '0 0 0 2px rgba(34, 197, 94, 0.2)' 
                    : '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                className="relative"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, brands, or ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                
                {/* Search button for mobile */}
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center sm:hidden"
                >
                  <Search size={16} className="text-primary-600" />
                </button>
              </motion.div>

              {/* Quick search suggestions */}
              <AnimatePresence>
                {searchFocused && searchQuery.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <div className="px-3 py-1 text-xs text-gray-500 font-medium">
                      Quick suggestions
                    </div>
                    {['organic milk', 'gluten free bread', 'greek yogurt'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          handleSearch({ preventDefault: () => {} } as React.FormEvent);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700"
                      >
                        <Search size={14} className="inline mr-2 text-gray-400" />
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </span>
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                  {user ? user.firstName.charAt(0) : <UserIcon size={16} />}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.preferences?.preferredStores?.length || 0} preferred stores
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {/* User dropdown menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                          {user ? user.firstName.charAt(0) : <UserIcon size={20} />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user ? `${user.firstName} ${user.lastName}` : 'User'}
                          </div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => handleQuickNav('/')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Home size={16} />
                        <span>Home</span>
                      </button>
                      
                      <button
                        onClick={() => handleQuickNav('/lists')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ShoppingCart size={16} />
                        <span>My Shopping Lists</span>
                      </button>
                      
                      <button
                        onClick={() => handleQuickNav('/profile')}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings size={16} />
                        <span>Profile & Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;