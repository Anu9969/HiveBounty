import React from 'react';
import { Navigate } from 'react-router-dom';

interface AuthRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

// Simplified AuthRoute that only checks if user is authenticated
export const AuthRoute: React.FC<AuthRouteProps> = ({ children, isAuthenticated }) => {
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
}; 