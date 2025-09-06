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
          {/* Tennis racket */}
          <div className="relative w-16 h-16 mb-4">
            {/* Modern Tennis racket SVG */}
            <svg 
              className="w-16 h-16 text-[#5D1F1F] animate-pulse" 
              viewBox="0 0 100 100" 
              fill="currentColor"
            >
              {/* Racket head (modern oval with gradient effect) */}
              <ellipse cx="50" cy="35" rx="20" ry="27" fill="none" stroke="currentColor" strokeWidth="4"/>
              <ellipse cx="50" cy="35" rx="16" ry="23" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
              
              {/* Simplified string pattern - just a subtle crosshatch */}
              <path d="M 35 20 Q 50 25 65 20 Q 50 35 35 45 Q 50 45 65 50 Q 50 45 35 20" 
                    fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
              
              {/* Modern handle */}
              <rect x="46" y="58" width="8" height="32" rx="4" fill="currentColor"/>
              
              {/* Subtle handle detail */}
              <rect x="48" y="62" width="4" height="24" rx="2" fill="white" opacity="0.3"/>
            </svg>
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