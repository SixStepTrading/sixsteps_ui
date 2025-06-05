import React, { useState } from 'react';

export type NotificationType = 
  | 'order'
  | 'shipping'
  | 'inventory'
  | 'user'
  | 'system'
  | 'alert';

export type NotificationPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actions?: Array<{
    label: string;
    onClick: () => void;
    type?: 'primary' | 'secondary' | 'danger';
  }>;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Type icon components using SVG icons
const TypeIcon: React.FC<{ type?: NotificationType; className?: string }> = ({ type, className = 'h-4 w-4' }) => {
  switch(type) {
    case 'order':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case 'shipping':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    case 'inventory':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'user':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'system':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'alert':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-red-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
};

// Function to get background color based on priority
const getPriorityColor = (priority?: NotificationPriority) => {
  switch(priority) {
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-500';
    case 'medium':
      return 'bg-green-100 text-green-800 border-green-500';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-500';
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-500';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-500';
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  title,
  message,
  timestamp,
  isRead,
  avatar,
  type,
  priority = 'medium',
  actions,
  onMarkAsRead,
  onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleExpandClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };

  const priorityColorClasses = getPriorityColor(priority);
  
  return (
    <div 
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          flex items-start p-3 relative overflow-hidden rounded mb-1 transition-all duration-200
          ${isRead ? 'bg-white dark:bg-dark-bg-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover' : `${priorityColorClasses.split(' ')[0]} dark:bg-dark-bg-tertiary hover:bg-opacity-20 dark:hover:bg-dark-bg-hover border-l-4 ${priorityColorClasses.split(' ')[2]} dark:border-l-blue-500`}
        `}
        onClick={handleExpandClick}
      >
        {/* Avatar */}
        <div className="mr-3">
          <div className={`
            relative w-10 h-10 rounded-full flex items-center justify-center
            ${avatar ? '' : priorityColorClasses.split(' ')[0] + ' dark:bg-dark-bg-accent'}
          `}>
            {avatar ? (
              <img src={avatar} alt={title} className="w-full h-full rounded-full object-cover" />
            ) : (
              <TypeIcon type={type} />
            )}
            {!isRead && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-white dark:border-dark-bg-secondary"></span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className={`text-sm ${isRead ? 'font-normal text-gray-900 dark:text-dark-text-primary' : 'font-medium text-gray-900 dark:text-dark-text-primary'} truncate`}>
              {title}
            </h3>
            <div className="flex items-center space-x-1">
              {(expanded || isHovered) && priority && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${priorityColorClasses}
                `}>
                  {priority}
                </span>
              )}
              {(expanded || isHovered) && type && (
                <span className="text-xs px-1.5 py-0.5 rounded-full border border-gray-300 dark:border-dark-border-primary flex items-center bg-white dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary">
                  <TypeIcon type={type} className="h-3 w-3 mr-1" /> {type}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-dark-text-muted mb-1">
            {message}
          </p>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-dark-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timestamp}
          </div>
          
          {/* Action buttons */}
          {(expanded || isHovered) && (
            <div className="flex items-center space-x-2 mt-2">
              {actions && actions.map((action, index) => (
                <button
                  key={index}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    action.type === 'primary' 
                      ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400' 
                      : action.type === 'danger'
                      ? 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-400'
                      : 'bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-dark-bg-hover'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                >
                  {action.label}
                </button>
              ))}
              
              {!isRead && (
                <button
                  className="text-xs px-2 py-1 rounded bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(id);
                  }}
                >
                  Mark as read
                </button>
              )}
              
              <button
                className="text-xs px-2 py-1 rounded bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) {
                    onDelete(id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem; 