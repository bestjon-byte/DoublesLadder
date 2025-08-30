
// src/components/ErrorBoundary.js
import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You could send this to an error reporting service
    // reportErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Force a page reload as last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h1>
              <p className="text-gray-600">
                The tennis ladder app encountered an unexpected error. Don't worry, we can fix this!
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-[#5D1F1F] text-white py-3 px-4 rounded-md hover:bg-[#4A1818] transition-colors font-medium flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </button>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show technical details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="font-semibold text-red-600 mb-2">Error:</div>
                  <div className="mb-4">{this.state.error && this.state.error.toString()}</div>
                  
                  <div className="font-semibold text-red-600 mb-2">Stack Trace:</div>
                  <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;