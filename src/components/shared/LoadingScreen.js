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
          {/* Animated Club Logo */}
          <div className="relative w-24 h-28 mb-4 flex items-end justify-center">
            {/* Dynamic shadow that responds to animation */}
            <div className="absolute bottom-0 w-16 h-4 bg-black bg-opacity-20 rounded-full animate-pulse" style={{
              animation: 'pulse 1s infinite ease-in-out'
            }}></div>
            
            {/* Bouncing Club Logo */}
            <div className="relative animate-bounce" style={{
              animation: 'bounce 1.2s infinite ease-in-out',
              filter: 'drop-shadow(0 10px 20px rgba(93, 31, 31, 0.3))'
            }}>
              <img 
                src="/club-logo.png" 
                alt="Cawood Tennis Club" 
                className="w-20 h-20 object-contain"
                style={{
                  animation: 'subtle-rotate 3s infinite linear',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  background: 'transparent'
                }}
                onLoad={(e) => {
                  // Apply white-to-transparent filter using canvas
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = e.target.naturalWidth;
                  canvas.height = e.target.naturalHeight;
                  
                  ctx.drawImage(e.target, 0, 0);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  
                  // Make white pixels transparent
                  for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // If pixel is white or very light, make it transparent
                    if (r > 240 && g > 240 && b > 240) {
                      data[i + 3] = 0; // Set alpha to 0
                    }
                  }
                  
                  ctx.putImageData(imageData, 0, 0);
                  e.target.src = canvas.toDataURL();
                }}
                onError={(e) => {
                  // Fallback to tennis ball if logo fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              
              {/* Fallback tennis ball (hidden by default) */}
              <div className="logo-fallback w-20 h-20 bg-gradient-to-br from-[#9ACD32] to-[#7CB342] rounded-full flex items-center justify-center" style={{display: 'none'}}>
                <span className="text-white font-bold text-3xl drop-shadow-lg">C</span>
              </div>
              
              {/* Subtle glow effect around logo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-sm opacity-50"></div>
            </div>
          </div>

          {/* Add custom keyframes for subtle rotation */}
          <style jsx>{`
            @keyframes subtle-rotate {
              0% { transform: rotate(0deg) scale(1); }
              25% { transform: rotate(2deg) scale(1.05); }
              50% { transform: rotate(0deg) scale(1); }
              75% { transform: rotate(-2deg) scale(1.05); }
              100% { transform: rotate(0deg) scale(1); }
            }
          `}</style>
          
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