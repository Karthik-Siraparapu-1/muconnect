import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { SearchPage } from './pages/SearchPage';
import { useAuth } from './hooks/useAuth';

import { ChatPage } from './pages/ChatPage';

function PrivateRoute({ children, user }: { children: React.ReactNode; user: any }) {
  return user ? <>{children}</> : <Navigate to="/auth" />;
}

export default function App() {
  const { user, login, logout, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50">Loading...</div>;
  }

  return (
    <Router>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage onLogin={login} />} />
          <Route
            path="/onboarding"
            element={
              <PrivateRoute user={user}>
                <OnboardingPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute user={user}>
                <OnboardingPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute user={user}>
                <DashboardPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <PrivateRoute user={user}>
                <DiscoverPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute user={user}>
                <SearchPage user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:userId"
            element={
              <PrivateRoute user={user}>
                <ChatPage user={user} />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}
