import React, { useState } from 'react';

const SupportContact: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit support request');
      }

      setStatus('success');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Contact Support</h1>
      {status === 'success' && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Your support request has been submitted successfully.
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="subject" className="block mb-1 font-semibold">Subject</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2"
            disabled={status === 'submitting'}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="message" className="block mb-1 font-semibold">Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full border border-gray-300 rounded p-2"
            disabled={status === 'submitting'}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default SupportContact;
