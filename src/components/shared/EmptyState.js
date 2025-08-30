// ============================================
// src/components/shared/EmptyState.js
import React from 'react';

export const EmptyState = ({ 
  icon: Icon,
  title, 
  message, 
  action,
  actionLabel = 'Get Started'
}) => {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {message}
      </p>
      {action && (
        <button
          onClick={action}
          className="bg-[#5D1F1F] text-white px-6 py-2 rounded-md hover:bg-[#4A1818] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};