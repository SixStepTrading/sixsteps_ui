import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Divider, 
  Tooltip, 
  Paper,
  Popper,
  Grow,
  ClickAwayListener,
  Switch,
  Stack,
  Button,
  alpha
} from '@mui/material';
import { 
  KeyboardArrowLeft as CollapseIcon, 
  KeyboardArrowDown as ArrowDownIcon,
  AdminPanelSettings as AdminIcon,
  ShoppingBag as BuyerIcon
} from '@mui/icons-material';
import { UserAvatar } from '../atoms';
import { useUser } from '../../../contexts/UserContext';

interface SidebarHeaderProps {
  logo: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  avatarSrc?: string;
  userName?: string;
  userRole?: string;
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
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Handle clicks on the user avatar
  const handleAvatarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Handle role switching
  const handleRoleSwitch = (newRole: 'Admin' | 'Buyer') => {
    setUserRole(newRole);
    handleClose();
  };

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
      
      {/* Profilo utente (migliorato) */}
      <Box 
        sx={{ 
          px: 2, 
          py: 1.5,
          position: 'relative'
        }}
      >
        <Box
          onClick={handleAvatarClick}
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            p: isCollapsed ? 0.5 : 1,
            borderRadius: 1.5,
            position: 'relative',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            '&:hover': {
              bgcolor: alpha('#4285F4', 0.08),
              '& .role-indicator': {
                boxShadow: '0 0 0 2px #fff, 0 0 0 4px currentColor'
              }
            }
          }}
          aria-describedby={open ? 'role-popper' : undefined}
        >
          <UserAvatar
            name={userName}
            role={isCollapsed ? undefined : userDescription}
            avatarSrc={avatarSrc}
            size={isCollapsed ? 'medium' : 'large'}
            showInfo={!isCollapsed}
            sx={{
              flexDirection: isCollapsed ? 'column' : 'row',
              alignItems: isCollapsed ? 'center' : 'flex-start',
            }}
          />

          {!isCollapsed && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                ml: 'auto', 
                color: 'text.secondary',
                fontSize: '0.8rem'
              }}
            >
              <Box 
                className="role-indicator"
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: userRole === 'Admin' ? 'error.main' : 'success.main',
                  color: userRole === 'Admin' ? 'error.main' : 'success.main',
                  mr: 0.5,
                  transition: 'all 0.2s'
                }}
              />
              <ArrowDownIcon 
                fontSize="small" 
                sx={{ 
                  fontSize: '1rem',
                  transition: 'transform 0.2s',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </Box>
          )}

          {isCollapsed && (
            <Tooltip title="Click per cambiare ruolo" placement="right">
              <Box 
                className="role-indicator"
                sx={{ 
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: userRole === 'Admin' ? 'error.main' : 'success.main',
                  color: userRole === 'Admin' ? 'error.main' : 'success.main',
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  zIndex: 1
                }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Role Selector Popper */}
        <Popper
          id="role-popper"
          open={open}
          anchorEl={anchorEl}
          placement={isCollapsed ? "right" : "bottom-start"}
          transition
          disablePortal={false}
          modifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                altAxis: true,
                altBoundary: true,
                boundary: document.body
              },
            },
          ]}
          sx={{ 
            zIndex: 1300,
            width: 'auto',
            minWidth: 240
          }}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              style={{ 
                transformOrigin: isCollapsed ? 'left center' : 'top left',
                marginLeft: isCollapsed ? '16px' : '0'
              }}
            >
              <Paper 
                elevation={8}
                sx={{ 
                  p: 2,
                  mt: isCollapsed ? 0 : 0.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <ClickAwayListener onClickAway={handleClose}>
                  <Box>
                    {isCollapsed && (
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <UserAvatar
                          name={userName}
                          size="small"
                          avatarSrc={avatarSrc}
                          showInfo={false}
                        />
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userDescription}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 2, fontWeight: 500 }}
                    >
                      Seleziona Ruolo
                    </Typography>

                    {/* Role Toggle */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        mb: 2
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                          variant={userRole === 'Buyer' ? 'contained' : 'outlined'}
                          onClick={() => handleRoleSwitch('Buyer')}
                          startIcon={<BuyerIcon />}
                          color="primary"
                          fullWidth
                          sx={{ 
                            justifyContent: 'flex-start',
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: userRole === 'Buyer' ? 'primary.main' : 'transparent',
                            borderColor: userRole === 'Buyer' ? 'primary.main' : 'divider'
                          }}
                        >
                          Buyer
                        </Button>
                        
                        <Button
                          variant={userRole === 'Admin' ? 'contained' : 'outlined'}
                          onClick={() => handleRoleSwitch('Admin')}
                          startIcon={<AdminIcon />}
                          color="error"
                          fullWidth
                          sx={{ 
                            justifyContent: 'flex-start',
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: userRole === 'Admin' ? 'error.main' : 'transparent',
                            borderColor: userRole === 'Admin' ? 'error.main' : 'divider'
                          }}
                        >
                          Admin
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
      
      <Divider sx={{ my: 1 }} />
    </>
  );
};

export default SidebarHeader; 