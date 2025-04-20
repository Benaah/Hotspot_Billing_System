import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, User, Phone, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../../context/ThemeContext';

const Register: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signUp, isLoading, error } = useAuthStore();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(phoneNumber, password, fullName);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
      <div className={`p-8 rounded-lg shadow-md w-full max-w-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } rainbow-edges`}>
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <Wifi className={`h-10 w-10 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>BenNet</h1>
          </div>
        </div>
        
        <h2 className={`text-2xl font-semibold text-center mb-6 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>Create your account</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className={`block text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`pl-10 w-full px-4 py-2 border rounded-md ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          
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
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="123-456-7890"
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
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'border-gray-300 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <p className={`mt-1 text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>Password must be at least 6 characters</p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className={`mt-4 text-sm text-center ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          By signing up, you agree to our{' '}
          <Link to="/terms-of-service" className={`text-blue-600 hover:text-blue-700 font-medium ${
            theme === 'dark' ? 'text-blue-400 hover:text-blue-500' : 'text-blue-600 hover:text-blue-700'
          }`}>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy-policy" className={`text-blue-600 hover:text-blue-700 font-medium ${
            theme === 'dark' ? 'text-blue-400 hover:text-blue-500' : 'text-blue-600 hover:text-blue-700'
          }`}>
            Privacy Policy
          </Link>.
        </div>
        
        <div className="mt-6 text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Already have an account?{' '}
            <Link to="/login" className={`text-blue-600 hover:text-blue-800 font-medium ${
              theme === 'dark' ? 'text-blue-400 hover:text-blue-500' : 'text-blue-600 hover:text-blue-800'
            }`}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
