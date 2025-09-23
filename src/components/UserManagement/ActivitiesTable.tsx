import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserActivity } from './ActivityTableRow';
import { SidebarContext } from '../../contexts/SidebarContext';

interface ActivitiesTableProps {
  activities: UserActivity[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onDownloadCSV?: () => void;
}

interface ActivityFilters {
  userName: string;
  actionTypes: string[];
  dateRange: string;
  startDate?: string;
  endDate?: string;
}

// Helper function to format activity details
const formatActivityDetails = (activity: UserActivity): React.ReactNode => {
  if (!activity.details || Object.keys(activity.details).length === 0) {
    return <span className="text-gray-400 italic">No additional details</span>;
  }

  switch (activity.action) {
    case 'USER_CREATE':
      if (activity.details.changes?.created) {
        const created = activity.details.changes.created;
        return (
          <div className="space-y-1.5 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <div className="font-semibold text-green-700 dark:text-green-300 text-xs">User Created</div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
              <div className="font-medium">{created.name} {created.surname}</div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">Email:</span>
                <span className="font-mono text-xs">{created.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">Role:</span>
                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                  {created.role}
                </span>
              </div>
              {created.entity && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Entity:</span>
                  <span className="font-mono text-xs">{created.entity}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'USER_EDIT':
      if (activity.details.changes?.old && activity.details.changes?.new) {
        const oldData = activity.details.changes.old;
        const newData = activity.details.changes.new;
        
        // Find changed fields
        const changes: string[] = [];
        if (oldData.name !== newData.name || oldData.surname !== newData.surname) {
          changes.push(`Name: ${oldData.name} ${oldData.surname} → ${newData.name} ${newData.surname}`);
        }
        if (oldData.email !== newData.email) {
          changes.push(`Email: ${oldData.email} → ${newData.email}`);
        }
        if (oldData.role !== newData.role) {
          changes.push(`Role: ${oldData.role} → ${newData.role}`);
        }
        if (oldData.entity !== newData.entity) {
          changes.push(`Entity: ${oldData.entity || 'None'} → ${newData.entity || 'None'}`);
        }

        return (
          <div className="space-y-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">User Updated</div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {changes.length > 0 ? (
                <div className="space-y-1">
                  {changes.map((change, index) => (
                    <div key={index} className="font-mono text-xs bg-blue-100 dark:bg-blue-800/30 p-1 rounded">
                      {change}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="italic text-gray-500">No changes detected</div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'ADMIN_ACTION':
      if (activity.details.metadata?.customAction === 'PRODUCT_CSV_UPLOAD') {
        const meta = activity.details.metadata;
        return (
          <div className="space-y-1.5 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <div className="font-semibold text-purple-700 dark:text-purple-300 text-sm">CSV Upload</div>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
              <div className="font-medium">File: {meta.fileName}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="font-mono">{meta.totalRows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">{meta.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{meta.updated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Errors:</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{meta.errors}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      // Handle SUPPLY_CSV_UPLOAD_ADMIN
      if (activity.details.metadata?.customAction === 'SUPPLY_CSV_UPLOAD_ADMIN') {
        const meta = activity.details.metadata;
        const result = meta.uploadResult;
        return (
          <div className="space-y-1.5 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-200 dark:border-purple-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <div className="font-semibold text-purple-700 dark:text-purple-300 text-sm">Admin Supply Upload</div>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
              <div className="font-medium">Warehouse: {meta.warehouse || 'N/A'}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">Processed:</span>
                  <span className="font-mono">{result.processedRows}/{result.totalRows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">{result.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{result.updated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Skipped:</span>
                  <span className="font-mono text-yellow-600 dark:text-yellow-400">{result.skipped}</span>
                </div>
              </div>
              {!result.success && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-800/30">
                  <div className="font-medium">Error:</div>
                  <div>{result.message}</div>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  <div className="font-medium">Sample errors:</div>
                  <div className="max-h-20 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800/30">
                    {result.errors.slice(0, 3).map((error: string, index: number) => (
                      <div key={index} className="truncate">{error}</div>
                    ))}
                    {result.errors.length > 3 && (
                      <div className="italic">... and {result.errors.length - 3} more errors</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'SUPPLY_CREATE':
      if (activity.details.changes?.created?.uploadResult) {
        const result = activity.details.changes.created.uploadResult;
        return (
          <div className="space-y-1.5 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <div className="font-semibold text-orange-700 dark:text-orange-300 text-sm">Supply Upload</div>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">Processed:</span>
                  <span className="font-mono">{result.processedRows}/{result.totalRows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">{result.created}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{result.updated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Skipped:</span>
                  <span className="font-mono text-yellow-600 dark:text-yellow-400">{result.skipped}</span>
                </div>
              </div>
              {!result.success && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-800/30">
                  <div className="font-medium">Error:</div>
                  <div>{result.message}</div>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  <div className="font-medium">Sample errors:</div>
                  <div className="max-h-20 overflow-y-auto bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800/30">
                    {result.errors.slice(0, 3).map((error: string, index: number) => (
                      <div key={index} className="truncate">{error}</div>
                    ))}
                    {result.errors.length > 3 && (
                      <div className="italic">... and {result.errors.length - 3} more errors</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'SUPPLY_DELETE':
      if (activity.details.changes?.deleted) {
        const deleted = activity.details.changes.deleted;
        let message = "All supplies deleted successfully.";
        let entityInfo = "";
        
        // Handle both string and object cases
        if (typeof deleted === 'string') {
          message = deleted;
        } else if (typeof deleted === 'object' && deleted !== null) {
          if ('message' in deleted) {
            message = deleted.message;
          }
        }
        
        // Try to get entity information from the activity details
        if (activity.details.targetId) {
          entityInfo = `Target ID: ${activity.details.targetId}`;
        }
        
        return (
          <div className="space-y-1.5 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <div className="font-semibold text-red-700 dark:text-red-300 text-xs">Supply Deleted</div>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
              <div>{message}</div>
              {entityInfo && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Entity:</span>
                  <span className="font-mono text-xs">{entityInfo}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'LOGIN_SUCCESS':
      return (
        <div className="flex items-center space-x-1.5 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/30">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span className="text-green-600 dark:text-green-400 font-medium text-xs">Successful login</span>
        </div>
      );

    case 'LOGIN_FAILED':
      if (activity.details.metadata?.attemptedEmail) {
        return (
          <div className="space-y-1.5 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <div className="font-semibold text-red-700 dark:text-red-300 text-sm">Failed login attempt</div>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Email:</span>
                <span className="font-mono">{activity.details.metadata.attemptedEmail}</span>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-500 font-medium text-sm">Login failed</span>
        </div>
      );

    case 'USER_DELETE':
      if (activity.details.changes?.deleted) {
        const deleted = activity.details.changes.deleted;
        return (
          <div className="space-y-1.5 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <div className="font-semibold text-red-700 dark:text-red-300 text-sm">User Deleted</div>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
              <div className="font-medium">{deleted.name} {deleted.surname}</div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Email:</span>
                <span className="font-mono">{deleted.email}</span>
              </div>
            </div>
          </div>
        );
      }
      break;

    case 'ENTITY_CREATE':
      if (activity.details.changes?.created) {
        const created = activity.details.changes.created;
        return (
          <div className="space-y-1.5 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <div className="font-semibold text-green-700 dark:text-green-300 text-sm">Entity Created</div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
              <div className="font-medium">{created.name}</div>
              {created.description && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Description:</span>
                  <span>{created.description}</span>
                </div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'ENTITY_EDIT':
      if (activity.details.changes?.old && activity.details.changes?.new) {
        const oldData = activity.details.changes.old;
        const newData = activity.details.changes.new;
        
        const changes: string[] = [];
        if (oldData.name !== newData.name) {
          changes.push(`Name: ${oldData.name} → ${newData.name}`);
        }
        if (oldData.description !== newData.description) {
          changes.push(`Description: ${oldData.description || 'None'} → ${newData.description || 'None'}`);
        }

        return (
          <div className="space-y-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Entity Updated</div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {changes.length > 0 ? (
                <div className="space-y-1">
                  {changes.map((change, index) => (
                    <div key={index} className="font-mono text-xs bg-blue-100 dark:bg-blue-800/30 p-1 rounded">
                      {change}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="italic text-gray-500">No changes detected</div>
              )}
            </div>
          </div>
        );
      }
      break;

    case 'ENTITY_DELETE':
      if (activity.details.changes?.deleted) {
        const deleted = activity.details.changes.deleted;
        let message = "Entity deleted successfully.";
        if (typeof deleted === 'string') {
          message = deleted;
        }
        return (
          <div className="space-y-1.5 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800/30">
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <div className="font-semibold text-red-700 dark:text-red-300 text-sm">Entity Deleted</div>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              <div>{message}</div>
            </div>
          </div>
        );
      }
      break;

    default:
      // For unknown actions, try to format the details in a readable way
      if (activity.details.metadata) {
        return (
          <div className="space-y-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700/30">
            <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Action Details</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {Object.entries(activity.details.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-medium">{key}:</span>
                  <span className="ml-2 font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      return (
        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-full truncate p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700/30">
          {JSON.stringify(activity.details, null, 2)}
        </div>
      );
  }

  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-full truncate p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700/30">
      {JSON.stringify(activity.details, null, 2)}
    </div>
  );
};

const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
  activities,
  loading = false,
  hasMore = false,
  onLoadMore,
  onDownloadCSV
}) => {
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // Get unique users from activities
  const uniqueUsers = Array.from(new Set(activities.map(activity => `${activity.user.name} ${activity.user.surname}`)));
  
  // Generate unique action types from the activities data
  const actionTypes = Array.from(new Set(activities.map(activity => activity.action)));

  // State for filters
  const [filters, setFilters] = useState<ActivityFilters>({
    userName: '',
    actionTypes: [],
    dateRange: 'all'
  });
  
  // State for showing filter dropdown
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  // State for filtered activities
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>(activities);
  
  // Sort options
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Apply filters
  useEffect(() => {
    let result = [...activities];
    
    // Filter by user name
    if (filters.userName) {
      result = result.filter(activity => {
        const fullName = `${activity.user.name} ${activity.user.surname}`;
        return fullName.toLowerCase().includes(filters.userName.toLowerCase());
      });
    }
    
    // Filter by action types
    if (filters.actionTypes.length > 0) {
      result = result.filter(activity => 
        filters.actionTypes.includes(activity.action)
      );
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          result = result.filter(activity => activity.timestamp >= startDate.getTime());
          break;
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          result = result.filter(activity => {
            return activity.timestamp >= startDate.getTime() && activity.timestamp <= endDate.getTime();
          });
          break;
        case 'last7days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          result = result.filter(activity => activity.timestamp >= startDate.getTime());
          break;
        case 'last30days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          result = result.filter(activity => activity.timestamp >= startDate.getTime());
          break;
        case 'custom':
          if (filters.startDate) {
            const customStartDate = new Date(filters.startDate);
            result = result.filter(activity => activity.timestamp >= customStartDate.getTime());
          }
          if (filters.endDate) {
            const customEndDate = new Date(filters.endDate);
            customEndDate.setHours(23, 59, 59, 999);
            result = result.filter(activity => activity.timestamp <= customEndDate.getTime());
          }
          break;
      }
    }
    
    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'timestamp') {
          comparison = a.timestamp - b.timestamp;
        } else if (sortBy === 'user') {
          const aFullName = `${a.user.name} ${a.user.surname}`;
          const bFullName = `${b.user.name} ${b.user.surname}`;
          comparison = aFullName.localeCompare(bFullName);
        } else if (sortBy === 'action') {
          comparison = a.action.localeCompare(b.action);
        } else if (sortBy === 'ip') {
          comparison = a.ip.localeCompare(b.ip);
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    setFilteredActivities(result);
  }, [activities, filters, sortBy, sortDirection]);

  // Handle sort change
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle action type filter
  const toggleActionType = (actionType: string) => {
    setFilters(prev => {
      const newActionTypes = prev.actionTypes.includes(actionType)
        ? prev.actionTypes.filter(type => type !== actionType)
        : [...prev.actionTypes, actionType];
      
      return {
        ...prev,
        actionTypes: newActionTypes
      };
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      userName: '',
      actionTypes: [],
      dateRange: 'all'
    });
  };

  // Count active filters
  const activeFiltersCount = 
    (filters.userName ? 1 : 0) + 
    (filters.actionTypes.length > 0 ? 1 : 0) + 
    (filters.dateRange !== 'all' ? 1 : 0);

  // Action color mapping
  const getActionColorClasses = (action: string) => {
    switch(action) {
      case 'Login': return { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
      case 'Order Created': return { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
      case 'Product Update': return { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' };
      case 'Password Reset': return { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
      case 'User Created': return { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
      default: return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
    }
  };

  // Infinite scroll logic using window scroll
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, loading]);

  // Sorting icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600 dark:text-blue-400">↑</span>
      : <span className="ml-1 text-blue-600 dark:text-blue-400">↓</span>;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Filter Panel */}
      <div className="bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-md border dark:border-dark-border-primary">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">Filters</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount} active
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 dark:text-dark-text-muted hover:text-blue-600 dark:hover:text-blue-400"
            >
              Reset all
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Name Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              User Name
            </label>
            <input
              type="text"
              placeholder="Search by user name..."
              value={filters.userName}
              onChange={(e) => handleFilterChange('userName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-md text-sm bg-white dark:bg-dark-bg-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary rounded-md text-sm bg-white dark:bg-dark-bg-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
            </select>
          </div>
          
          {/* Action Types Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Action Types
            </label>
            <div className="flex flex-wrap gap-1">
              {actionTypes.map(type => (
                <button
                  key={type}
                  onClick={() => toggleActionType(type)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    filters.actionTypes.includes(type)
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-dark-bg-card text-gray-600 dark:text-dark-text-muted border-gray-300 dark:border-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-hover'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity counter */}
    <div className="flex items-center justify-between mb-2 px-2">
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded flex items-center border dark:border-blue-800/30">
          <span className="font-medium">Total Activities:</span>
          <span className="ml-1 font-semibold text-blue-600 dark:text-blue-300">{activities.length}</span>
        </div>
        {activeFiltersCount > 0 && (
          <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded flex items-center border dark:border-green-800/30">
            <span className="font-medium">Filtered:</span>
            <span className="ml-1 font-semibold text-green-600 dark:text-green-300">{filteredActivities.length}</span>
          </div>
        )}
      </div>
      
      {/* Download CSV Button */}
      {onDownloadCSV && (
        <button
          onClick={onDownloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          title="Download logs as CSV"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download CSV
        </button>
      )}
      </div>

      {/* Table container */}
      <div 
        ref={containerRef}
        className="overflow-x-auto w-full"
      >
        <div className={`${isDrawerCollapsed ? 'min-w-[800px]' : 'min-w-[1000px]'} transition-all duration-300`}>
          {/* Table header */}
          <div className="flex items-center px-4 py-2.5 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-secondary rounded-t-lg border-b border-gray-200 dark:border-dark-border-primary">
            <div className="w-[3%] text-center">#</div>
            <div className="w-[20%] cursor-pointer select-none flex items-center" onClick={() => handleSort('user')}>
              User {renderSortIcon('user')}
            </div>
            <div className="w-[12%] cursor-pointer select-none flex items-center" onClick={() => handleSort('action')}>
              Action {renderSortIcon('action')}
            </div>
            <div className="w-[45%]">Details</div>
            <div className="w-[20%] cursor-pointer select-none flex items-center" onClick={() => handleSort('timestamp')}>
              Date & Time {renderSortIcon('timestamp')}
            </div>
          </div>
          
          {/* Table rows */}
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-card rounded-xl shadow dark:shadow-dark-md border border-slate-100 dark:border-dark-border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">No activities found</h3>
              <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
              filteredActivities.map((activity, idx) => {
              const actionClasses = getActionColorClasses(activity.action);
              
              return (
                <div 
                  key={activity.id}
                  className={`
                    flex items-center px-3 py-3 bg-white dark:bg-dark-bg-card border border-gray-100 dark:border-dark-border-primary
                    hover:bg-blue-50 dark:hover:bg-blue-900/20
                    relative
                    rounded-xl my-1.5
                  `}
                >
                  {/* Index */}
                  <div className="w-[3%] flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted font-medium">{idx + 1}</span>
                  </div>
                  
                  {/* User */}
                  <div className="w-[20%]">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary">
                        {activity.user.name} {activity.user.surname}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                        {activity.user.email}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="w-[12%]">
                    <span className={`${actionClasses.bg} ${actionClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {activity.action}
                    </span>
                  </div>
                  
                  {/* Details */}
                  <div className="w-[45%] pr-4">
                    <div className="text-sm text-slate-700 dark:text-dark-text-secondary">
                      {formatActivityDetails(activity)}
                    </div>
                  </div>
                  
                  {/* Date & Time */}
                  <div className="w-[20%]">
                    <span className="text-sm text-gray-500 dark:text-dark-text-muted">
                      {activity.formattedDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Loading indicator for infinite scroll */}
      {loading && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200 dark:border-dark-border-primary bg-white dark:bg-dark-bg-card rounded-b-lg">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-dark-text-muted">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
            <span className="text-sm">Loading more activities...</span>
          </div>
        </div>
      )}
      
      {/* No more data indicator */}
      {!hasMore && filteredActivities.length > 0 && (
        <div className="flex items-center justify-center py-3 border-t border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-secondary rounded-b-lg">
          <span className="text-xs text-gray-500 dark:text-dark-text-muted">
            No more activities to load
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivitiesTable; 