import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Wifi, Package, CreditCard, User, LogOut, BarChart2 } from 'lucide-react';
import { useAuthStore } from 'src\\pages\\store\\authStore';

const Layout: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return <Outlet />;
  }

  const isAdmin = user.email.endsWith('@admin.com'); // Simple admin check for demo purposes

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <BarChart2 size={20} /> },
    { path: '/packages', label: 'Packages', icon: <Package size={20} /> },
    { path: '/subscriptions', label: 'My Subscriptions', icon: <Wifi size={20} /> },
    { path: '/billing', label: 'Billing', icon: <CreditCard size={20} /> },
    { path: '/profile', label: 'Profile', icon: <User size={20} /> },
  ];

  if (isAdmin) {
    navItems.push(
      { path: '/admin/packages', label: 'Manage Packages', icon: <Package size={20} /> },
      { path: '/admin/users', label: 'Manage Users', icon: <User size={20} /> }
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <Wifi className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">HotSpot</h1>
          </div>
        </div>
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${
                    location.pathname === item.path ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              >
                <LogOut size={20} />
                <span className="ml-3">Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user.full_name || user.email}
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;