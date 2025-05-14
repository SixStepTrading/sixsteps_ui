import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

interface PrivateRouteProps {
  element: React.ReactNode;
  requiredRole?: 'Admin' | 'Buyer';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, requiredRole = 'Admin' }) => {
  const { userRole } = useUser();
  
  // Check if user has the required role
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to home page if user doesn't have required role
    return <Navigate to="/" replace />;
  }
  
  // Render the protected component
  return <>{element}</>;
};

export default PrivateRoute; 