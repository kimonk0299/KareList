import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Store, 
  ShoppingCart, 
  User,
  Menu,
  X 
} from 'lucide-react';

import Header from './Header';
import BottomNavigation from './BottomNavigation';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const currentLocation = useLocationStore((state) => state.currentLocation);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -20,
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        onMenuClick={() => setSidebarOpen(true)}
        user={user}
        location={currentLocation}
      />

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Page Content with Transitions */}
        <div className="flex-1 pb-16 lg:pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation className="lg:hidden" />

      {/* Quick Actions FAB (Floating Action Button) */}
      <QuickActionsFAB />
    </div>
  );
};

// Quick Actions Floating Action Button
const QuickActionsFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const actions = [
    {
      icon: Search,
      label: 'Search',
      href: '/search',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: ShoppingCart,
      label: 'Add to List',
      onClick: () => {
        // Quick add to shopping list functionality
        console.log('Quick add to list');
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Store,
      label: 'Find Stores',
      href: '/stores',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-30">
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ opacity: 0, x: 50 }}
                onClick={action.onClick}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg text-white font-medium text-sm transition-all duration-200 ${action.color}`}
              >
                <action.icon size={16} />
                <span>{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-primary-600 hover:bg-primary-700'
        } text-white`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default Layout;