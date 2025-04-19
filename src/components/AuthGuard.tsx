import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../pages/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false 
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Handle authentication logic
    if (requireAuth && !user) {
      navigate('/login', { replace: true });
      return;
    }

    // Handle non-authenticated routes (login, register, etc.)
    if (!requireAuth && user) {
      navigate('/', { replace: true });
      return;
    }

    // Handle admin routes
    if (requireAdmin && (!user || !user.is_admin)) {
      navigate('/', { replace: true });
      return;
    }
  }, [navigate, user, requireAuth, requireAdmin]);

  // Show children only when authentication requirements are met
  if (requireAuth && !user) return null;
  if (!requireAuth && user) return null;
  if (requireAdmin && (!user || !user.is_admin)) return null;

  return <>{children}</>;
};

export default AuthGuard;