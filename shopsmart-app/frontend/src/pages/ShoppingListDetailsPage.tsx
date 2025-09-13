import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

const ShoppingListDetailsPage: React.FC = () => {
  const { listId } = useParams();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping List Details</h1>
          <p className="text-gray-600">List ID: {listId}</p>
          <p className="text-gray-400 mt-4">Detailed list view coming soon...</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ShoppingListDetailsPage;