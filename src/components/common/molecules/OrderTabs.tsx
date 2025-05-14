import React from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  styled 
} from '@mui/material';

interface OrderTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: {
    id: string;
    label: string;
    count?: number;
  }[];
}

// Styled tab component
const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  padding: '12px 16px',
  '&.Mui-selected': {
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
}));

// Custom indicator for the tabs
const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

const OrderTabs: React.FC<OrderTabsProps> = ({
  currentTab,
  onTabChange,
  tabs
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onTabChange(newValue);
  };

  return (
    <Box sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      mb: 3
    }}>
      <StyledTabs
        value={currentTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="order categories"
      >
        {tabs.map((tab) => (
          <StyledTab 
            key={tab.id} 
            value={tab.id} 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {tab.label}
                {tab.count !== undefined && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      bgcolor: 'action.hover',
                      borderRadius: '12px',
                      px: 1,
                      py: 0.25,
                      fontSize: '0.75rem',
                      lineHeight: 1,
                    }}
                  >
                    {tab.count}
                  </Box>
                )}
              </Box>
            }
          />
        ))}
      </StyledTabs>
    </Box>
  );
};

export default OrderTabs; 