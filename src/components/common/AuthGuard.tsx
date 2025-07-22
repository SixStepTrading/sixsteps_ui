import React from 'react';
import { useUser } from '../../contexts/UserContext';
import Login from '../Auth/Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuth, isLoading } = useUser();
  
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading Six Steps - FarmaAggregator...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, show login page
  if (!isAuth) {
    return <Login />;
  }
  
  // If authenticated, render the children (main app)
  return <>{children}</>;
};

export default AuthGuard; 