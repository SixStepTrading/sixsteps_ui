import React, { useState } from 'react';
import { 
  AppBar, 
  Box, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Toolbar, 
  Typography, 
  useMediaQuery, 
  Avatar,
  Badge,
  InputBase,
  Divider,
  Container,
  ListItemButton,
  Tooltip,
  Paper
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Medication as MedicationIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MenuOpen as MenuOpenIcon
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

// Smaller drawer width
const drawerWidth = 220;
const miniDrawerWidth = 60;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: '#f5f5f5',
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Purchase Orders', icon: <ShoppingCartIcon />, path: '/purchase-orders' },
    { text: 'User Management', icon: <PeopleIcon />, path: '/user-management' },
  ];

  const drawer = (
    <div>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isDrawerCollapsed ? 'center' : 'space-between' 
      }}>
        {!isDrawerCollapsed && (
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '1rem' }}>
          FarmaBooster
        </Typography>
        )}
        <Tooltip title={isDrawerCollapsed ? "Expand menu" : "Collapse menu"}>
          <IconButton 
            onClick={handleDrawerCollapse}
            size="small"
            sx={{ 
              border: '1px solid rgba(25, 118, 210, 0.2)',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              }
            }}
          >
            {isDrawerCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Tooltip title={isDrawerCollapsed ? item.text : ""} placement="right" arrow>
          <ListItemButton 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
                py: 0.75,
                minHeight: 40,
                justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                  minWidth: isDrawerCollapsed ? 0 : 35,
                  mr: isDrawerCollapsed ? 0 : 1,
                  justifyContent: 'center'
              }}
            >
              {item.icon}
            </ListItemIcon>
              {!isDrawerCollapsed && (
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                    fontSize: '0.85rem',
                fontWeight: location.pathname === item.path ? 'medium' : 'normal'
              }}
            />
              )}
          </ListItemButton>
          </Tooltip>
        ))}
      </List>
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <Divider />
        <Tooltip title={isDrawerCollapsed ? "Logout" : ""} placement="right" arrow>
          <ListItemButton sx={{ py: 0.75, minHeight: 40, justifyContent: isDrawerCollapsed ? 'center' : 'flex-start' }}>
            <ListItemIcon sx={{ 
              minWidth: isDrawerCollapsed ? 0 : 35,
              mr: isDrawerCollapsed ? 0 : 1,
              justifyContent: 'center' 
            }}>
            <LogoutIcon />
          </ListItemIcon>
            {!isDrawerCollapsed && (
          <ListItemText 
            primary="Logout" 
                primaryTypographyProps={{ fontSize: '0.85rem' }}
          />
            )}
        </ListItemButton>
        </Tooltip>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 56 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Tooltip title={isDrawerCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <IconButton
              color="inherit"
              aria-label={isDrawerCollapsed ? "expand sidebar" : "collapse sidebar"}
              edge="start"
              onClick={handleDrawerCollapse}
              sx={{ 
                mr: 2, 
                display: { xs: 'none', sm: 'flex' },
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
              size="small"
            >
              <MenuOpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '1rem' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search medicines, orders..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main }}>A</Avatar>
              <Box sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>Admin Panel</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Administrator</Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { 
            sm: isDrawerCollapsed ? miniDrawerWidth : drawerWidth 
          }, 
          flexShrink: { sm: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: isDrawerCollapsed ? miniDrawerWidth : drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: 'none',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          width: { 
            sm: `calc(100% - ${isDrawerCollapsed ? miniDrawerWidth : drawerWidth}px)` 
          },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 56 } }} />
        <Container maxWidth="xl" sx={{ mt: 1, px: { xs: 1, sm: 2 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout; 