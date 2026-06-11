import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CoupleProvider, useCouple } from './context/CoupleContext';
import { FinancesProvider } from './context/FinancesContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { Navigation } from './components';
import {
  Dashboard,
  AddTransaction,
  Transactions,
  Analytics,
  Planning,
  Profile,
  Login,
  Onboarding,
  ResetPassword,
} from './pages';
import './App.css';

function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="app-loading-spinner" />
    </div>
  );
}

function AppShell() {
  const location = useLocation();

  return (
    <FinancesProvider>
      <div className="app">
        <main className="app-main">
          <div key={location.pathname} className="page-transition">
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddTransaction />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <Navigation />
      </div>
    </FinancesProvider>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();

  if (authLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (coupleLoading) return <LoadingScreen />;

  if (!couple) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return <AppShell />;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PrivacyProvider>
          <AuthProvider>
            <CoupleProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </CoupleProvider>
          </AuthProvider>
        </PrivacyProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
