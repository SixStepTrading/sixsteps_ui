import React, { useState, useEffect, useCallback, useContext } from 'react';
import { NotificationItemProps, NotificationType } from '../atoms/NotificationItem';
import NotificationList from '../molecules/NotificationList';
import { SidebarContext } from '../../../contexts/SidebarContext';

// Manteniamo i dati mock esistenti
const mockNotifications: Omit<NotificationItemProps, 'onMarkAsRead'>[] = [
  {
    id: '1',
    title: 'Order Processing Complete',
    message: 'Order #1234 from City Healthcare Pharmacy has been processed and is ready for shipping.',
    timestamp: '10 minutes ago',
    isRead: false,
    type: 'order',
    priority: 'medium'
  },
  {
    id: '2',
    title: 'Stock Alert',
    message: 'Medication "Paracetamol 500mg" is running low. Current stock: 25 units.',
    timestamp: '1 hour ago',
    isRead: false,
    type: 'inventory',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Delivery Confirmation',
    message: 'Order #9876 has been delivered to Downtown Medical Center. Delivery confirmed by John Smith.',
    timestamp: '3 hours ago',
    isRead: true,
    type: 'shipping',
    priority: 'low'
  },
  {
    id: '4',
    title: 'New Account Created',
    message: 'Healthcare Plus Pharmacy has created a new account and is waiting for approval.',
    timestamp: 'Yesterday',
    isRead: true,
    type: 'user',
    priority: 'medium'
  },
  {
    id: '5',
    title: 'System Update Available',
    message: 'A new update (v2.4.0) is available for the inventory management system. New features include batch processing and advanced analytics.',
    timestamp: '2 days ago',
    isRead: true,
    type: 'system',
    priority: 'medium'
  },
  {
    id: '6',
    title: 'Security Alert',
    message: 'Multiple failed login attempts detected from IP 192.168.1.34. Please verify system security.',
    timestamp: '3 days ago',
    isRead: false,
    type: 'alert',
    priority: 'urgent'
  }
];

interface NotificationsPanelProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onNotificationsChange?: (count: number) => void;
}

