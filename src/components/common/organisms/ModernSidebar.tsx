import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  useTheme, 
  Divider,
  useMediaQuery,
  SvgIconProps
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

import { SidebarItem } from '../atoms';
import { SidebarHeader } from '../molecules';
import { NotificationsPanel } from '.';
import { useUser } from '../../../contexts/UserContext';

interface MenuItem {
  text: string;
  icon: React.ReactElement<SvgIconProps>;
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
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { userRole, userName } = useUser();
  
  // State for notification panel
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLElement | null>(null);
  const [currentNotificationCount, setCurrentNotificationCount] = useState<number>(notificationCount);
  
  // Handle click on notifications button
  const handleNotificationsClick = () => {
    // We need to capture the event in a DOM element reference to use as anchor
    // This is handled by the SidebarItem component which provides the event
    // We're using the currentTarget here as a workaround
    const element = document.activeElement as HTMLElement;
    setNotificationsAnchorEl(element);
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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Purchase Orders', icon: <ShoppingCartIcon />, path: '/purchase-orders' },
    // Show User Management only to Admin users
    ...(userRole === 'Admin' ? [{ text: 'User Management', icon: <PeopleIcon />, path: '/user-management' }] : []),
  ];
  
  // Utility menu
  const utilityItems: MenuItem[] = [
    { 
      text: 'Notifications', 
      icon: <NotificationsIcon />, 
      badgeContent: currentNotificationCount,
      onClick: handleNotificationsClick
    },
    { 
      text: 'Logout', 
      icon: <LogoutIcon />, 
      onClick: onLogout || (() => console.log('Logout clicked'))
    }
  ];
  
  const drawer = (
    <>
      <SidebarHeader 
        logo="Six Steps"
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      
      {/* Main menu */}
      <List sx={{ px: 1 }}>
        {mainMenuItems.map((item) => (
          <SidebarItem
            key={item.text}
            icon={item.icon}
            text={item.text}
            to={item.path}
            isSelected={location.pathname === item.path}
            isCollapsed={isCollapsed}
            onClick={item.onClick}
          />
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* Utility menu (at bottom) */}
      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ my: 1 }} />
        <List sx={{ px: 1 }}>
          {utilityItems.map((item) => (
            <SidebarItem
              key={item.text}
              icon={item.icon}
              text={item.text}
              to={item.path}
              isCollapsed={isCollapsed}
              badgeContent={item.badgeContent}
              onClick={item.onClick}
            />
          ))}
        </List>
      </Box>
      
      {/* Notifications panel */}
      <NotificationsPanel
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        onNotificationsChange={handleNotificationsUpdate}
      />
    </>
  );
  
  // Current drawer width
  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  
  return (
    <Box
      component="nav"
      sx={{
        width: { sm: currentWidth },
        flexShrink: { sm: 0 },
      }}
    >
      {/* Mobile drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
            boxShadow: theme.shadows[3]
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: currentWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
            boxShadow: isCollapsed ? 'none' : theme.shadows[1],
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            backgroundColor: theme.palette.background.paper,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default ModernSidebar; 