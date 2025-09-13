import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {showLogo && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Logo placeholder - replace with actual logo */}
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">S</span>
          </div>
        </motion.div>
      )}

      {/* Animated Loading Spinner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center space-y-4"
      >
        {/* Main spinner */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full"
          />
          
          {/* Inner spinner */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 w-6 h-6 border-2 border-primary-100 border-b-primary-400 rounded-full"
          />
        </div>

        {/* Loading message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 font-medium text-sm"
        >
          {message}
        </motion.p>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex space-x-1"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              className="w-1.5 h-1.5 bg-primary-400 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Optional bottom hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-center px-6"
      >
        <p className="text-xs text-gray-400 max-w-xs">
          Getting everything ready for your smart shopping experience
        </p>
      </motion.div>
    </div>
  );
};

// Inline loading spinner component
export const InlineSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} border-gray-200 border-t-primary-600 rounded-full ${className}`}
    />
  );
};

// Loading skeleton for content
export const LoadingSkeleton: React.FC<{ className?: string; variant?: 'text' | 'card' | 'image' }> = ({ 
  className = '', 
  variant = 'text' 
}) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  const variantClasses = {
    text: "h-4 w-full",
    card: "h-24 w-full",
    image: "h-48 w-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

// Loading overlay
export const LoadingOverlay: React.FC<{ isVisible: boolean; message?: string }> = ({ 
  isVisible, 
  message = 'Processing...' 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 shadow-xl max-w-xs w-full mx-4"
      >
        <div className="flex flex-col items-center space-y-4">
          <InlineSpinner size="lg" />
          <p className="text-gray-700 font-medium text-center">{message}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;