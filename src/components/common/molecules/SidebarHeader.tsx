import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';

interface SidebarHeaderProps {
  logo: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  avatarSrc?: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  logo,
  isCollapsed,
  onToggleCollapse,
  avatarSrc
}) => {
  // Use the UserContext to get and update user role
  const { 
    userRole, 
    userName, 
    userDescription,
    setUserRole 
  } = useUser();
  
  // State for profile popper
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Refs for tracking DOM elements
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Handle toggling menu visibility
  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set new state with a small delay to prevent event conflict
    timeoutRef.current = setTimeout(() => {
      setMenuOpen(prev => !prev);
    }, 10);
  };

  // Handle role switching
  const handleRoleSwitch = (newRole: 'Admin' | 'Buyer', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set role with delay to avoid state conflicts
    setTimeout(() => {
      setUserRole(newRole);
      setMenuOpen(false);
    }, 10);
  };
  
  // Effect for handling clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click was outside both the menu and avatar
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        avatarRef.current && 
        !avatarRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    
    // Only add listener when menu is open
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Logo and collapse control */}
      <div className={`p-2 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="h-16 pl-1">
            <img src="/sixsteps_logo.png" alt="Six Steps Logo" className="h-full object-contain" />
          </div>
        )}
        
        <button
            onClick={onToggleCollapse}
          className={`
            p-1.5
            text-blue-600 dark:text-blue-400
            border border-blue-200 dark:border-blue-600
            bg-blue-50 dark:bg-blue-900/30
            hover:bg-blue-100 dark:hover:bg-blue-900/50
            rounded-full
            transition-transform duration-300
            ${isCollapsed ? 'rotate-180' : 'rotate-0'}
          `}
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* User profile */}
      <div className="px-2 py-1.5 relative">
        <div 
          ref={avatarRef}
          onClick={toggleMenu}
          className={`
            flex items-center
            cursor-pointer
            transition-all duration-200
            p-2
            rounded-lg
            hover:bg-blue-50 dark:hover:bg-dark-bg-hover
            ${isCollapsed ? 'justify-center' : 'justify-start'}
            min-h-[64px]
          `}
        >
          <div className={`relative ${isCollapsed ? 'flex flex-col items-center' : 'flex items-center w-full'}`}>
            {/* Avatar - standardized size */}
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden text-blue-600 dark:text-blue-400 font-medium border-2 border-white dark:border-dark-border-primary shadow-sm">
              {avatarSrc ? (
                <img src={avatarSrc} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">{userName?.charAt(0)}</span>
              )}
            </div>
            
            {/* User info (only when sidebar is expanded) */}
            {!isCollapsed && (
              <div className="ml-3 flex-grow min-w-[120px]">
                <div className="font-medium text-gray-800 dark:text-dark-text-primary text-sm truncate">{userName}</div>
                <div className="text-xs text-gray-500 dark:text-dark-text-muted truncate">{userDescription}</div>
              </div>
            )}
            
            {/* Role indicator */}
            {!isCollapsed ? (
              <div className="ml-auto flex items-center text-gray-500 dark:text-dark-text-muted">
                <div className={`w-2 h-2 rounded-full mr-1 transition-all duration-200 ${userRole === 'Admin' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${menuOpen ? 'rotate-180' : 'rotate-0'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ) : (
              <div 
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-dark-bg-secondary ${userRole === 'Admin' ? 'bg-red-500' : 'bg-green-500'}`}
                title="Click to change role"
              ></div>
            )}
          </div>
        </div>

        {/* Role selector popup - standardize size for both roles */}
        {menuOpen && (
          <div 
            ref={menuRef}
            className={`
              absolute z-50 bg-white dark:bg-dark-bg-card rounded-lg shadow-lg dark:shadow-dark-lg p-4 mt-2
              border border-gray-200 dark:border-dark-border-primary min-w-[240px] w-[240px]
              ${isCollapsed ? 'left-full ml-4' : 'left-0 top-full'}
            `}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary border-b dark:border-dark-border-primary pb-2 mb-2">
              User Profile
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="text-xs text-gray-500 dark:text-dark-text-muted">SWITCH ROLE</div>
              
              <div className="flex flex-col space-y-2">
                <button
                  onClick={(e) => handleRoleSwitch('Admin', e)}
                  className={`
                    flex items-center p-2 rounded-md text-left
                    ${userRole === 'Admin' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-dark-bg-hover'}
                    h-[60px]
                  `}
                >
                  <div className={`w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mr-2 flex-shrink-0`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Admin</div>
                    <div className="text-xs text-gray-500 dark:text-dark-text-muted">Full access to all features</div>
                  </div>
                </button>
                
                <button
                  onClick={(e) => handleRoleSwitch('Buyer', e)}
                  className={`
                    flex items-center p-2 rounded-md text-left
                    ${userRole === 'Buyer' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-dark-bg-hover'}
                    h-[60px]
                  `}
                >
                  <div className={`w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-2 flex-shrink-0`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Buyer</div>
                    <div className="text-xs text-gray-500 dark:text-dark-text-muted">Limited to purchase functions</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarHeader; 