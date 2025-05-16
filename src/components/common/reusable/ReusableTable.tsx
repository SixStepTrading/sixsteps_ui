import React, { useContext } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import { SidebarContext } from '../../../contexts/SidebarContext';

export interface Column {
  id: string;
  label: string;
  width: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  info?: string;
}

export interface TableBadge {
  label: string;
  value: string | number;
}

interface TableProps {
  title?: string;
  titleAction?: React.ReactNode;
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
  headerBadge?: TableBadge;
  minWidth?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (column: string, direction: 'asc' | 'desc' | null) => void;
  emptyMessage?: string;
}

export interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top' }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className={`absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-800 text-white text-xs rounded p-2 max-w-xs ${
        position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-1' :
        position === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' :
        position === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-1' :
        'left-full top-1/2 transform -translate-y-1/2 ml-1'
      }`}>
        {text}
      </div>
    </div>
  );
};

const ReusableTable: React.FC<TableProps> = ({
  title,
  titleAction,
  columns,
  data,
  renderRow,
  page = 1,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  headerBadge,
  minWidth = 'min-w-[1000px]',
  sortBy,
  sortDirection,
  onSort,
  emptyMessage = 'No data to display'
}) => {
  const sidebarContext = useContext(SidebarContext);
  const isDrawerCollapsed = sidebarContext?.isDrawerCollapsed || false;

  const handlePageChange = (value: number) => {
    onPageChange(value);
  };

  const handleSort = (column: string) => {
    if (!onSort) return;
    
    let newDirection: 'asc' | 'desc' | null = 'asc';
    if (sortBy === column) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
      else newDirection = 'asc';
    }
    
    onSort(column, newDirection);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <span className="ml-1 text-gray-300">↕</span>;
    }
    
    if (sortDirection === 'asc') {
      return <span className="ml-1 text-blue-600">↑</span>;
    }
    
    if (sortDirection === 'desc') {
      return <span className="ml-1 text-blue-600">↓</span>;
    }
    
    return <span className="ml-1 text-gray-300">↕</span>;
  };

  // Calculate pagination
  const totalItems = totalCount || data.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedData = totalCount ? data : data.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  return (
    <div className="w-full flex flex-col gap-1 mb-8">
      {/* Optional header with title and badge */}
      {(title || headerBadge || titleAction) && (
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center">
            {title && <h2 className="text-lg font-medium text-gray-800">{title}</h2>}
            {headerBadge && (
              <div className="ml-3 text-xs text-slate-600 bg-blue-50 px-3 py-1 rounded flex items-center">
                <span className="font-medium">{headerBadge.label}:</span>
                <span className="ml-1 font-semibold text-blue-600">{headerBadge.value}</span>
              </div>
            )}
          </div>
          {titleAction && (
            <div>{titleAction}</div>
          )}
        </div>
      )}
      
      {/* Table container with horizontal scroll */}
      <div className="overflow-x-auto w-full">
        <div className={`${isDrawerCollapsed ? minWidth : minWidth}`}>
          {/* Header columns */}
          <div className="flex items-center px-4 py-3 text-xs uppercase text-slate-500 font-semibold tracking-wider bg-gray-50 rounded-t-lg my-1.5 border-b border-gray-200">
            {columns.map((column) => (
              <div 
                key={column.id} 
                className={`${column.width} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} ${column.sortable ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={() => column.sortable && handleSort(column.id)}
              >
                <div className="flex items-center">
                  {column.info ? (
                    <Tooltip text={column.info} position="top">
                      <div className="flex items-center">
                        <span>{column.label}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </Tooltip>
                  ) : (
                    <span>{column.label}</span>
                  )}
                  {column.sortable && renderSortIcon(column.id)}
                </div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="rounded-b-lg">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => renderRow(item, idx + 1 + (page - 1) * rowsPerPage))
            ) : (
              <div className="py-6 text-center text-gray-500">{emptyMessage}</div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {(totalCount || data.length) > rowsPerPage && (
        <div className="flex justify-center py-4 mt-2">
          <div className="flex items-center space-x-1 bg-white px-4 py-2 rounded-lg shadow-sm">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`p-2 rounded ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
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
              disabled={page === totalPages}
              className={`p-2 rounded ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReusableTable;