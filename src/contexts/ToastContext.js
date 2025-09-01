// src/contexts/ToastContext.js
import React, { createContext, useContext } from 'react';
import { useToast } from '../components/shared/Toast';
import ToastContainer from '../components/shared/Toast';

const ToastContext = createContext();

export const useAppToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer toasts={toastMethods.toasts} removeToast={toastMethods.removeToast} />
    </ToastContext.Provider>
  );
};