import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-on-surface">
          <div className="max-w-2xl w-full bg-error-container p-6 rounded-2xl border-4 border-error shadow-[8px_8px_0px_0px_#111827]">
            <h1 className="text-3xl font-black text-error mb-4">Something went wrong.</h1>
            <p className="text-lg font-bold text-on-error-container mb-4">
              The application encountered an unexpected runtime error.
            </p>
            <div className="bg-surface-container-highest p-4 rounded text-left overflow-auto max-h-96 border-2 border-surface-border">
              <pre className="text-sm font-mono text-error font-bold mb-2 whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
              <pre className="text-xs font-mono text-on-surface-variant whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
            <button
              className="mt-6 px-6 py-3 bg-error text-on-error font-black uppercase tracking-widest border-2 border-surface-border hover:bg-error/90 hover:shadow-[4px_4px_0px_0px_#111827] transition-all"
              onClick={() => window.location.href = '/dashboard'}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
