import React from 'react';
import { Avatar, Box, Typography, SxProps, Theme } from '@mui/material';

interface UserAvatarProps {
  name: string;
  role?: string;
  avatarSrc?: string;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
  sx?: SxProps<Theme>;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  role,
  avatarSrc,
  size = 'medium',
  showInfo = true,
  sx
}) => {
  // Determina le dimensioni dell'avatar in base alla prop size
  const avatarSizes = {
    small: { width: 32, height: 32, fontSize: '0.75rem' },
    medium: { width: 40, height: 40, fontSize: '1rem' },
    large: { width: 48, height: 48, fontSize: '1.25rem' },
  };
  
  // Prendi le iniziali dal nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const initials = getInitials(name);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Avatar 
        src={avatarSrc} 
        sx={{ 
          ...avatarSizes[size],
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          fontWeight: 'medium',
        }}
      >
        {initials}
      </Avatar>
      
      {showInfo && (
        <Box sx={{ ml: 1.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'medium',
              fontSize: size === 'small' ? '0.75rem' : '0.875rem',
              lineHeight: 1.2
            }}
          >
            {name}
          </Typography>
          
          {role && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: size === 'small' ? '0.65rem' : '0.75rem',
                display: 'block',
                lineHeight: 1.2
              }}
            >
              {role}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UserAvatar; 