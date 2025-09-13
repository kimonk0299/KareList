import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Home,
  Search,
  Store,
  ShoppingCart,
  User,
  Activity,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';

import { User as UserType } from '@/shared/types';
import { useAuthStore } from '../../stores/authStore';
import { useShoppingListStore } from '../../stores/shoppingListStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const logout = useAuthStore((state) => state.logout);
  const lists = useShoppingListStore((state) => state.lists);

  const activeLists = lists.filter(list => list.status === 'active').length;
  const totalItems = lists.reduce((sum, list) => sum + (list.itemCount || 0), 0);

  const mainNavItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      description: 'Dashboard and overview'
    },
    {
      path: '/search',
      icon: Search,
      label: 'Search Products',
      description: 'Find and compare products'
    },
    {
      path: '/stores',
      icon: Store,
      label: 'Find Stores',
      description: 'Locate nearby stores'
    },
    {
      path: '/lists',
      icon: ShoppingCart,
      label: 'Shopping Lists',
      description: `${activeLists} active lists, ${totalItems} items`,
      badge: activeLists
    },
    {
      path: '/nutrition',
      icon: Activity,
      label: 'Nutrition Analysis',
      description: 'Health scores and insights'
    }
  ];

  const secondaryNavItems = [
    {
      path: '/profile',
      icon: User,
      label: 'Profile & Settings',
      description: 'Account and preferences'
    },
    {
      path: '/insights',
      icon: TrendingUp,
      label: 'Shopping Insights',
      description: 'Trends and analytics'
    },
    {
      path: '/help',
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get assistance'
    }
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  const sidebarVariants = {
    closed: {
      x: '-100%',
      transition: {
        type: 'tween',
        duration: 0.3
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'tween',
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial="closed"
          animate="open"
          exit="closed"
          variants={sidebarVariants}
          className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:relative lg:z-auto lg:shadow-none lg:border-r lg:border-gray-200"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">ShopSmart</h2>
                  <p className="text-xs text-gray-500">Smart Grocery Shopping</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* User section */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                  {user ? user.firstName.charAt(0) : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{activeLists}</div>
                  <div className="text-xs text-gray-500">Active Lists</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {user?.preferences?.preferredStores?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Preferred Stores</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 py-4 overflow-y-auto">
              {/* Main navigation */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Main
                </h3>
                {mainNavItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    custom={index}
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                  >
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={20}
                            className={`mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                              {item.label}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {item.description}
                            </div>
                          </div>
                          {item.badge && (
                            <span className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight
                            size={16}
                            className={`ml-2 transition-colors ${
                              isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              {/* Secondary navigation */}
              <div className="space-y-2 mt-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Account
                </h3>
                {secondaryNavItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    custom={index + mainNavItems.length}
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                  >
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            size={20}
                            className={`mr-3 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                              {item.label}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {item.description}
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className={`ml-2 transition-colors ${
                              isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                            }`}
                          />
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              >
                <LogOut size={20} className="mr-3" />
                <span className="font-medium">Sign Out</span>
                <ChevronRight size={16} className="ml-auto text-red-400 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;