// src/components/shared/ErrorBoundary.js
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { versionManager } from '../../utils/versionManager';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('🔥 Error boundary caught:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Log to error reporting service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, { 
        contexts: { react: errorInfo } 
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleFullRefresh = async () => {
    await versionManager.gracefulReload('errorRecovery');
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Error Header */}
            <div className="bg-red-500 px-6 py-4">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-white mr-2" />
                <h2 className="text-xl font-bold text-white">
                  Oops! Something went wrong
                </h2>
              </div>
            </div>
            
            {/* Error Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                We've encountered an unexpected error. Don't worry, your data is safe. 
                {this.state.errorCount > 2 && (
                  <span className="block mt-2 text-sm text-orange-600">
                    Multiple errors detected. A full page refresh might help.
                  </span>
                )}
              </p>
              
              {/* Error Details (Dev Mode Only) */}
              {isDevelopment && (
                <details className="mb-4 bg-gray-100 p-3 rounded">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details (Development Mode)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="text-xs bg-white p-2 rounded border border-gray-200">
                      <strong>Error:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-red-600">
                        {this.state.error?.toString()}
                      </pre>
                    </div>
                    {this.state.error?.stack && (
                      <div className="text-xs bg-white p-2 rounded border border-gray-200">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-gray-600 max-h-40 overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div className="text-xs bg-white p-2 rounded border border-gray-200">
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-gray-600 max-h-40 overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleFullRefresh}
                  className="flex-1 flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center bg-[#5D1F1F] text-white px-4 py-2 rounded hover:bg-[#4A1818] transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </button>
              </div>
            </div>
            
            {/* Error Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                If this problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;