import React from 'react';
import { PencilIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/outline';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'Pharmacy' | 'Supplier';
  associatedEntity: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const UserTableRow: React.FC<{
  user: User;
  onClick?: () => void;
}> = ({ user, onClick }) => {
  // Role color mapping
  const getRoleColorClasses = (role: string) => {
    switch(role) {
      case 'Administrator': return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'Manager': return { bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'Pharmacy': return { bg: 'bg-green-50', text: 'text-green-600' };
      case 'Supplier': return { bg: 'bg-orange-50', text: 'text-orange-600' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600' };
    }
  };

  const getAvatarColorClass = (role: string) => {
    switch(role) {
      case 'Administrator': return 'bg-blue-600';
      case 'Manager': return 'bg-purple-600';
      case 'Pharmacy': return 'bg-green-600';
      case 'Supplier': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const roleClasses = getRoleColorClasses(user.role);
  const statusClasses = user.status === 'Active' 
    ? { bg: 'bg-green-50', text: 'text-green-600' } 
    : { bg: 'bg-gray-50', text: 'text-gray-500' };

  return (
    <div 
      className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Name & Avatar column */}
      <div className="flex items-center w-1/4 pr-2">
        <div className={`${getAvatarColorClass(user.role)} text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mr-3`}>
          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
        </div>
        <div>
          <div className="font-medium">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-gray-500">
            ID: {user.id}
          </div>
        </div>
      </div>

      {/* Email column */}
      <div className="w-1/5 px-2">
        <div className="text-sm truncate max-w-full">
          {user.email}
        </div>
      </div>

      {/* Role column */}
      <div className="w-[15%] px-2 flex items-center">
        <span className={`${roleClasses.bg} ${roleClasses.text} inline-block py-1 px-3 rounded text-xs font-medium`}>
          {user.role}
        </span>
        <div className="group relative ml-1">
          <InformationCircleIcon className="h-4 w-4 text-blue-500 opacity-70" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-44">
            Information about {user.role} role
          </div>
        </div>
      </div>

      {/* Entity column */}
      <div className="w-1/5 px-2">
        <div className="text-sm truncate max-w-full">
          {user.associatedEntity}
        </div>
      </div>

      {/* Status column */}
      <div className="w-[10%] px-2">
        <span className={`${statusClasses.bg} ${statusClasses.text} inline-block py-1 px-3 rounded text-xs font-medium`}>
          {user.status}
        </span>
      </div>
      
      {/* Last login column */}
      <div className="w-1/5 px-2">
        <div className="text-sm text-gray-500">
          {user.lastLogin}
        </div>
      </div>

      {/* Actions column */}
      <div className="flex gap-1 ml-auto">
        <button 
          className="text-blue-600 p-1 hover:bg-blue-50 rounded-full group relative"
          title="Edit user"
        >
          <PencilIcon className="h-4 w-4" />
          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
            Edit user
          </span>
        </button>
        <button 
          className="text-red-600 p-1 hover:bg-red-50 rounded-full group relative"
          title="Delete user"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
            Delete user
          </span>
        </button>
      </div>
    </div>
  );
};

export default UserTableRow; 