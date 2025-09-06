// src/components/shared/LoadingScreen.js
import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const [showOverride, setShowOverride] = useState(false);
  
  // Show manual override after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverride(true);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5D1F1F] to-[#8B3A3A] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          {/* Modern loading animation */}
          <div className="relative w-16 h-16 mb-4">
            {/* Animated tennis ball */}
            <div className="relative w-16 h-16 bg-[#9ACD32] rounded-full shadow-lg animate-bounce">
              {/* Tennis ball curve */}
              <div className="absolute inset-0 rounded-full border-2 border-white opacity-80">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-px"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-px rotate-180"></div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
                  <path d="M 4 32 Q 32 16 60 32" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M 4 32 Q 32 48 60 32" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              {/* Subtle highlight */}
              <div className="absolute top-3 left-3 w-3 h-3 bg-white bg-opacity-40 rounded-full"></div>
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
          
          {/* Manual override button after timeout */}
          {showOverride && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-3">Taking longer than expected?</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#5D1F1F] text-white px-4 py-2 rounded text-sm hover:bg-[#4A1818] transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;