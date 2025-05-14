import React from 'react';
import { 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Tooltip,
  SvgIconProps
} from '@mui/material';
import { Link } from 'react-router-dom';
import IconWithBadge from './IconWithBadge';

interface SidebarItemProps {
  icon: React.ReactElement<SvgIconProps>;
  text: string;
  to?: string;
  isSelected?: boolean;
  isCollapsed?: boolean;
  badgeContent?: number;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  text,
  to,
  isSelected = false,
  isCollapsed = false,
  badgeContent,
  onClick
}) => {
  const content = (
    <ListItemButton
      component={to ? Link : 'div'}
      to={to}
      onClick={onClick}
      selected={isSelected}
      sx={{
        py: 1,
        minHeight: 44,
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRadius: 1,
        my: 0.5,
        mx: isCollapsed ? 0.5 : 1,
        '&.Mui-selected': {
          backgroundColor: 'primary.light',
          color: 'primary.dark',
          '&:hover': {
            backgroundColor: 'primary.light',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '25%',
            height: '50%',
            width: 3,
            bgcolor: 'primary.main',
            borderRadius: '0 4px 4px 0'
          },
        },
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: isCollapsed ? 0 : 36,
          mr: isCollapsed ? 0 : 1,
          justifyContent: 'center',
          color: isSelected ? 'primary.main' : 'inherit',
        }}
      >
        <IconWithBadge 
          icon={icon} 
          badgeContent={badgeContent}
        />
      </ListItemIcon>
      
      {!isCollapsed && (
        <ListItemText
          primary={text}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: isSelected ? 'medium' : 'normal',
          }}
        />
      )}
    </ListItemButton>
  );

  // Wrappa con Tooltip solo se il menu è collassato
  return isCollapsed ? (
    <Tooltip title={text} placement="right" arrow>
      {content}
    </Tooltip>
  ) : content;
};

export default SidebarItem; 