import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, FilterIcon, SearchIcon } from '@heroicons/react/outline';
import { UserActivity } from './ActivityTableRow';
import { ReusableTable, Column, TableRow, TableCellProps } from '../common/reusable';

// Custom SVG icons
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

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
  const handleSort = (column: string, direction: 'asc' | 'desc' | null) => {
    setSortBy(column);
    setSortDirection(direction);
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

  // Define columns for the table
  const columns: Column[] = [
    { id: 'user', label: 'User', width: 'w-1/5', sortable: true },
    { id: 'action', label: 'Action', width: 'w-[15%]', info: 'Type of activity performed by the user', sortable: true },
    { id: 'details', label: 'Details', width: 'w-1/4' },
    { id: 'dateTime', label: 'Date & Time', width: 'w-1/5', sortable: true },
    { id: 'ipAddress', label: 'IP Address', width: 'w-1/5', info: 'IP address where the action was performed', sortable: true }
  ];

  // Action color mapping
  const getActionColorClasses = (action: string) => {
    switch(action) {
      case 'Login': return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'Order Created': return { bg: 'bg-green-50', text: 'text-green-600' };
      case 'Product Update': return { bg: 'bg-orange-50', text: 'text-orange-600' };
      case 'Password Reset': return { bg: 'bg-red-50', text: 'text-red-600' };
      case 'User Created': return { bg: 'bg-purple-50', text: 'text-purple-600' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600' };
    }
  };

  // Render activity row
  const renderRow = (activity: UserActivity, index: number) => {
    const actionClasses = getActionColorClasses(activity.action);

    const cells: TableCellProps[] = [
      // User column
      {
        content: (
          <div className="text-sm font-medium">
            {activity.user}
          </div>
        ),
        width: 'w-1/5'
      },
      // Action column
      {
        content: (
          <span className={`${actionClasses.bg} ${actionClasses.text} inline-block py-1 px-3 rounded text-xs font-medium`}>
            {activity.action}
          </span>
        ),
        width: 'w-[15%]',
        tooltip: `Information about ${activity.action}`
      },
      // Details column
      {
        content: (
          <div className="text-sm truncate max-w-full">
            {activity.details}
          </div>
        ),
        width: 'w-1/4'
      },
      // Date & Time column
      {
        content: (
          <div className="text-sm text-gray-500">
            {activity.dateTime}
          </div>
        ),
        width: 'w-1/5'
      },
      // IP Address column
      {
        content: (
          <div className="text-sm font-mono">
            {activity.ipAddress}
          </div>
        ),
        width: 'w-1/5',
        tooltip: 'IP Information'
      }
    ];

    return <TableRow key={activity.id} cells={cells} />;
  };

  // Filters panel
  const FiltersPanel = () => (
    <div className={`mb-6 rounded-lg border border-gray-200 bg-white shadow-sm ${showFiltersPanel ? '' : 'hidden'}`}>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.userName}
              onChange={(e) => handleFilterChange('userName', e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search users..."
            />
            {filters.userName && (
              <button
                type="button"
                onClick={() => handleFilterChange('userName', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <CloseIcon />
              </button>
            )}
          </div>
          {uniqueUsers.length > 0 && filters.userName && (
            <div className="mt-1 bg-white border border-gray-300 rounded-md shadow-sm max-h-48 overflow-y-auto">
              {uniqueUsers
                .filter(user => user.toLowerCase().includes(filters.userName.toLowerCase()))
                .map(user => (
                  <div
                    key={user}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleFilterChange('userName', user)}
                  >
                    {user}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Action Type filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
          <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
            {actionTypes.map(actionType => {
              const isSelected = filters.actionTypes.includes(actionType);
              const actionClasses = getActionColorClasses(actionType);
              
              return (
                <div 
                  key={actionType}
                  className={`flex items-center justify-between p-1 my-1 rounded ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                  onClick={() => toggleActionType(actionType)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by the div click
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className={`${actionClasses.text} ml-2 text-xs font-medium`}>
                      {actionType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {activities.filter(a => a.action === actionType).length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-1.5 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full px-3 py-1.5 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between rounded-b-lg">
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm text-gray-700 hover:text-gray-900"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={() => setShowFiltersPanel(false)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
  
  // Title action with filter button and view all button
  const titleAction = (
    <div className="flex items-center space-x-4">
      <button 
        className="flex items-center text-blue-600 text-sm hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded"
        onClick={() => setShowFiltersPanel(!showFiltersPanel)}
      >
        <FilterIcon className="h-4 w-4 mr-1" />
        {activeFiltersCount > 0 
          ? `Filters (${activeFiltersCount})` 
          : 'Filter Activities'}
      </button>
      <button className="text-blue-600 flex items-center text-sm hover:text-blue-800 transition-colors">
        View Full Activity Log
        <ChevronDownIcon className="h-4 w-4 ml-1" />
      </button>
    </div>
  );

  // Use onPageChange if provided, or create a default handler
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <>
      <FiltersPanel />
      <ReusableTable
        title="Recent User Activity"
        titleAction={titleAction}
        columns={columns}
        data={filteredActivities}
        renderRow={renderRow}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        headerBadge={{ 
          label: activeFiltersCount > 0 ? 'Filtered Activities' : 'Total Activities', 
          value: filteredActivities.length 
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={handleSort}
        emptyMessage={activeFiltersCount > 0 ? "No activities match the current filters" : "No activities found"}
      />
    </>
  );
};

export default ActivitiesTable; 