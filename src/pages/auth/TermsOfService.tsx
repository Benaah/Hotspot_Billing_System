import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen p-8 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className={`max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="mb-4">
          Welcome to BenNet. By using our service, you agree to comply with and be bound by the following terms and conditions.
        </p>
        <p className="mb-4">
          These terms govern your use of our website and services. Please read them carefully.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Use of Service</h2>
        <p className="mb-4">
          You agree to use the service only for lawful purposes and in a way that does not infringe the rights of others.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Limitation of Liability</h2>
        <p className="mb-4">
          We are not liable for any damages arising from the use of our service.
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

export default TermsOfService;
