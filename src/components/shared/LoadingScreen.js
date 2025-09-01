// src/components/shared/LoadingScreen.js
import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  const [showOverride, setShowOverride] = useState(false);
  
  // Show manual override after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverride(true);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5D1F1F] to-[#8B3A3A] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center">
          {/* Tennis racket */}
          <div className="relative w-16 h-16 mb-4">
            {/* Tennis racket SVG */}
            <svg 
              className="w-16 h-16 text-[#5D1F1F] animate-pulse" 
              viewBox="0 0 100 100" 
              fill="currentColor"
            >
              {/* Racket head (oval) */}
              <ellipse cx="50" cy="35" rx="18" ry="25" fill="none" stroke="currentColor" strokeWidth="3"/>
              {/* String pattern */}
              <line x1="35" y1="20" x2="35" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              <line x1="42" y1="15" x2="42" y2="55" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              <line x1="50" y1="10" x2="50" y2="60" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              <line x1="58" y1="15" x2="58" y2="55" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              <line x1="65" y1="20" x2="65" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              {/* Horizontal strings */}
              <line x1="32" y1="25" x2="68" y2="25" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              <line x1="32" y1="45" x2="68" y2="45" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
              {/* Handle */}
              <rect x="47" y="55" width="6" height="35" rx="3" fill="currentColor"/>
              {/* Handle grip lines */}
              <line x1="45" y1="65" x2="55" y2="65" stroke="white" strokeWidth="1"/>
              <line x1="45" y1="72" x2="55" y2="72" stroke="white" strokeWidth="1"/>
              <line x1="45" y1="79" x2="55" y2="79" stroke="white" strokeWidth="1"/>
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