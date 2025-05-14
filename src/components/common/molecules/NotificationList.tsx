import React from 'react';
import { 
  List, 
  Typography, 
  Box, 
  Divider,
  Button,
  Stack
} from '@mui/material';
import NotificationItem, { NotificationItemProps } from '../atoms/NotificationItem';

export interface NotificationListProps {
  notifications: Omit<NotificationItemProps, 'onMarkAsRead'>[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onMarkAllAsUnread: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onMarkAllAsUnread
}) => {
  // If there are no notifications, show a message
  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No notifications
        </Typography>
      </Box>
    );
  }

  const hasUnreadNotifications = notifications.some(notification => !notification.isRead);
  const hasReadNotifications = notifications.some(notification => notification.isRead);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2, py: 1 }}
      >
        <Typography variant="subtitle1">
          Notifications ({notifications.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          {hasUnreadNotifications && (
            <Button 
              size="small" 
              variant="text" 
              onClick={onMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
          {hasReadNotifications && (
            <Button 
              size="small" 
              variant="text" 
              onClick={onMarkAllAsUnread}
            >
              Mark all as unread
            </Button>
          )}
        </Stack>
      </Stack>
      <Divider />
      <List 
        sx={{ 
          width: '100%', 
          maxHeight: 400, 
          overflow: 'auto',
          px: 1
        }}
      >
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification.id}
            {...notification}
            onMarkAsRead={onMarkAsRead}
          />
        ))}
      </List>
    </>
  );
};

export default NotificationList; 