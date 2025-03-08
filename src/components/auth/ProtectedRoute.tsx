import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { account, isConnecting, isKeychainInstalled } = useWalletContext();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Add a delay to ensure wallet connection check is complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't redirect while still checking authentication
  if (isCheckingAuth || isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="animate-pulse bg-gray-200 h-12 w-48 rounded mb-4"></div>
            <p className="text-gray-500">Checking wallet connection...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only redirect if we've finished checking and the user is not authenticated
  if (!isKeychainInstalled || !account) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}; 