import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen p-8 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className={`max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4">
          Your privacy is important to us. This policy explains how we collect, use, and protect your information.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Information Collection</h2>
        <p className="mb-4">
          We collect information you provide when you register or use our services.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Use of Information</h2>
        <p className="mb-4">
          We use your information to provide and improve our services.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Data Security</h2>
        <p className="mb-4">
          We implement security measures to protect your data.
        </p>
        <p className="mt-6">
          <Link to="/register" className={`text-blue-600 hover:text-blue-700 font-medium ${
            theme === 'dark' ? 'text-blue-400 hover:text-blue-500' : 'text-blue-600 hover:text-blue-700'
          }`}>
            Back
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
