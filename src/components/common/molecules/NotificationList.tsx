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
  // Local state for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [filterTypes, setFilterTypes] = useState<NotificationType[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<NotificationPriority[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Badge counts
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  );
  
  const readCount = useMemo(() => 
    notifications.filter(n => n.isRead).length,
    [notifications]
  );
  
  // Calculate filtered and sorted notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    
    // Filter by tab (all, unread, read)
    if (activeTab === 'unread') {
      result = result.filter(notification => !notification.isRead);
    } else if (activeTab === 'read') {
      result = result.filter(notification => notification.isRead);
    }
    
    // Filter by search text
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        notification => 
          notification.title.toLowerCase().includes(lowerSearchTerm) || 
          notification.message.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Filter by type
    if (filterTypes.length > 0) {
      result = result.filter(
        notification => notification.type && filterTypes.includes(notification.type)
      );
    }
    
    // Filter by priority
    if (filterPriorities.length > 0) {
      result = result.filter(
        notification => notification.priority && filterPriorities.includes(notification.priority)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        // For simplicity, we assume that more recent timestamps include "ago" or "Just now"
        const aRecent = a.timestamp.includes('ago') || a.timestamp === 'Just now';
        const bRecent = b.timestamp.includes('ago') || b.timestamp === 'Just now';
        if (aRecent && !bRecent) return -1;
        if (!aRecent && bRecent) return 1;
        return 0;
      } else if (sortOrder === 'oldest') {
        // Opposite of "newest"
        const aRecent = a.timestamp.includes('ago') || a.timestamp === 'Just now';
        const bRecent = b.timestamp.includes('ago') || b.timestamp === 'Just now';
        if (aRecent && !bRecent) return 1;
        if (!aRecent && bRecent) return -1;
        return 0;
      } else if (sortOrder === 'priority') {
        // By priority (urgent, high, medium, low)
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, undefined: 4 };
        const aPriority = priorityOrder[a.priority || 'undefined'];
        const bPriority = priorityOrder[b.priority || 'undefined'];
        return aPriority - bPriority;
      }
      return 0;
    });
    
    return result;
  }, [notifications, activeTab, searchTerm, filterTypes, filterPriorities, sortOrder]);
  
  // Available types and priorities in the notifications
  const availableTypes = useMemo(() => {
    const types = new Set<NotificationType>();
    notifications.forEach(n => {
      if (n.type) types.add(n.type);
    });
    return Array.from(types);
  }, [notifications]);
  
  const availablePriorities = useMemo(() => {
    const priorities = new Set<NotificationPriority>();
    notifications.forEach(n => {
      if (n.priority) priorities.add(n.priority);
    });
    return Array.from(priorities);
  }, [notifications]);
  
  const handleToggleFilterType = (type: NotificationType) => {
    setFilterTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };
  
  const handleToggleFilterPriority = (priority: NotificationPriority) => {
    setFilterPriorities(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority) 
        : [...prev, priority]
    );
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setFilterTypes([]);
    setFilterPriorities([]);
    setActiveTab('all');
    setSortOrder('newest');
  };
  
  const hasActiveFilters = 
    searchTerm !== '' || 
    filterTypes.length > 0 || 
    filterPriorities.length > 0 || 
    activeTab !== 'all' ||
    sortOrder !== 'newest';

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
      {/* Search bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchTerm('')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters and sorting */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="flex">
              <button
                className={`px-3 py-1 text-sm rounded-l-md border border-r-0 ${activeTab === 'all' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300'}`}
                onClick={() => setActiveTab('all')}
              >
                All <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{notifications.length}</span>
              </button>
              <button
                className={`px-3 py-1 text-sm border border-r-0 ${activeTab === 'unread' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300'}`}
                onClick={() => setActiveTab('unread')}
              >
                Unread <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-r-md border ${activeTab === 'read' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300'}`}
                onClick={() => setActiveTab('read')}
              >
                Read <span className="ml-1 text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">{readCount}</span>
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded border ${showFilters ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300'}`}
              title="Filter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center">
            <label className="text-xs text-gray-500 mr-2">Sort:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="text-sm border border-gray-300 rounded py-1 px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
        
        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={!hasActiveFilters}
              >
                Clear All
              </button>
            </div>
            
            {availableTypes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Filter by Type:</p>
                <div className="flex flex-wrap gap-1">
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleToggleFilterType(type)}
                      className={`text-xs px-2 py-1 rounded-full border ${filterTypes.includes(type) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {availablePriorities.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Filter by Priority:</p>
                <div className="flex flex-wrap gap-1">
                  {availablePriorities.map(priority => (
                    <button
                      key={priority}
                      onClick={() => handleToggleFilterPriority(priority)}
                      className={`text-xs px-2 py-1 rounded-full border ${filterPriorities.includes(priority) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
              Try adjusting your search or filter criteria
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Clear All Filters
              </button>
            )}
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