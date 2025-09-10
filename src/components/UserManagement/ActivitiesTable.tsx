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
          <div className="space-y-1">
            <div className="font-medium">User Created:</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {created.name} {created.surname} ({created.email})
            </div>
          </div>
        );
      }
      break;

    case 'ADMIN_ACTION':
      if (activity.details.metadata?.customAction === 'PRODUCT_CSV_UPLOAD') {
        const meta = activity.details.metadata;
        return (
          <div className="space-y-1">
            <div className="font-medium">CSV Upload: {meta.fileName}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total: {meta.totalRows} | Created: {meta.created} | Updated: {meta.updated} | Errors: {meta.errors}
            </div>
          </div>
        );
      }
      break;

    case 'SUPPLY_CREATE':
      if (activity.details.changes?.created?.uploadResult) {
        const result = activity.details.changes.created.uploadResult;
        return (
          <div className="space-y-1">
            <div className="font-medium">Supply Upload</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Processed: {result.processedRows}/{result.totalRows} | 
              Created: {result.created} | Skipped: {result.skipped}
            </div>
            {!result.success && (
              <div className="text-xs text-red-600 dark:text-red-400">
                {result.message}
              </div>
            )}
          </div>
        );
      }
      break;

    case 'LOGIN_SUCCESS':
      return <span className="text-gray-400 italic">Successful login</span>;

    case 'LOGIN_FAILED':
      if (activity.details.metadata?.attemptedEmail) {
        return (
          <div className="space-y-1">
            <div className="font-medium text-red-600 dark:text-red-400">Failed login attempt</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Email: {activity.details.metadata.attemptedEmail}
            </div>
          </div>
        );
      }
      return <span className="text-red-500 italic">Login failed</span>;

    default:
      return (
        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-full truncate">
          {JSON.stringify(activity.details)}
        </div>
      );
  }

  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-full truncate">
      {JSON.stringify(activity.details)}
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
      <div className="bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg border dark:border-dark-border-primary">
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
          <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-secondary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="w-[5%] text-center">#</div>
            <div className="w-[25%] cursor-pointer select-none flex items-center" onClick={() => handleSort('user')}>
              User {renderSortIcon('user')}
            </div>
            <div className="w-[20%] cursor-pointer select-none flex items-center" onClick={() => handleSort('action')}>
              Action {renderSortIcon('action')}
            </div>
            <div className="w-[30%]">Details</div>
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
                    hover:bg-gray-50 dark:hover:bg-dark-bg-hover
                    relative
                    rounded-xl my-1.5
                  `}
                >
                  {/* Index */}
                  <div className="w-[5%] flex items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-dark-text-muted font-medium">{idx + 1}</span>
                  </div>
                  
                  {/* User */}
                  <div className="w-[25%]">
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
                  <div className="w-[20%]">
                    <span className={`${actionClasses.bg} ${actionClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {activity.action}
                    </span>
                  </div>
                  
                  {/* Details */}
                  <div className="w-[30%]">
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