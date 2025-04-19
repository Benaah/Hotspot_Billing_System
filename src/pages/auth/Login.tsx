import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Phone, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, error } = useAuthStore();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(phoneNumber, password);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <div className={`p-8 rounded-lg shadow-md w-full max-w-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rainbow-edges`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Wifi className={`h-12 w-12 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <h1 className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Welcome Back</h1>
          <p className={`mt-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={18} className="text-gray-400" />
              </div>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`pl-10 w-full px-4 py-2 border rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="+254XXXXXXXXX"
                pattern="^\+254[0-9]{9}$"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 w-full px-4 py-2 border rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={`mt-6 text-center text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
