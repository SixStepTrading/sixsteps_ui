import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/outline';

export interface UserActivity {
  id: string;
  user: string;
  action: string;
  details: string;
  dateTime: string;
  ipAddress: string;
}

const ActivityTableRow: React.FC<{
  activity: UserActivity;
  onClick?: () => void;
}> = ({ activity, onClick }) => {
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

  const actionClasses = getActionColorClasses(activity.action);

  return (
    <div 
      className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* User column */}
      <div className="w-1/5 pr-2">
        <div className="text-sm font-medium">
          {activity.user}
        </div>
      </div>

      {/* Action column */}
      <div className="w-[15%] px-2 flex items-center">
        <span className={`${actionClasses.bg} ${actionClasses.text} inline-block py-1 px-3 rounded text-xs font-medium`}>
          {activity.action}
        </span>
        <div className="group relative ml-1">
          <InformationCircleIcon className="h-4 w-4 text-blue-500 opacity-70" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-44">
            Information about {activity.action}
          </div>
        </div>
      </div>

      {/* Details column */}
      <div className="w-1/4 px-2">
        <div className="text-sm truncate max-w-full">
          {activity.details}
        </div>
      </div>

      {/* Date & Time column */}
      <div className="w-1/5 px-2">
        <div className="text-sm text-gray-500">
          {activity.dateTime}
        </div>
      </div>

      {/* IP Address column */}
      <div className="w-1/5 px-2 flex items-center">
        <div className="text-sm font-mono">
          {activity.ipAddress}
        </div>
        <div className="group relative ml-1">
          <InformationCircleIcon className="h-4 w-4 text-blue-500 opacity-70" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
            IP Information
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTableRow; 