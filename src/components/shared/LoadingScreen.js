// src/components/shared/LoadingScreen.js
import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5D1F1F] to-[#8B3A3A] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          {/* Tennis ball spinner */}
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping"></div>
            <div className="relative w-16 h-16 border-4 border-green-600 rounded-full flex items-center justify-center bg-green-500">
              <div className="w-12 h-[2px] bg-white transform rotate-45"></div>
              <div className="w-12 h-[2px] bg-white transform -rotate-45 absolute"></div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Cawood Tennis Club
          </h2>
          
          <p className="text-gray-600 text-center">
            {message}
          </p>
          
          {/* Loading dots */}
          <div className="flex space-x-1 mt-4">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;