// Componente per le preferenze delle notifiche
interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  showBadges: boolean;
  autoRead: boolean;
  typePreferences: {
    [key in NotificationType]?: {
      enabled: boolean;
      soundEnabled: boolean;
    };
  };
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  anchorEl,
  open,
  onClose,
  onNotificationsChange
}) => {
  const { isDrawerCollapsed } = useContext(SidebarContext);
  const sidebarWidth = isDrawerCollapsed ? 72 : 240;
  const [notifications, setNotifications] = useState<Omit<NotificationItemProps, 'onMarkAsRead'>[]>(mockNotifications);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    soundEnabled: true,
    desktopNotifications: false,
    showBadges: true,
    autoRead: false,
    typePreferences: {
      order: { enabled: true, soundEnabled: true },
      shipping: { enabled: true, soundEnabled: true },
      inventory: { enabled: true, soundEnabled: true },
      user: { enabled: true, soundEnabled: false },
      system: { enabled: true, soundEnabled: false },
      alert: { enabled: true, soundEnabled: true }
    }
  });

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
  
  // Elimina una notifica
  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  // Elimina tutte le notifiche
  const handleClearAllNotifications = () => {
    setNotifications([]);
  };
  
  // Simulazione di aggiornamento delle notifiche
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simuliamo un'operazione asincrona
    setTimeout(() => {
      // Aggiungiamo una nuova notifica in cima
      const newNotification: Omit<NotificationItemProps, 'onMarkAsRead'> = {
        id: `new-${Date.now()}`,
        title: 'New Notification',
        message: 'This is a fresh notification that was just loaded.',
        timestamp: 'Just now',
        isRead: false,
        type: Math.random() > 0.5 ? 'inventory' : 'order',
        priority: Math.random() > 0.7 ? 'high' : 'medium'
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setRefreshing(false);
    }, 1500);
  }, []);
  
  // Gestione menu delle opzioni
  const handleMoreMenuToggle = () => {
    setMoreMenuOpen(!moreMenuOpen);
  };
  
  // Gestione delle preferenze
  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleTypePreferenceChange = (
    type: NotificationType, 
    key: 'enabled' | 'soundEnabled', 
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      typePreferences: {
        ...prev.typePreferences,
        [type]: {
          ...prev.typePreferences[type],
          [key]: value
        }
      }
    }));
  };

  // Se il pannello è chiuso, non renderiamo nulla
  if (!open) return null;
  
  return (
    <div 
      className="fixed right-0 top-0 h-full max-w-md w-full bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col"
      style={{ 
        left: `${sidebarWidth}px`, 
        width: 'calc(100% - 350px - ' + sidebarWidth + 'px)',
        maxWidth: '400px'
      }}
    >
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
          <div className="flex space-x-1">
            <button 
              className="p-1 hover:bg-gray-100 rounded-full"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${refreshing ? 'animate-spin text-blue-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              className="p-1 hover:bg-gray-100 rounded-full"
              onClick={() => setShowSettings(!showSettings)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <div className="relative">
              <button 
                className="p-1 hover:bg-gray-100 rounded-full"
                onClick={handleMoreMenuToggle}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-md py-1 z-10">
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                    onClick={() => {
                      handleMarkAllAsRead();
                      setMoreMenuOpen(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Mark all as read
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                    onClick={() => {
                      handleMarkAllAsUnread();
                      setMoreMenuOpen(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Mark all as unread
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-red-600"
                    onClick={() => {
                      handleClearAllNotifications();
                      setMoreMenuOpen(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Clear all notifications
                  </button>
                  <button 
                    className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                    onClick={() => {
                      onClose();
                      setMoreMenuOpen(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                </div>
              )}
            </div>
            <button 
              className="p-1 hover:bg-gray-100 rounded-full"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {showSettings ? (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
            
            <div className="space-y-4">
              {/* General settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">General</h4>
                <div className="space-y-2">
                  {Object.entries({
                    enabled: 'Enable notifications',
                    soundEnabled: 'Enable sounds',
                    desktopNotifications: 'Show desktop notifications',
                    showBadges: 'Show notification badges',
                    autoRead: 'Mark as read when viewed'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={preferences[key as keyof NotificationPreferences] as boolean}
                          onChange={() => handlePreferenceChange(
                            key as keyof NotificationPreferences, 
                            !preferences[key as keyof NotificationPreferences]
                          )}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Notification type settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Types</h4>
                <div className="space-y-3">
                  {Object.entries({
                    order: 'Order Notifications',
                    shipping: 'Shipping Updates',
                    inventory: 'Inventory Alerts',
                    user: 'User Activity',
                    system: 'System Updates',
                    alert: 'Security Alerts'
                  }).map(([type, label]) => (
                    <div key={type} className="border rounded-md p-2 bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={preferences.typePreferences[type as NotificationType]?.enabled}
                            onChange={() => handleTypePreferenceChange(
                              type as NotificationType, 
                              'enabled', 
                              !preferences.typePreferences[type as NotificationType]?.enabled
                            )}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 pl-1">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-1 h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={preferences.typePreferences[type as NotificationType]?.soundEnabled}
                            onChange={() => handleTypePreferenceChange(
                              type as NotificationType, 
                              'soundEnabled', 
                              !preferences.typePreferences[type as NotificationType]?.soundEnabled
                            )}
                            disabled={!preferences.typePreferences[type as NotificationType]?.enabled}
                          />
                          <span>Play sound</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium text-gray-700 mr-2"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white"
                onClick={() => setShowSettings(false)}
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <NotificationList 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDeleteNotification}
          />
        )}
      </div>
      
      {/* Footer */}
      {!showSettings && (
        <div className="border-t border-gray-200 p-3 text-center">
          <button 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => setShowSettings(true)}
          >
            Manage notification settings
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel; 