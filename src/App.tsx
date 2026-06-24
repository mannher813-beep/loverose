import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages lazy/direct imports
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Discovery from './pages/Discovery';
import Messenger from './pages/Messenger';
import PremiumShop from './pages/PremiumShop';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';

// Route Protections
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Redirect to Onboarding if profile is not completed
  if (userProfile && (!userProfile.displayName || userProfile.displayName === 'Nouveau membre')) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Landing / SEO routes */}
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />

          {/* Onboarding steps parcours */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Private Authenticated Routes */}
          <Route path="/discovery" element={
            <ProtectedRoute>
              <Discovery />
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <Messenger />
            </ProtectedRoute>
          } />

          <Route path="/premium" element={
            <ProtectedRoute>
              <PremiumShop />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
