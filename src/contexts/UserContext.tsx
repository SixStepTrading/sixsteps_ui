import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthUser, getCurrentUser, isAuthenticated, login as apiLogin, logout as apiLogout, LoginCredentials } from '../utils/api';

// Possible user roles mapped from entity types
export type UserRole = 'Admin' | 'Pharmacy' | 'Supplier' | 'Manager';

// User profile interface
interface UserProfile {
  role: UserRole;
  name: string;
  description: string;
  entityName?: string;
  entityType?: string;
  contacts?: string;
}

// User context type definition
interface UserContextType {
  userRole: UserRole;
  userName: string;
  userDescription: string;
  user: AuthUser | null;
  isAuth: boolean;
  isLoading: boolean;
  toggleUserRole: () => void;
  setUserRole: (role: UserRole) => void;
  setUserProfile: (profile: UserProfile) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with undefined default value
const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

// Map entity types to user roles
const mapEntityTypeToRole = (entityType: string): UserRole => {
  switch (entityType.toUpperCase()) {
    case 'ADMIN':
      return 'Admin';
    case 'PHARMACY':
      return 'Pharmacy';
    case 'SUPPLIER':
      return 'Supplier';
    case 'MANAGER':
      return 'Manager';
    default:
      return 'Admin';
  }
};

// Map user role to profile using the role from backend
const mapRoleToProfile = (user: AuthUser): UserProfile => {
  // Use role directly from backend API, map to frontend UserRole
  const role: UserRole = user.role === 'admin' ? 'Admin' : 'Pharmacy';
  
  return {
    role,
    name: user.referralName || user.entityName,
    description: getRoleDescription(role),
    entityName: user.entityName,
    entityType: user.entityType,
    contacts: user.referralContacts
  };
};

// Get role description
const getRoleDescription = (role: UserRole): string => {
  switch (role) {
    case 'Admin':
      return 'Administrator with full system access';
    case 'Pharmacy':
      return 'Pharmacy manager for orders and inventory';
    case 'Supplier':
      return 'Supplier for product management';
    case 'Manager':
      return 'Management entity for business operations';
    default:
      return 'System user';
  }
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        if (isAuthenticated()) {
          const storedUser = getCurrentUser();
          if (storedUser) {
            setUser(storedUser);
            setCurrentProfile(mapRoleToProfile(storedUser));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('sixstep_token');
        localStorage.removeItem('sixstep_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await apiLogin(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
        setCurrentProfile(mapRoleToProfile(response.user));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentProfile(null);
      setIsLoading(false);
    }
  };

  // Toggle between roles - REMOVED: Role should be determined by backend only
  const toggleUserRole = () => {
    console.warn('Role switching is disabled. Roles are determined by user authentication.');
  };

  // Explicitly set a role - REMOVED: Role should be determined by backend only
  const handleSetUserRole = (role: UserRole) => {
    console.warn('Manual role setting is disabled. Roles are determined by user authentication.');
  };

  // Update the full user profile
  const handleSetUserProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
  };

  // Default values when not authenticated
  const defaultProfile: UserProfile = {
    role: 'Admin',
    name: 'Guest User',
    description: 'Please log in to access the system'
  };

  const activeProfile = currentProfile || defaultProfile;

  return (
    <UserContext.Provider
      value={{
        userRole: activeProfile.role,
        userName: activeProfile.name,
        userDescription: activeProfile.description,
        user,
        isAuth: !!user && isAuthenticated(),
        isLoading,
        toggleUserRole,
        setUserRole: handleSetUserRole,
        setUserProfile: handleSetUserProfile,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 