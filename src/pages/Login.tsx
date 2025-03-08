import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { getKeychainDownloadLink } from '../utils/hive';
import { toast } from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { account, isConnecting, error, isKeychainInstalled, connect } = useWalletContext();
  const [username, setUsername] = useState('');

  // Redirect to home if already logged in
  useEffect(() => {
    if (account) {
      navigate('/');
    }
  }, [account, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      try {
        await connect(username.trim());
        // The redirection will happen in the useEffect when account is set
      } catch (error) {
        console.error("Login error:", error);
      }
    }
  };

  if (!isKeychainInstalled) {
    const downloadLink = getKeychainDownloadLink();
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Hive Keychain Required</h1>
            <p className="mt-2 text-gray-600">
              You need to install the Hive Keychain extension to use this application.
            </p>
          </div>
          <div className="flex justify-center">
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              Install Hive Keychain
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Login with Hive</h1>
          <p className="mt-2 text-gray-600">
            Connect your Hive account to access the application.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Hive Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Hive username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isConnecting}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting || !username.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 