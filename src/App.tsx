import { useState, useEffect, Suspense } from 'react';
import { Layout, PageHeader } from './components/layout/MobileLayout';
import { Dashboard } from './components/pages/Dashboard';
import { Transactions } from './components/pages/Transactions';
import { Portfolio } from './components/pages/Portfolio';
import { Analytics } from './components/pages/Analytics';
import { Goals } from './components/pages/Goals';
import { Subscriptions } from './components/pages/Subscriptions';
import { Settings } from './components/pages/Settings';
import { useFinansStore } from './store/useFinansStore';
import { setupGlobalErrorHandlers, ErrorHelpers } from './lib/errors';

// Setup global error handlers immediately
setupGlobalErrorHandlers();

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
        <p className="text-white/60 text-sm">Yükleniyor...</p>
      </div>
    </div>
  );
}

// Error boundary fallback
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Bir hata oluştu</h2>
        <p className="text-white/60 mb-4 text-sm">{error.message}</p>
        <button
          onClick={resetError}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}

// Error boundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    ErrorHelpers.storageError(`Render hatası: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error!} 
          resetError={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }
    return this.props.children;
  }
}

// Import React for ErrorBoundary
import React from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReady, setIsReady] = useState(false);
  const { initialize, initialized, isLoading } = useFinansStore();

  useEffect(() => {
    // Initialize app data
    const init = async () => {
      try {
        await initialize();
        // Small delay to ensure styles are loaded
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      } catch (error) {
        console.error('Initialization failed:', error);
        ErrorHelpers.storageError('Uygulama başlatılamadı');
        setIsReady(true);
      }
    };

    init();
  }, [initialize]);

  // Show loading screen until ready
  if (!isReady || isLoading || !initialized) {
    return <LoadingScreen />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'portfolio':
        return <Portfolio />;
      case 'analytics':
        return <Analytics />;
      case 'goals':
        return <Goals />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        <Suspense fallback={<LoadingScreen />}>
          {renderPage()}
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
