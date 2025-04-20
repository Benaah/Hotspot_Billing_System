import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ForgotPassword: React.FC = () => {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phoneNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      setMessage({ type: 'success', text: 'Password reset successfully. Please check your new password.' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`max-w-md mx-auto mt-10 p-6 rounded-lg shadow-md ${
      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      {message && (
        <div className={`p-4 mb-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleResetPassword}>
        <label htmlFor="username" className={`block mb-2 font-medium ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={`w-full p-2 border rounded mb-4 ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
          }`}
        />
        <label htmlFor="phoneNumber" className={`block mb-2 font-medium ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Phone Number
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className={`w-full p-2 border rounded mb-4 ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
          }`}
          placeholder="+254XXXXXXXXX"
          pattern="^\\+254[0-9]{9}$"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
