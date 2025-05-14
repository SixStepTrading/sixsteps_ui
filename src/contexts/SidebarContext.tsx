import React, { createContext, useState, ReactNode } from 'react';

interface SidebarContextProps {
  isDrawerCollapsed: boolean;
  toggleDrawer: () => void;
  setDrawerCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextProps>({
  isDrawerCollapsed: false,
  toggleDrawer: () => {},
  setDrawerCollapsed: () => {},
});

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };

  const setDrawerCollapsed = (collapsed: boolean) => {
    setIsDrawerCollapsed(collapsed);
  };

  return (
    <SidebarContext.Provider
      value={{
        isDrawerCollapsed,
        toggleDrawer,
        setDrawerCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}; 