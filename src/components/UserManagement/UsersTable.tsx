import React from 'react';
import { InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import UserTableRow, { User } from './UserTableRow';

interface UsersTableProps {
  users: User[];
  page: number;
  rowsPerPage?: number;
  onPageChange: (page: number) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  page = 1,
  rowsPerPage = 5,
  onPageChange
}) => {
  const handlePageChange = (value: number) => {
    onPageChange(value);
  };

  const paginatedUsers = users.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  // Column headers matching the DeFi image
  const columns = [
    { id: 'name', label: 'Name', width: 'w-1/4', info: false },
    { id: 'email', label: 'Email', width: 'w-1/5', info: false },
    { id: 'role', label: 'Role', width: 'w-[15%]', info: true },
    { id: 'associatedEntity', label: 'Entity', width: 'w-1/5', info: false },
    { id: 'status', label: 'Status', width: 'w-[10%]', info: true },
    { id: 'lastLogin', label: 'Last Login', width: 'w-1/5', info: true },
    { id: 'actions', label: 'Actions', width: 'w-auto', info: false }
  ];

  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100 mb-8">
      {/* Table Header */}
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
        {paginatedUsers.map((user) => (
          <UserTableRow key={user.id} user={user} />
        ))}
      </div>

      {/* Pagination */}
      {users.length > rowsPerPage && (
        <div className="flex justify-center py-4 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`p-2 rounded ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {[...Array(Math.ceil(users.length / rowsPerPage))].map((_, index) => (
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
              disabled={page === Math.ceil(users.length / rowsPerPage)}
              className={`p-2 rounded ${page === Math.ceil(users.length / rowsPerPage) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable; 