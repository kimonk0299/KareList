import React from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin } from 'lucide-react';

const StoresPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Store size={64} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Stores</h1>
          <p className="text-gray-600 mb-6">Store locator functionality coming soon...</p>
          
          <div className="bg-white rounded-xl p-6 shadow-soft max-w-md mx-auto">
            <MapPin size={32} className="text-primary-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Location-based store discovery</h3>
            <p className="text-sm text-gray-600">Find nearby Walmart, Target, Costco, and other supported stores</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StoresPage;