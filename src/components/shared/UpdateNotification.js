// Update Notification Component - Shows when app updates are available
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { versionManager } from '../../utils/versionManager';
import { haptics } from '../../utils/haptics';

const UpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    const handleVersionEvent = (type, data) => {
      
      if (type === 'updateAvailable') {
        setUpdateInfo(data);
        setShowUpdate(true);
        haptics.tap(); // Gentle notification
      }
      
      if (type === 'newVersionActive') {
        // New version is active, might need to reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Listen for version updates
    const removeListener = versionManager.addListener(handleVersionEvent);
    
    // Check current status
    const versionInfo = versionManager.getVersionInfo();
    if (versionInfo.updateAvailable) {
      setUpdateInfo(versionInfo);
      setShowUpdate(true);
    }

    return removeListener;
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    haptics.impact(); // Strong feedback for important action
    
    try {
      const success = await versionManager.applyUpdate();
      if (!success) {
        // Fallback to cache clear and reload
        await versionManager.clearCacheAndReload();
      }
    } catch (error) {
      console.error('[UpdateNotification] Update failed:', error);
      // Force reload as last resort
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    haptics.tap();
  };

  if (!showUpdate) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Update Available
                  </h3>
                  <p className="text-sm text-gray-500">
                    Version {updateInfo?.version || '1.0.1'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isUpdating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                A new version of the Cawood Tennis app is available. Update now to get the latest features and improvements.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isUpdating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Update Now
                  </>
                )}
              </button>
              
              {!isUpdating && (
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  Later
                </button>
              )}
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              Updates are automatic - no app store required
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateNotification;