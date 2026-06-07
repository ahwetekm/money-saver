import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GlassCard, NeonButton } from './GlassCard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Bir şeyler yanlış gitti</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Uygulama çalışırken beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-black/50 p-4 rounded-lg mb-6 overflow-auto max-h-48">
                <p className="text-red-400 font-mono text-xs mb-2">{this.state.error.toString()}</p>
                <p className="text-slate-500 font-mono text-[10px] whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}

            <NeonButton 
              onClick={this.handleReset}
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sayfayı Yenile
            </NeonButton>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}