import React from 'react';
import { Badge, SvgIconProps, SxProps, Theme } from '@mui/material';

interface IconWithBadgeProps {
  icon: React.ReactElement<SvgIconProps>;
  badgeContent?: number;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  showZero?: boolean;
  sx?: SxProps<Theme>;
}

const IconWithBadge: React.FC<IconWithBadgeProps> = ({
  icon,
  badgeContent,
  color = 'error',
  showZero = false,
  sx
}) => {
  // Se non c'è badge content o è 0 e non vogliamo mostrare lo zero, mostriamo solo l'icona
  if (badgeContent === undefined || (badgeContent === 0 && !showZero)) {
    return React.cloneElement(icon, { sx });
  }
  
  return (
    <Badge 
      badgeContent={badgeContent} 
      color={color}
      sx={sx}
    >
      {icon}
    </Badge>
  );
};

export default IconWithBadge; 