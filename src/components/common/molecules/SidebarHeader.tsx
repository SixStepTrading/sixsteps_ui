import React from 'react';
import { Box, Typography, IconButton, Divider, Tooltip } from '@mui/material';
import { KeyboardArrowLeft as CollapseIcon } from '@mui/icons-material';
import { UserAvatar } from '../atoms';

interface SidebarHeaderProps {
  logo: string;
  userName: string;
  userRole?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  avatarSrc?: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  logo,
  userName,
  userRole,
  isCollapsed,
  onToggleCollapse,
  avatarSrc
}) => {
  return (
    <>
      {/* Logo e controllo collasso */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between'
        }}
      >
        {!isCollapsed && (
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main', 
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {logo}
          </Typography>
        )}
        
        <Tooltip title={isCollapsed ? "Espandi menu" : "Comprimi menu"}>
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            edge={isCollapsed ? 'start' : 'end'}
            color="primary"
            sx={{
              border: '1px solid',
              borderColor: 'primary.light',
              bgcolor: 'primary.lighter',
              transition: 'transform 0.3s ease-in-out',
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              '&:hover': {
                bgcolor: 'primary.light',
              }
            }}
          >
            <CollapseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Info utente */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <UserAvatar
          name={userName}
          role={userRole}
          avatarSrc={avatarSrc}
          size={isCollapsed ? 'medium' : 'large'}
          showInfo={!isCollapsed}
          sx={{
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: isCollapsed ? 'center' : 'flex-start',
          }}
        />
      </Box>
      
      <Divider sx={{ my: 1 }} />
    </>
  );
};

export default SidebarHeader; 