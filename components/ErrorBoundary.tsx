import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-8">
          <div className="max-w-xl p-8 bg-white rounded-xl shadow-lg border border-red-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle /> Something went wrong
            </h1>
            <p className="text-slate-600 mb-4">The application encountered an unexpected error.</p>
            <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto font-mono text-slate-700">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}