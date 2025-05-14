import React, { useState, useEffect } from 'react';
import { 
  Popover, 
  Paper, 
  Divider, 
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { NotificationList } from '../molecules';
import { NotificationItemProps } from '../atoms/NotificationItem';

// Mock notifications for demonstration
const mockNotifications: Omit<NotificationItemProps, 'onMarkAsRead'>[] = [
  {
    id: '1',
    title: 'Order Processing Complete',
    message: 'Order #1234 from City Healthcare Pharmacy has been processed and is ready for shipping.',
    timestamp: '10 minutes ago',
    isRead: false
  },
  {
    id: '2',
    title: 'Stock Alert',
    message: 'Medication "Paracetamol 500mg" is running low. Current stock: 25 units.',
    timestamp: '1 hour ago',
    isRead: false
  },
  {
    id: '3',
    title: 'Delivery Confirmation',
    message: 'Order #9876 has been delivered to Downtown Medical Center. Delivery confirmed by John Smith.',
    timestamp: '3 hours ago',
    isRead: true
  },
  {
    id: '4',
    title: 'New Account Created',
    message: 'Healthcare Plus Pharmacy has created a new account and is waiting for approval.',
    timestamp: 'Yesterday',
    isRead: true
  },
  {
    id: '5',
    title: 'System Update Completed',
    message: 'The inventory management system has been updated to version 2.4.0. New features available.',
    timestamp: '2 days ago',
    isRead: true
  }
];

interface NotificationsPanelProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onNotificationsChange?: (count: number) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  anchorEl,
  open,
  onClose,
  onNotificationsChange
}) => {
  const [notifications, setNotifications] = useState<Omit<NotificationItemProps, 'onMarkAsRead'>[]>(mockNotifications);

  // Calculate the number of unread notifications and notify the parent component
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    onNotificationsChange?.(unreadCount);
  }, [notifications, onNotificationsChange]);

  // Mark a notification as read/unread
  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id 
        ? { ...notification, isRead: !notification.isRead } 
        : notification
    ));
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: true
    })));
  };

  // Mark all notifications as unread
  const handleMarkAllAsUnread = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      isRead: false
    })));
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: 350,
          maxHeight: 500,
          mt: 1,
          boxShadow: 3,
          borderRadius: 1,
          overflow: 'hidden'
        }
      }}
    >
      <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column' }}>
        <NotificationList 
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onMarkAllAsUnread={handleMarkAllAsUnread}
        />
        <Divider />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '8px 16px' 
        }}>
          <Tooltip title="Notification settings">
            <IconButton size="small" onClick={() => console.log('Settings clicked')}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </Paper>
    </Popover>
  );
};

export default NotificationsPanel; 