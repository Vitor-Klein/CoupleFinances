import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancesProvider } from './context/FinancesContext';
import { Navigation } from './components';
import { Dashboard, AddTransaction, Transactions, Analytics, Profile, Login } from './pages';
import './App.css';

type PageType = 'dashboard' | 'add' | 'transactions' | 'analytics' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'add':
        return <AddTransaction />;
      case 'transactions':
        return <Transactions />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <FinancesProvider>
      <div className="app">
        <main className="app-main">{renderPage()}</main>
        <Navigation
          active={currentPage}
          onNavigate={(page) => setCurrentPage(page as PageType)}
        />
      </div>
    </FinancesProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
