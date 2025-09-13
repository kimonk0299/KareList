import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus } from 'lucide-react';

const ShoppingListsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Lists</h1>
            <button className="btn-primary flex items-center space-x-2">
              <Plus size={20} />
              <span>New List</span>
            </button>
          </div>

          <div className="text-center py-20">
            <ShoppingCart size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 mb-2">Shopping Lists</h3>
            <p className="text-gray-400">List management functionality coming soon...</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShoppingListsPage;