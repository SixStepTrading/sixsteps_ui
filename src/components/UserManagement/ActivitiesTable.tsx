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

  // Nuova barra filtri stile ProductTable
  const ActivityFiltersBar: React.FC<{
    filters: ActivityFilters;
    onFilterChange: (name: string, value: any) => void;
    actionTypes: string[];
    uniqueUsers: string[];
    onReset: () => void;
  }> = ({ filters, onFilterChange, actionTypes, uniqueUsers, onReset }) => (
    <div className="flex flex-wrap gap-2 items-center mb-6">
      <div className="relative max-w-xs w-full">
        <input
          type="text"
          placeholder="Search user..."
          value={filters.userName}
          onChange={e => onFilterChange('userName', e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 1010 17a7 7 0 004-4z" /></svg>
        </div>
      </div>
      <select value={filters.actionTypes[0] || ''} onChange={e => onFilterChange('actionTypes', e.target.value ? [e.target.value] : [])} className="border border-gray-300 rounded-md px-2 py-2 text-sm">
        <option value="">All Actions</option>
        {actionTypes.map(type => <option key={type} value={type}>{type}</option>)}
      </select>
      <select value={filters.dateRange} onChange={e => onFilterChange('dateRange', e.target.value)} className="border border-gray-300 rounded-md px-2 py-2 text-sm">
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="custom">Custom Range</option>
      </select>
      <button onClick={onReset} className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1">Reset</button>
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

  // Sorting icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600">↑</span>
      : <span className="ml-1 text-blue-600">↓</span>;
  };

  return (
    <>
      <ActivityFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        actionTypes={actionTypes}
        uniqueUsers={uniqueUsers}
        onReset={resetFilters}
      />
      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px]">
          <div className="flex items-center px-4 py-3 text-xs uppercase text-slate-500 font-semibold tracking-wider bg-gray-50 rounded-t-lg rounded-xl my-1.5 border-b border-gray-200">
          {columns.map((column) => (
            <div 
              key={column.id} 
                className={`${column.width} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} cursor-pointer select-none flex items-center`}
                onClick={() => {
                  if (!column.sortable) return;
                  if (sortBy === column.id) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  else { setSortBy(column.id); setSortDirection('asc'); }
                }}
              >
                <div className="flex items-center">
                  {column.info ? (
                    <span title={column.info}>{column.label}</span>
                  ) : (
                    <span>{column.label}</span>
                  )}
                  {column.sortable && renderSortIcon(column.id)}
                </div>
      </div>
            ))}
          </div>
          {/* Rows */}
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, idx) => (
              <div key={activity.id} className="bg-white rounded-xl my-1 hover:bg-blue-50 transition-colors duration-150">
                {renderRow(activity, idx + 1 + (page - 1) * rowsPerPage)}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-gray-500">No activities to display</div>
          )}
        </div>
    </div>
    </>
  );
};

export default ActivitiesTable; 