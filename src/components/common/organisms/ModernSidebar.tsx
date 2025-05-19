import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { SidebarItem } from '../atoms';
import { SidebarHeader } from '../molecules';
import { NotificationsPanel } from '.';
import { useUser } from '../../../contexts/UserContext';

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  badgeContent?: number;
  onClick?: () => void;
}

interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  notificationCount?: number;
  onLogout?: () => void;
}

// Constants for drawer dimensions
const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  notificationCount = 0,
  onLogout
}) => {
  const location = useLocation();
  const { userRole, userName } = useUser();
  const isMobile = window.innerWidth < 640;
  
  // State for notification panel
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLElement | null>(null);
  const [currentNotificationCount, setCurrentNotificationCount] = useState<number>(notificationCount);
  
  // Handle click on notifications button
  const handleNotificationsClick = () => {
    setNotificationsAnchorEl(document.getElementById('notification-button'));
  };
  
  // Close notifications panel
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  // Update notification count
  const handleNotificationsUpdate = (count: number) => {
    setCurrentNotificationCount(count);
  };
  
  // Main menu
  const mainMenuItems: MenuItem[] = [
    { 
      text: 'Dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ), 
      path: '/' 
    },
    { 
      text: 'Purchase Orders', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ), 
      path: '/purchase-orders' 
    },
    // Show User Management only to Admin users
    ...(userRole === 'Admin' ? [
      { 
        text: 'User Management', 
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ), 
        path: '/user-management' 
      }
    ] : []),
  ];
  
  // Utility menu
  const utilityItems: MenuItem[] = [
    { 
      text: 'Notifications', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" id="notification-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ), 
      badgeContent: currentNotificationCount,
      onClick: handleNotificationsClick
    },
    { 
      text: 'Logout', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ), 
      onClick: onLogout || (() => console.log('Logout clicked'))
    }
  ];
  
  const drawer = (
    <div className="flex flex-col h-full">
      <SidebarHeader 
        logo=""
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      
      <hr className="border-gray-200 my-2" />
      
      {/* Main menu */}
      <ul className="px-1.5">
        {mainMenuItems.map((item) => (
          <li key={item.text}>
          <SidebarItem
            icon={item.icon}
            text={item.text}
            to={item.path}
            isSelected={location.pathname === item.path}
            isCollapsed={isCollapsed}
            onClick={item.onClick}
          />
          </li>
        ))}
      </ul>
      
      <div className="flex-grow"></div>
      
      {/* Utility menu (at bottom) */}
      <div className="mt-auto">
        <hr className="border-gray-200 my-2" />
        <ul className="px-1.5">
          {utilityItems.map((item) => (
            <li key={item.text}>
            <SidebarItem
              icon={item.icon}
              text={item.text}
              to={item.path}
              isCollapsed={isCollapsed}
              badgeContent={item.badgeContent}
              onClick={item.onClick}
            />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
  
  return (
    <nav className={`${isMobile ? '' : 'hidden sm:block'}`}>
      {/* Mobile drawer (temporary) */}
      {mobileOpen && (
        <div className="block sm:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onMobileClose}
          ></div>
          <div className={`
            fixed left-0 top-0 bottom-0 
            w-[${DRAWER_WIDTH}px] 
            bg-white border-r border-gray-200 
            shadow-lg z-50 
            transition-transform duration-300
          `}>
        {drawer}
          </div>
        </div>
      )}
      
      {/* Desktop drawer (permanent) */}
      <div className={`
        hidden sm:block
        fixed left-0 top-0 bottom-0
        w-[${isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px]
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'shadow-none' : 'shadow-sm'}
        overflow-hidden
        z-30
      `}>
        {drawer}
      </div>
      
      {/* Notifications Panel */}
      <NotificationsPanel
        anchorEl={notificationsAnchorEl}
        open={!!notificationsAnchorEl}
        onClose={handleNotificationsClose}
        onNotificationsChange={handleNotificationsUpdate}
      />
    </nav>
  );
};

export default ModernSidebar; 