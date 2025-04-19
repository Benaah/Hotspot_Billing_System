import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './pages/store/authStore';
import { Package } from './pages/types';
import ReactDOM from 'react-dom';
import './index.css'; // Import Tailwind CSS
import { CreditCard, Download, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction } from './pages/types';
import axios from 'axios';

// Layout
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import Dashboard from './pages/Dashboard';
import Packages from './pages/Packages';
import Subscriptions from './pages/Subscriptions';
import Billing from './pages/Billing';
import Profile from './pages/Profile';

// Admin Pages
import AdminPackages from './pages/admin/AdminPackages';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  const { getUser } = useAuthStore();

  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
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

        {/* Protected Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={
            <AuthGuard>
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

          {/* Admin Routes */}
          <Route path="admin/packages" element={
            <AuthGuard requireAdmin>
              <AdminPackages />
            </AuthGuard>
          } />
          <Route path="admin/users" element={
            <AuthGuard requireAdmin>
              <AdminUsers />
            </AuthGuard>
          } />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

export default App;