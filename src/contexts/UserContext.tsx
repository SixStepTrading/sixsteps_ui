import React, { createContext, useState, useContext, ReactNode } from 'react';

// Possible user roles
export type UserRole = 'Buyer' | 'Admin';

// User profile type definition
interface UserProfile {
  role: UserRole;
  name: string;
  description: string;
}

// Predefined user profiles
const userProfiles: Record<UserRole, UserProfile> = {
  Buyer: {
    role: 'Buyer',
    name: 'Pharmacy Manager',
    description: 'Buyer USER'
  },
  Admin: {
    role: 'Admin',
    name: 'Admin Panel',
    description: 'Administrator USER'
  }
};

// User context type definition
interface UserContextType {
  userRole: UserRole;
  userName: string;
  userDescription: string;
  toggleUserRole: () => void;
  setUserRole: (role: UserRole) => void;
  setUserProfile: (profile: UserProfile) => void;
}

// Create context with undefined default value
const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(userProfiles.Admin);

  // Toggle between Buyer and Admin roles
  const toggleUserRole = () => {
    setCurrentProfile(prevProfile => 
      prevProfile.role === 'Buyer' ? userProfiles.Admin : userProfiles.Buyer
    );
  };

  // Explicitly set a role and update the profile
  const handleSetUserRole = (role: UserRole) => {
    setCurrentProfile(userProfiles[role]);
  };

  // Update the full user profile
  const handleSetUserProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
  };

  return (
    <UserContext.Provider
      value={{
        userRole: currentProfile.role,
        userName: currentProfile.name,
        userDescription: currentProfile.description,
        toggleUserRole,
        setUserRole: handleSetUserRole,
        setUserProfile: handleSetUserProfile,
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