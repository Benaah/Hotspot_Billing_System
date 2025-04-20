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
import TermsOfService from './pages/auth/TermsOfService';
import PrivacyPolicy from './pages/auth/PrivacyPolicy';

// User Pages
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Subscriptions from './pages/Subscriptions';
import Billing from './pages/Billing';
import Profile from './pages/Profile';
import Invoice from './pages/Invoice';
import PromotionsView from './pages/PromotionsView';
import SupportContact from './pages/SupportContact';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPackages from './pages/admin/AdminPackages';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';
import AdminCustomerSupport from './pages/admin/AdminCustomerSupport';
import AdminHotspotDevices from './pages/admin/AdminHotspotDevices';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminMikrotik from './pages/admin/AdminMikrotik';

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
          <Route path="/terms-of-service" element={
            <AuthGuard requireAuth={false}>
              <TermsOfService />
            </AuthGuard>
          } />
          <Route path="/privacy-policy" element={
            <AuthGuard requireAuth={false}>
              <PrivacyPolicy />
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
            <Route path="promotions" element={
              <AuthGuard>
                <PromotionsView />
              </AuthGuard>
            } />
            <Route path="support" element={
              <AuthGuard>
                <SupportContact />
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
            <Route path="admin/customersupport" element={
              <AuthGuard requireAdmin>
                <AdminCustomerSupport />
              </AuthGuard>
            } />
            <Route path="admin/hotspotdevices" element={
              <AuthGuard requireAdmin>
                <AdminHotspotDevices />
              </AuthGuard>
            } />
            <Route path="admin/promotions" element={
              <AuthGuard requireAdmin>
                <AdminPromotions />
              </AuthGuard>
            } />
            <Route path="admin/dashboard" element={
              <AuthGuard requireAdmin>
                <AdminDashboard />
              </AuthGuard>
            } />
            <Route path="admin/mikrotik" element={
              <AuthGuard requireAdmin>
                <AdminMikrotik />
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
