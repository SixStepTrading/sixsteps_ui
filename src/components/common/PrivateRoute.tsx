import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

interface PrivateRouteProps {
  element: React.ReactNode;
  requiredRole?: 'Admin' | 'Pharmacy' | 'Supplier' | 'Landlord' | 'Tenant';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, requiredRole }) => {
  const { userRole, isAuth, isLoading } = useUser();
  const location = useLocation();
  
  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuth) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has the required role
  if (requiredRole && userRole !== requiredRole) {
    // For non-admin users trying to access admin routes, redirect to dashboard
    if (requiredRole === 'Admin') {
      return <Navigate to="/" replace />;
    }
    
    // For other role mismatches, redirect to home page
    return <Navigate to="/" replace />;
  }
  
  // Render the protected component
  return <>{element}</>;
};

export default PrivateRoute; 