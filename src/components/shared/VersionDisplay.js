// Version Display Component - Shows current app version
import React, { useState, useEffect } from 'react';
import { versionManager, APP_VERSION } from '../../utils/versionManager';

const VersionDisplay = ({ className = "", position = "bottom-right" }) => {
  const [versionInfo, setVersionInfo] = useState({
    version: APP_VERSION,
    updateAvailable: false,
    buildTime: null
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Get build info if available
    const loadBuildInfo = async () => {
      try {
        const response = await fetch('/build-info.json');
        if (response.ok) {
          const buildInfo = await response.json();
          setVersionInfo(prev => ({
            ...prev,
            buildTime: buildInfo.buildTime,
            buildDate: buildInfo.buildDate
          }));
        }
      } catch (error) {
        // Build info not available, that's OK
      }
    };

    loadBuildInfo();

    // Listen for version updates
    const handleVersionEvent = (type, data) => {
      if (type === 'updateAvailable') {
        setVersionInfo(prev => ({
          ...prev,
          updateAvailable: true
        }));
      }
    };

    const removeListener = versionManager.addListener(handleVersionEvent);
    
    // Update with current version manager state
    const currentInfo = versionManager.getVersionInfo();
    setVersionInfo(prev => ({
      ...prev,
      ...currentInfo
    }));

    return removeListener;
  }, []);

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-40 sm:bottom-4 bottom-20', // Above mobile nav
    'bottom-left': 'fixed bottom-4 left-4 z-40 sm:bottom-4 bottom-20', // Above mobile nav
    'top-right': 'fixed top-4 right-4 z-40',
    'top-left': 'fixed top-4 left-4 z-40',
    'footer': 'inline-flex'
  };

  const handleClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div 
        className={`bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg transition-all duration-200 cursor-pointer hover:bg-opacity-100 ${
          expanded ? 'p-3' : 'px-3 py-1'
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span className={`inline-flex items-center ${versionInfo.updateAvailable ? 'text-orange-600' : 'text-gray-600'}`}>
            <span className="font-mono font-medium">v{versionInfo.version}</span>
            {versionInfo.updateAvailable && (
              <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            )}
          </span>
          
          {expanded && (
            <div className="border-l border-gray-300 pl-2 ml-2">
              <div className="flex flex-col space-y-1">
                {versionInfo.buildTime && (
                  <div className="text-xs text-gray-500">
                    Build: {versionInfo.buildTime}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Cache: {versionInfo.swRegistered ? '✅' : '❌'}
                </div>
                {versionInfo.updateAvailable && (
                  <div className="text-xs text-orange-600 font-medium">
                    🔄 Update available
                  </div>
                )}
                <button 
                  onClick={() => versionManager.clearCacheAndReload()}
                  className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded text-left hover:bg-red-200"
                >
                  🗑️ Force Refresh
                </button>
              </div>
            </div>
          )}
        </div>
        
        {!expanded && (
          <div className="text-xs text-gray-400 mt-0.5">
            Click for details
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionDisplay;