import React, { useState, useContext, useEffect } from 'react';
import { SidebarContext } from '../contexts/SidebarContext';
import { ModernSidebar } from '../components/common/organisms';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDrawerCollapsed, toggleDrawer } = useContext(SidebarContext);
  
  // Constants for drawer dimensions
  const DRAWER_WIDTH = 240;
  const COLLAPSED_WIDTH = 72;

  // Check if the screen is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Current width of the drawer
  const currentWidth = isDrawerCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <div className="flex min-h-screen bg-gray-200">
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      
      {/* Modern Sidebar - already handles its own positioning */}
      <ModernSidebar 
        isCollapsed={isDrawerCollapsed}
        onToggleCollapse={toggleDrawer}
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
        notificationCount={4}
      />
      
      {/* Main content */}
      <main 
        className="flex-grow transition-all duration-300 ease-in-out"
        style={{
          width: isMobile ? '100%' : `calc(100% - ${currentWidth}px)`,
          marginLeft: isMobile ? 0 : `${currentWidth}px`
        }}
      >
        {/* Spacer for mobile view */}
        {isMobile && <div className="h-14 sm:h-0" />}
        
        {/* Main container */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-screen max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout; 