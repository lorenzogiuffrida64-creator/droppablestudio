import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Clients from './components/Clients';
import Payments from './components/Payments';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider } from './services/store';
import { Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Caricamento...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Render main app
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} />;
      case 'tasks':
        return <Tasks />;
      case 'clients':
        return <Clients />;
      case 'payments':
        return <Payments />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <h2 className="text-2xl font-bold text-gray-300 uppercase tracking-widest">
              Modulo {activeView}
            </h2>
            <p>Questo modulo è attualmente in fase di sviluppo.</p>
          </div>
        );
    }
  };

  return (
    <StoreProvider>
      <Layout activeView={activeView} onViewChange={setActiveView}>
        {renderView()}
      </Layout>
    </StoreProvider>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
