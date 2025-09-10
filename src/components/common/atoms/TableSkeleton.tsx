import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 10, 
  columns = 8, 
  className = "" 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Header skeleton */}
      <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-dark-bg-tertiary rounded-t-lg border-b border-gray-200 dark:border-dark-border-primary mb-1">
        {Array.from({ length: columns }).map((_, index) => (
          <div 
            key={`header-${index}`}
            className={`h-4 bg-gray-300 dark:bg-gray-600 rounded ${
              index === 0 ? 'w-[4%]' : 
              index === 1 ? 'w-[13%] mx-2' :
              index === 2 ? 'w-[3%] mx-1' :
              index === 3 ? 'w-[20%] mx-2' :
              index === 4 ? 'w-[12%] mx-2' :
              index === 5 ? 'w-[10%] mx-2' :
              index === 6 ? 'w-[9%] mx-2' :
              'w-[21%] mx-2'
            }`}
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="flex items-center px-3 py-3 bg-white dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border-primary rounded-xl my-1 min-h-[60px]"
          style={{ animationDelay: `${rowIndex * 0.1}s` }}
        >
          {/* Checkbox + Row number */}
          <div className="w-[4%] flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>

          {/* Codes (EAN/Minsan) */}
          <div className="w-[13%] mx-2 space-y-1">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>

          {/* Product Image */}
          <div className="w-[3%] mx-1">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-md"></div>
          </div>

          {/* Product Name */}
          <div className="w-[20%] mx-2 space-y-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>

          {/* Public Price */}
          <div className="w-[12%] mx-2 space-y-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 ml-auto"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 ml-auto"></div>
          </div>

          {/* Quantity */}
          <div className="w-[10%] mx-2">
            <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-3/4 ml-auto"></div>
          </div>

          {/* Target Price */}
          <div className="w-[9%] mx-2">
            <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          </div>

          {/* Prices (skeleton for 3 price badges) */}
          <div className="w-[21%] mx-2 flex gap-1 justify-end">
            <div className="h-12 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-12 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-12 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>

          {/* Stock */}
          <div className="w-[8%] mx-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton; 