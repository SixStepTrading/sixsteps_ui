import React from 'react';
import { 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircleOutline as CheckIcon,
  Circle as UnreadIcon 
} from '@mui/icons-material';

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  title,
  message,
  timestamp,
  isRead,
  avatar,
  onMarkAsRead
}) => {
  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        bgcolor: isRead ? 'transparent' : 'action.hover',
        borderRadius: 1,
        mb: 0.5,
        '&:hover': {
          bgcolor: 'action.selected',
        },
      }}
      secondaryAction={
        <Tooltip title={isRead ? "Mark as unread" : "Mark as read"}>
          <IconButton 
            edge="end" 
            aria-label="mark as read" 
            onClick={() => onMarkAsRead(id)}
            size="small"
          >
            {isRead ? 
              <CheckIcon color="success" fontSize="small" /> : 
              <UnreadIcon color="primary" fontSize="small" />
            }
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemAvatar>
        <Avatar src={avatar}>
          {!avatar && title[0].toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography 
            variant="subtitle2" 
            component="span" 
            fontWeight={isRead ? 'normal' : 'medium'}
          >
            {title}
          </Typography>
        }
        secondary={
          <Box>
            <Typography
              variant="body2"
              color="text.primary"
              component="span"
              sx={{
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}
            >
              {message}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              component="span"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {timestamp}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

export default NotificationItem; 