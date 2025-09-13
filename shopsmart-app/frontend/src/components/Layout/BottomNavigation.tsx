import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Store,
  ShoppingCart,
  User
} from 'lucide-react';

import { useShoppingListStore } from '../../stores/shoppingListStore';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const lists = useShoppingListStore((state) => state.lists);
  
  // Calculate total active shopping lists
  const activeLists = lists.filter(list => list.status === 'active').length;

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      exact: true
    },
    {
      path: '/search',
      icon: Search,
      label: 'Search'
    },
    {
      path: '/stores',
      icon: Store,
      label: 'Stores'
    },
    {
      path: '/lists',
      icon: ShoppingCart,
      label: 'Lists',
      badge: activeLists > 0 ? activeLists : undefined
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`bottom-nav safe-area-bottom ${className}`}>
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-2 px-3 min-w-0 flex-1"
            >
              {({ isActive: navLinkActive }) => (
                <>
                  {/* Active indicator */}
                  {(active || navLinkActive) && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Icon container */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: active || navLinkActive ? 1.1 : 1,
                        color: active || navLinkActive ? '#16a34a' : '#6b7280'
                      }}
                      transition={{ type: "spring", bounce: 0.3, duration: 0.3 }}
                      className="mb-1"
                    >
                      <item.icon size={20} />
                    </motion.div>

                    {/* Badge for notifications/counters */}
                    {item.badge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </motion.div>
                    )}
                  </div>

                  {/* Label */}
                  <motion.span
                    animate={{
                      color: active || navLinkActive ? '#16a34a' : '#6b7280',
                      fontWeight: active || navLinkActive ? 600 : 400
                    }}
                    className="text-xs leading-tight text-center"
                  >
                    {item.label}
                  </motion.span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Floating indicator alternative (uncomment to use) */}
      {/* 
      <motion.div
        className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500 to-primary-600"
        initial={false}
        animate={{
          x: `${navItems.findIndex(item => isActive(item.path, item.exact)) * 20}%`
        }}
        style={{ width: `${100 / navItems.length}%` }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
      */}
    </nav>
  );
};

export default BottomNavigation;