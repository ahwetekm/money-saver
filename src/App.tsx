import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout } from './components/layout/MobileLayout';
import { useFinansStore } from './store/useFinansStore';

// Code splitting: Her sayfa ayrı chunk olarak yüklenir
// Bu, ilk yükleme süresini dramatik şekilde azaltır
const Dashboard = lazy(() => import('./components/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Transactions = lazy(() => import('./components/pages/Transactions').then(m => ({ default: m.Transactions })));
const Portfolio = lazy(() => import('./components/pages/Portfolio').then(m => ({ default: m.Portfolio })));
const Analytics = lazy(() => import('./components/pages/Analytics').then(m => ({ default: m.Analytics })));
const Goals = lazy(() => import('./components/pages/Goals').then(m => ({ default: m.Goals })));
const Subscriptions = lazy(() => import('./components/pages/Subscriptions').then(m => ({ default: m.Subscriptions })));
const Settings = lazy(() => import('./components/pages/Settings').then(m => ({ default: m.Settings })));

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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReady, setIsReady] = useState(false);
  const initialize = useFinansStore((s) => s.initialize);
  const initialized = useFinansStore((s) => s.initialized);
  const isLoading = useFinansStore((s) => s.isLoading);

  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      } catch (error) {
        console.error('Initialization failed:', error);
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
