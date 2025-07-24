import React, { useState, useContext } from 'react';
import { User } from './UserTableRow';
import { SidebarContext } from '../../contexts/SidebarContext';

interface UsersTableProps {
  users: User[];
  totalUsers: number;
  hasActiveFilters?: boolean;
  onUserSelect?: (user: User) => void;
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  totalUsers,
  hasActiveFilters = false,
  onUserSelect,
  onEditUser,
  onDeleteUser
}) => {
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // Add sort state
  const [sortBy, setSortBy] = useState<string>('lastLogin');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Sorting functions
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600 dark:text-blue-400">↑</span>
      : <span className="ml-1 text-blue-600 dark:text-blue-400">↓</span>;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Role color mapping
  const getRoleColorClasses = (role: string) => {
    switch(role) {
      case 'Administrator': return { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
      case 'Manager': return { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
      case 'Pharmacy': return { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
      case 'Supplier': return { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' };
      default: return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const getAvatarColorClass = (role: string) => {
    switch(role) {
      case 'Administrator': return 'bg-blue-600 dark:bg-blue-700';
      case 'Manager': return 'bg-purple-600 dark:bg-purple-700';
      case 'Pharmacy': return 'bg-green-600 dark:bg-green-700';
      case 'Supplier': return 'bg-orange-600 dark:bg-orange-700';
      default: return 'bg-gray-600 dark:bg-gray-700';
    }
  };

  return (
    <div className="w-full flex flex-col gap-1 mb-8">
      {/* Users counter */}
      <div className="w-full flex flex-col gap-1 mb-4">
        <div className="flex items-center justify-between mb-1 px-2">
          <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded flex items-center border dark:border-blue-800/30">
            <span className="font-medium">Total Users:</span>
            <span className="ml-1 font-semibold text-blue-600 dark:text-blue-300">{totalUsers}</span>
          </div>
          {hasActiveFilters && (
            <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded flex items-center border dark:border-green-800/30">
              <span className="font-medium">Filtered:</span>
              <span className="ml-1 font-semibold text-green-600 dark:text-green-300">{sortedUsers.length}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Table container */}
      <div className="overflow-x-auto w-full overflow-y-visible">
        <div className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'} transition-all duration-300`}>
          {/* Table header */}
          <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-secondary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="w-[5%] text-center">#</div>
            <div className="w-[20%] cursor-pointer select-none flex items-center" onClick={() => handleSort('name')}>
              Name {renderSortIcon('name')}
            </div>
            <div className="w-[25%] cursor-pointer select-none flex items-center" onClick={() => handleSort('email')}>
              Email {renderSortIcon('email')}
            </div>
            <div className="w-[12%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => handleSort('role')}>
              Role {renderSortIcon('role')}
            </div>
            <div className="w-[18%] cursor-pointer select-none flex items-center" onClick={() => handleSort('entity')}>
              Entity {renderSortIcon('entity')}
            </div>
            <div className="w-[10%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => handleSort('status')}>
              Status {renderSortIcon('status')}
            </div>
            <div className="w-[15%] cursor-pointer select-none flex items-center" onClick={() => handleSort('lastLogin')}>
              Last Login {renderSortIcon('lastLogin')}
            </div>
            <div className="w-[5%] text-center">Actions</div>
          </div>
          
          {/* Table rows */}
          {sortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-card rounded-xl shadow dark:shadow-dark-md border border-slate-100 dark:border-dark-border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">No users found</h3>
              <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">Try adjusting your search or filter criteria to find users.</p>
            </div>
          ) : (
            sortedUsers.map((user, idx) => {
              const roleClasses = getRoleColorClasses(user.role);
              const statusClasses = user.status === 'Active' 
                ? { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' } 
                : { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };

              return (
                <div 
                  key={user.id}
                  className={`
                    flex items-center px-3 py-3 bg-white dark:bg-dark-bg-card border border-gray-100 dark:border-dark-border-primary
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer
                    relative
                    rounded-xl my-1.5
                  `}
                  onClick={() => onUserSelect && onUserSelect(user)}
                >
                  {/* Index */}
                  <div className="w-[5%] flex items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-dark-text-muted font-medium">{idx + 1}</span>
                  </div>
                  
                  {/* Name & Avatar */}
                  <div className="w-[20%] flex items-center">
                    <div className={`${getAvatarColorClass(user.role)} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3`}>
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-dark-text-muted">ID: {user.id}</span>
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="w-[25%]">
                    <span className="text-sm text-slate-700 dark:text-dark-text-secondary truncate block max-w-[250px]">
                      {user.email}
                    </span>
                  </div>
                  
                  {/* Role */}
                  <div className="w-[12%] flex justify-center">
                    <span className={`${roleClasses.bg} ${roleClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {user.role}
                    </span>
                  </div>
                  
                  {/* Entity */}
                  <div className="w-[18%]">
                    <span className="text-sm text-slate-700 dark:text-dark-text-secondary truncate block max-w-[200px]">
                      {user.associatedEntity}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="w-[10%] flex justify-center">
                    <span className={`${statusClasses.bg} ${statusClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {user.status}
                    </span>
                  </div>
                  
                  {/* Last Login */}
                  <div className="w-[15%]">
                    <span className="text-sm text-gray-500 dark:text-dark-text-muted">
                      {user.lastLogin}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="w-[5%] flex justify-center gap-1">
                    <button 
                      className="text-blue-600 dark:text-blue-400 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
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
                      className="text-red-600 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
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
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersTable; 