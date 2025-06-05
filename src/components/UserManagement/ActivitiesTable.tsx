import React, { useState, useEffect, useContext } from 'react';
import { UserActivity } from './ActivityTableRow';
import { SidebarContext } from '../../contexts/SidebarContext';

interface ActivitiesTableProps {
  activities: UserActivity[];
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
}

interface ActivityFilters {
  userName: string;
  actionTypes: string[];
  dateRange: string;
  startDate?: string;
  endDate?: string;
}

const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
  activities,
  page = 1,
  rowsPerPage = 5,
  onPageChange
}) => {
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // Get unique users from activities
  const uniqueUsers = Array.from(new Set(activities.map(activity => activity.user)));
  
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
  const [sortBy, setSortBy] = useState<string>('dateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Apply filters
  useEffect(() => {
    let result = [...activities];
    
    // Filter by user name
    if (filters.userName) {
      result = result.filter(activity => 
        activity.user.toLowerCase().includes(filters.userName.toLowerCase())
      );
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
          result = result.filter(activity => new Date(activity.dateTime) >= startDate);
          break;
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          result = result.filter(activity => {
            const activityDate = new Date(activity.dateTime);
            return activityDate >= startDate && activityDate <= endDate;
          });
          break;
        case 'last7days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          result = result.filter(activity => new Date(activity.dateTime) >= startDate);
          break;
        case 'last30days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          result = result.filter(activity => new Date(activity.dateTime) >= startDate);
          break;
        case 'custom':
          if (filters.startDate) {
            const customStartDate = new Date(filters.startDate);
            result = result.filter(activity => new Date(activity.dateTime) >= customStartDate);
          }
          if (filters.endDate) {
            const customEndDate = new Date(filters.endDate);
            customEndDate.setHours(23, 59, 59, 999);
            result = result.filter(activity => new Date(activity.dateTime) <= customEndDate);
          }
          break;
      }
    }
    
    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'dateTime') {
          comparison = new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
        } else if (sortBy === 'user') {
          comparison = a.user.localeCompare(b.user);
        } else if (sortBy === 'action') {
          comparison = a.action.localeCompare(b.action);
        } else if (sortBy === 'ipAddress') {
          comparison = a.ipAddress.localeCompare(b.ipAddress);
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

  // Pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredActivities.length / rowsPerPage);

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
      <div className="flex items-center mb-2 px-2">
        <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded flex items-center border dark:border-blue-800/30">
          <span className="font-medium">Total Activities:</span>
          <span className="ml-1 font-semibold text-blue-600 dark:text-blue-300">{filteredActivities.length}</span>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto w-full overflow-y-visible">
        <div className={`${isDrawerCollapsed ? 'min-w-[900px]' : 'min-w-[1100px]'} transition-all duration-300`}>
          {/* Table header */}
          <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-secondary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="w-[5%] text-center">#</div>
            <div className="w-[20%] cursor-pointer select-none flex items-center" onClick={() => handleSort('user')}>
              User {renderSortIcon('user')}
            </div>
            <div className="w-[15%] cursor-pointer select-none flex items-center" onClick={() => handleSort('action')}>
              Action {renderSortIcon('action')}
            </div>
            <div className="w-[30%]">Details</div>
            <div className="w-[20%] cursor-pointer select-none flex items-center" onClick={() => handleSort('dateTime')}>
              Date & Time {renderSortIcon('dateTime')}
            </div>
            <div className="w-[10%] cursor-pointer select-none flex items-center" onClick={() => handleSort('ipAddress')}>
              IP Address {renderSortIcon('ipAddress')}
            </div>
          </div>
          
          {/* Table rows */}
          {paginatedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-card rounded-xl shadow dark:shadow-dark-md border border-slate-100 dark:border-dark-border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">No activities found</h3>
              <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            paginatedActivities.map((activity, idx) => {
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
                    <span className="text-xs text-gray-600 dark:text-dark-text-muted font-medium">{startIndex + idx + 1}</span>
                  </div>
                  
                  {/* User */}
                  <div className="w-[20%]">
                    <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary">
                      {activity.user}
                    </span>
                  </div>
                  
                  {/* Action */}
                  <div className="w-[15%]">
                    <span className={`${actionClasses.bg} ${actionClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {activity.action}
                    </span>
                  </div>
                  
                  {/* Details */}
                  <div className="w-[30%]">
                    <span className="text-sm text-slate-700 dark:text-dark-text-secondary">
                      {activity.details}
                    </span>
                  </div>
                  
                  {/* Date & Time */}
                  <div className="w-[20%]">
                    <span className="text-sm text-gray-500 dark:text-dark-text-muted">
                      {activity.dateTime}
                    </span>
                  </div>
                  
                  {/* IP Address */}
                  <div className="w-[10%]">
                    <span className="text-sm text-gray-500 dark:text-dark-text-muted font-mono">
                      {activity.ipAddress}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-dark-border-primary bg-white dark:bg-dark-bg-card px-4 py-3 sm:px-6 rounded-b-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-dark-border-primary bg-white dark:bg-dark-bg-secondary px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-dark-border-primary bg-white dark:bg-dark-bg-secondary px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-dark-text-secondary">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filteredActivities.length)}</span> of{' '}
                <span className="font-medium">{filteredActivities.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-dark-text-muted ring-1 ring-inset ring-gray-300 dark:ring-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-hover focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => onPageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === i + 1
                        ? 'bg-blue-600 dark:bg-blue-700 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 dark:text-dark-text-primary ring-1 ring-inset ring-gray-300 dark:ring-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-hover focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-dark-text-muted ring-1 ring-inset ring-gray-300 dark:ring-dark-border-primary hover:bg-gray-50 dark:hover:bg-dark-bg-hover focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesTable; 