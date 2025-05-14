import React, { useState, useContext } from 'react';
import { 
  Box, 
  IconButton, 
  Container, 
  Fab,
  useMediaQuery, 
  Toolbar,
  useTheme
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { SidebarContext } from '../contexts/SidebarContext';
import { ModernSidebar } from '../components/common/organisms';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDrawerCollapsed, toggleDrawer } = useContext(SidebarContext);
  
  // Costanti per le dimensioni del drawer
  const DRAWER_WIDTH = 240;
  const COLLAPSED_WIDTH = 72;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Width corrente del drawer
  const currentWidth = isDrawerCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box 
        sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
        }}
      >
      {/* Pulsante hamburger mobile */}
      {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
          sx={{
            position: 'fixed', 
            top: 16, 
            left: 16, 
            zIndex: 1300,
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[2],
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      
      {/* Sidebar moderno */}
      <ModernSidebar 
        isCollapsed={isDrawerCollapsed}
        onToggleCollapse={toggleDrawer}
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
        notificationCount={4}
      />
      
      {/* Contenuto principale */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { 
            xs: '100%',
            sm: `calc(100% - ${currentWidth}px)` 
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Spaziatura per compensare l'altezza della barra superiore in mobile */}
        {isMobile && <Toolbar sx={{ minHeight: { xs: 16 } }} />}
        
        {/* Contenitore principale */}
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: { xs: 3, sm: 4 }, 
            px: { xs: 2, sm: 3 },
            minHeight: '100vh'
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout; 