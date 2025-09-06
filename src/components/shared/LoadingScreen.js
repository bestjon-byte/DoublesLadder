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
          {/* Smooth bouncing tennis ball with C */}
          <div className="relative w-20 h-24 mb-4 flex items-end justify-center">
            {/* Shadow that grows/shrinks with bounce */}
            <div className="absolute bottom-0 w-12 h-3 bg-black bg-opacity-20 rounded-full animate-pulse"></div>
            
            {/* Bouncing tennis ball with C */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#9ACD32] to-[#7CB342] rounded-full shadow-2xl animate-bounce" style={{
              animation: 'bounce 1s infinite ease-in-out',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
            }}>
              {/* Tennis ball curves */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
                <path d="M 8 32 Q 32 20 56 32" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9"/>
                <path d="M 8 32 Q 32 44 56 32" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9"/>
              </svg>
              
              {/* Large C in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-2xl drop-shadow-lg" style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>C</span>
              </div>
              
              {/* Subtle highlight for 3D effect */}
              <div className="absolute top-2 left-2 w-4 h-4 bg-white bg-opacity-30 rounded-full blur-sm"></div>
              
              {/* Inner glow */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
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