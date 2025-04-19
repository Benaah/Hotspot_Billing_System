import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Wifi, Package, CreditCard, User, LogOut, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../pages/store/authStore';
import { useTheme } from '../context/ThemeContext';

interface User {
  role: string;
  full_name?: string;
  phone_number: string;
}

const Layout: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return <Outlet />;
  }

  const isAdmin = user.role === 'admin';

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <BarChart2 size={20} /> },
    { path: '/packages', label: 'Packages', icon: <Package size={20} /> },
    { path: '/subscriptions', label: 'My Subscriptions', icon: <Wifi size={20} /> },
    { path: '/billing', label: 'Billing', icon: <CreditCard size={20} /> },
    { path: '/profile', label: 'Profile', icon: <User size={20} /> },
    { path: '/invoice', label: 'Invoice', icon: <CreditCard size={20} /> },
  ];

  if (isAdmin) {
    navItems.push(
      { path: '/admin/packages', label: 'Manage Packages', icon: <Package size={20} /> },
      { path: '/admin/users', label: 'Manage Users', icon: <User size={20} /> },
      { path: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
      { path: '/admin/dashboard', label: 'Dashboard', icon: <BarChart2 size={20} /> },
      { path: '/admin/mikrotik', label: 'Mikrotik', icon: <Package size={20} /> },
      { path: '/admin/reports', label: 'Reports', icon: <BarChart2 size={20} /> }
    );
  }

  return (
    <div className={`flex h-screen ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'
    }`}>
      {/* Sidebar */}
      <div className={`w-64 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-md`}>
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Wifi className="h-8 w-8 text-blue-600" />
            <h1 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>BenNet</h1>
          </div>
        </div>

        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 ${
                    location.pathname === item.path
                      ? theme === 'dark'
                        ? 'bg-gray-700 text-blue-400 border-r-4 border-blue-400'
                        : 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  } transition-colors duration-200`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center px-6 py-3 ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-red-400'
                    : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                } transition-colors duration-200`}
              >
                <LogOut size={20} />
                <span className="ml-3">Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-4">
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {user.full_name || user.phone_number}
                </span>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-blue-600 text-white'
                }`}>
                  {(user.full_name?.[0] || user.phone_number[0]).toUpperCase()}
                </div>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-md ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  {theme === 'dark' ? '🌞' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;