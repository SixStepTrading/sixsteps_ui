import React, { useState, useMemo } from 'react';
import NotificationItem, { 
  NotificationItemProps,
  NotificationType,
  NotificationPriority
} from '../atoms/NotificationItem';

export interface NotificationListProps {
  notifications: Omit<NotificationItemProps, 'onMarkAsRead'>[];
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Function to calculate relative time (e.g. "5 minutes ago")
const getRelativeTime = (timestamp: string): string => {
  // If it's already in relative format, return it as is
  if (timestamp.includes('ago') || 
      timestamp.includes('minutes') || 
      timestamp.includes('hours') || 
      timestamp.includes('days') ||
      timestamp === 'Yesterday' ||
      timestamp === 'Just now') {
    return timestamp;
  }
  
  // Otherwise, try to convert the date
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      // Format date as MM/DD/YYYY for older notifications
      return date.toLocaleDateString();
    }
  } catch (e) {
    return timestamp;
  }
};

type SortOrder = 'newest' | 'oldest' | 'priority';
type FilterTab = 'all' | 'unread' | 'read';

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onDelete
}) => {
  // Local state for tabs
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  
  // Badge counts
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  );
  
  const readCount = useMemo(() => 
    notifications.filter(n => n.isRead).length,
    [notifications]
  );
  
  // Calculate filtered notifications based on tab selection
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    
    // Filter by tab (all, unread, read)
    if (activeTab === 'unread') {
      result = result.filter(notification => !notification.isRead);
    } else if (activeTab === 'read') {
      result = result.filter(notification => notification.isRead);
    }
    
    return result;
  }, [notifications, activeTab]);

  // If there are no notifications, show a message
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-2">
          No notifications to display
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Tabs navigation */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${activeTab === 'all' ? 'bg-blue-100 text-blue-700 border-blue-300 z-10' : 'bg-white text-gray-600 border-gray-300'}`}
              onClick={() => setActiveTab('all')}
            >
              All <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${activeTab === 'unread' ? 'bg-blue-100 text-blue-700 border-blue-300 z-10' : 'bg-white text-gray-600 border-gray-300'}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${activeTab === 'read' ? 'bg-blue-100 text-blue-700 border-blue-300 z-10' : 'bg-white text-gray-600 border-gray-300'}`}
              onClick={() => setActiveTab('read')}
            >
              Read <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{readCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-auto divide-y divide-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No {activeTab === 'all' ? '' : activeTab} notifications available
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              {...notification}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              timestamp={getRelativeTime(notification.timestamp)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList; 