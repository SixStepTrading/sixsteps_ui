import React from 'react';
import { InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/outline';
import ActivityTableRow, { UserActivity } from './ActivityTableRow';

interface ActivitiesTableProps {
  activities: UserActivity[];
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
}

const ActivitiesTable: React.FC<ActivitiesTableProps> = ({
  activities,
  page = 1,
  rowsPerPage = 5,
  onPageChange
}) => {
  const handlePageChange = (value: number) => {
    if (onPageChange) {
      onPageChange(value);
    }
  };

  const paginatedActivities = activities.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  // Column headers matching the DeFi image
  const columns = [
    { id: 'user', label: 'User', width: 'w-1/5', info: false },
    { id: 'action', label: 'Action', width: 'w-[15%]', info: true },
    { id: 'details', label: 'Details', width: 'w-1/4', info: false },
    { id: 'dateTime', label: 'Date & Time', width: 'w-1/5', info: false },
    { id: 'ipAddress', label: 'IP Address', width: 'w-1/5', info: true }
  ];

  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
      {/* Table Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">
          Recent User Activity
        </h2>
        <button className="text-blue-600 flex items-center text-sm hover:text-blue-800 transition-colors">
          View Full Activity Log
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Column Headers */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3 border-b border-gray-100">
          {columns.map((column) => (
            <div 
              key={column.id} 
              className={`${column.width} px-2 flex items-center`}
            >
              <span className="text-gray-500 font-semibold text-xs uppercase tracking-wider">
                {column.label}
              </span>
              {column.info && (
                <div className="relative group ml-1">
                  <InformationCircleIcon className="h-4 w-4 text-blue-500 opacity-70" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
                    Information about {column.label}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table Rows - Each row is a separate component */}
      <div>
        {paginatedActivities.map((activity) => (
          <ActivityTableRow key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Pagination */}
      {activities.length > rowsPerPage && (
        <div className="flex justify-center py-4 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`p-2 rounded ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {[...Array(Math.ceil(activities.length / rowsPerPage))].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-3 py-1 rounded ${page === index + 1 ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil(activities.length / rowsPerPage)}
              className={`p-2 rounded ${page === Math.ceil(activities.length / rowsPerPage) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesTable; 