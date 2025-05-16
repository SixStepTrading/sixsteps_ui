import React, { useState } from 'react';
import { User } from './UserTableRow';
import { ReusableTable, Column, TableRow, TableCellProps } from '../common/reusable';

interface UsersTableProps {
  users: User[];
  page: number;
  rowsPerPage?: number;
  onPageChange: (page: number) => void;
  onUserSelect?: (user: User) => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  page = 1,
  rowsPerPage = 5,
  onPageChange,
  onUserSelect,
  onEditUser,
  onDeleteUser
}) => {
  // Add sort state
  const [sortBy, setSortBy] = useState<string>('lastLogin');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

  // Apply sorting
  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        break;
      case 'email':
        comparison = a.email.localeCompare(b.email);
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'entity':
        comparison = a.associatedEntity.localeCompare(b.associatedEntity);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'lastLogin':
        const dateA = new Date(a.lastLogin.split(' - ')[0]);
        const dateB = new Date(b.lastLogin.split(' - ')[0]);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Handle sort change
  const handleSort = (column: string, direction: 'asc' | 'desc' | null) => {
    setSortBy(column);
    setSortDirection(direction);
  };

  // Sorting icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600">↑</span>
      : <span className="ml-1 text-blue-600">↓</span>;
  };

  // Define columns for the table
  const columns: Column[] = [
    { id: 'index', label: '#', width: 'w-[5%]', align: 'center' },
    { id: 'name', label: 'Name', width: 'w-[15%]', sortable: true },
    { id: 'email', label: 'Email', width: 'w-[20%]', sortable: true },
    { id: 'role', label: 'Role', width: 'w-[12%]', align: 'center', info: 'Access level for specific platform features', sortable: true },
    { id: 'entity', label: 'Entity', width: 'w-[20%]', sortable: true },
    { id: 'status', label: 'Status', width: 'w-[10%]', align: 'center', info: 'Current account status', sortable: true },
    { id: 'lastLogin', label: 'Last Login', width: 'w-[13%]', info: 'Last time user logged into the system', sortable: true },
    { id: 'actions', label: 'Actions', width: 'w-[5%]', align: 'center' }
  ];

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

  // Render each row using the reusable TableRow component
  const renderRow = (user: User, index: number) => {
    const roleClasses = getRoleColorClasses(user.role);
    const statusClasses = user.status === 'Active' 
      ? { bg: 'bg-green-50', text: 'text-green-600' } 
      : { bg: 'bg-gray-50', text: 'text-gray-500' };

    const cells: TableCellProps[] = [
      // Index column
      {
        content: <span className="text-xs text-gray-600 font-medium">{index}</span>,
        width: 'w-[5%]',
        align: 'center'
      },
      // Name & Avatar column
      {
        content: (
          <div className="flex items-center">
            <div className={`${getAvatarColorClass(user.role)} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-2`}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm text-slate-800">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-slate-400">ID: {user.id}</span>
            </div>
          </div>
        ),
        width: 'w-[15%]'
      },
      // Email column
      {
        content: (
          <span className="text-sm text-slate-700 truncate block max-w-[200px]">
            {user.email}
          </span>
        ),
        width: 'w-[20%]'
      },
      // Role column
      {
        content: (
          <span className={`${roleClasses.bg} ${roleClasses.text} inline-block py-1 px-3 rounded text-xs font-medium`}>
            {user.role}
          </span>
        ),
        width: 'w-[12%]',
        align: 'center',
        tooltip: `${user.role} - Access level for specific platform features`
      },
      // Entity column
      {
        content: (
          <span className="text-sm text-slate-700 truncate block max-w-[200px]">
            {user.associatedEntity}
          </span>
        ),
        width: 'w-[20%]'
      },
      // Status column
      {
        content: (
          <span className={`${statusClasses.bg} ${statusClasses.text} inline-block py-1 px-3 rounded text-xs font-medium`}>
            {user.status}
          </span>
        ),
        width: 'w-[10%]',
        align: 'center',
        tooltip: user.status === 'Active' ? 'User can log in and access the system' : 'User account is temporarily disabled'
      },
      // Last login column
      {
        content: (
          <span className="text-sm text-gray-500">
            {user.lastLogin}
          </span>
        ),
        width: 'w-[13%]',
        tooltip: "Last time user logged into the system"
      },
      // Actions column
      {
        content: (
          <div className="flex justify-center gap-1">
            <button 
              className="text-blue-600 p-1 hover:bg-blue-50 rounded-full"
              onClick={(e) => { 
                e.stopPropagation(); 
                onEditUser && onEditUser(user); 
              }}
              aria-label="Edit user"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              className="text-red-600 p-1 hover:bg-red-50 rounded-full"
              onClick={(e) => { 
                e.stopPropagation(); 
                onDeleteUser && onDeleteUser(user); 
              }}
              aria-label="Delete user"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ),
        width: 'w-[5%]',
        align: 'center'
      }
    ];

    return (
      <div className="bg-white rounded-xl my-1 hover:bg-blue-50 transition-colors duration-150">
        <TableRow 
          key={user.id} 
          cells={cells} 
          onClick={() => onUserSelect && onUserSelect(user)} 
        />
      </div>
    );
  };

  return (
    <div className="overflow-x-auto w-full">
      <div className="min-w-[1000px]">
        {/* Header columns - stile ProductTable */}
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
        {sortedUsers.length > 0 ? (
          sortedUsers.map((user, idx) => renderRow(user, idx + 1 + (page - 1) * rowsPerPage))
        ) : (
          <div className="py-6 text-center text-gray-500">No users to display</div>
        )}
      </div>
    </div>
  );
};

export default UsersTable; 