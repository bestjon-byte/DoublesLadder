// ============================================
// src/components/shared/LoadingSpinner.js
import React from 'react';

export const LoadingSpinner = ({ size = 'md', color = 'green' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    green: 'border-green-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}></div>
  );
};
