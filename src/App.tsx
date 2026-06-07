import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/pages/Dashboard';
import { Transactions } from './components/pages/Transactions';
import { Portfolio } from './components/pages/Portfolio';
import { Analytics } from './components/pages/Analytics';
import { Goals } from './components/pages/Goals';
import { Subscriptions } from './components/pages/Subscriptions';
import { Settings } from './components/pages/Settings';
import { useFinansStore } from './store/useFinansStore';
import { LoadingSpinner } from './components/ui/GlassCard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { initialize, initialized, isLoading } = useFinansStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mb-4" />
          <p className="text-white/60">Yükleniyor...</p>
        </div>
      </div>
    );
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
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
}

export default App;
