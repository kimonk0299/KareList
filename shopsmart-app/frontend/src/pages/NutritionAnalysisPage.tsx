import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3 } from 'lucide-react';

const NutritionAnalysisPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Activity size={64} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nutrition Analysis</h1>
          <p className="text-gray-400">Nutrition insights and health scoring coming soon...</p>
          
          <div className="bg-white rounded-xl p-6 shadow-soft max-w-md mx-auto mt-8">
            <BarChart3 size={32} className="text-primary-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Health Insights</h3>
            <p className="text-sm text-gray-600">Yuka-style nutrition scoring and ingredient analysis</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NutritionAnalysisPage;