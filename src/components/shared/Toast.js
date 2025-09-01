// src/components/shared/Toast.js
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration)
  };
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ id, message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const getToastStyles = () => {
    const baseClasses = `
      transform transition-all duration-300 ease-in-out
      ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-center space-x-3
      hover:shadow-xl cursor-pointer
    `;

    const typeStyles = {
      success: 'border-green-500 bg-green-50',
      error: 'border-red-500 bg-red-50', 
      warning: 'border-yellow-500 bg-yellow-50',
      info: 'border-blue-500 bg-blue-50'
    };

    return `${baseClasses} ${typeStyles[type] || typeStyles.info}`;
  };

  const getIcon = () => {
    const iconClasses = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-600`} />;
      case 'error':
        return <XCircle className={`${iconClasses} text-red-600`} />;
      case 'warning':
        return <AlertCircle className={`${iconClasses} text-yellow-600`} />;
      default:
        return <Info className={`${iconClasses} text-blue-600`} />;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success': return 'text-green-800';
      case 'error': return 'text-red-800';
      case 'warning': return 'text-yellow-800';
      default: return 'text-blue-800';
    }
  };

  return (
    <div className={getToastStyles()} onClick={handleClose}>
      {getIcon()}
      <div className={`flex-1 text-sm font-medium ${getTextColor()}`}>
        {message}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${getTextColor().replace('800', '600')}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastContainer;