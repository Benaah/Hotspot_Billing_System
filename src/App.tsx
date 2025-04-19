import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './pages/store/authStore';
import { ThemeProvider } from './context/ThemeContext';
import './index.css'; // Import Tailwind CSS

// Layout
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Subscriptions from './pages/Subscriptions';
import Billing from './pages/Billing';
import Profile from './pages/Profile';
import Invoice from './pages/Invoice';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPackages from './pages/admin/AdminPackages';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';

function App() {
  const { getUser } = useAuthStore();

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={
            <AuthGuard requireAuth={false}>
              <Login />
            </AuthGuard>
          } />
          <Route path="/register" element={
            <AuthGuard requireAuth={false}>
              <Register />
            </AuthGuard>
          } />
          <Route path="/forgotpassword" element={
            <AuthGuard requireAuth={false}>
              <ForgotPassword />
            </AuthGuard>
          } />

          {/* Protected Routes */}
          <Route path="/" element={<Layout />}>
            {/* User Routes */}
            <Route index element={
              <AuthGuard requireAuth={true}>
                <Dashboard />
              </AuthGuard>
            } />
            <Route path="packages" element={
              <AuthGuard>
                <Packages />
              </AuthGuard>
            } />
            <Route path="subscriptions" element={
              <AuthGuard>
                <Subscriptions />
              </AuthGuard>
            } />
            <Route path="billing" element={
              <AuthGuard>
                <Billing />
              </AuthGuard>
            } />
            <Route path="profile" element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            } />
            <Route path="invoice/:id" element={
              <AuthGuard>
                <Invoice />
              </AuthGuard>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AuthGuard requireAuth={true} requireAdmin={true}>
                <AdminDashboard />
              </AuthGuard>
            } />
            <Route path="/admin/packages" element={
              <AuthGuard requireAuth={true} requireAdmin={true}>
                <AdminPackages />
              </AuthGuard>
            } />
            <Route path="admin/users" element={
              <AuthGuard requireAdmin>
                <AdminUsers />
              </AuthGuard>
            } />
            <Route path="admin/analytics" element={
              <AuthGuard requireAdmin>
                <AdminAnalytics />
              </AuthGuard>
            } />
            <Route path="admin/reports" element={
              <AuthGuard requireAdmin>
                <AdminReports />
              </AuthGuard>
            } />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
