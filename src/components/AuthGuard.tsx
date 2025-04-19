import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from 'src\\pages\\store\\authStore';

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
  const { user, getUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      await getUser();
    };
    
    checkAuth();
  }, [getUser]);

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      navigate('/login');
      return;
    }

    if (!requireAuth && user) {
      navigate('/');
      return;
    }

    if (requireAdmin && (!user || !user.email.endsWith('@admin.com'))) {
      navigate('/');
      return;
    }
  }, [user, isLoading, navigate, requireAuth, requireAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;