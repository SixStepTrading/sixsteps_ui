import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { SearchIcon, PlusIcon, FilterIcon } from '@heroicons/react/outline';
import { getAllEntities, getAllUsers, createEntity, updateEntity, deleteEntity, Entity, createUser, UserResponse, CreateUserData, getLogs, downloadLogs } from '../../utils/api';
import Stepper from '../common/Stepper';
import EntitySelectionStep from './EntitySelectionStep';
import UserCreationStep from './UserCreationStep';
import UsersTable from './UsersTable';
import ActivitiesTable from './ActivitiesTable';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';
import { User } from './UserTableRow';
import { UserActivity } from './ActivityTableRow';

// Types for API data (different from UI components)
interface ApiUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  entity: string;
  status?: string;
  lastLogin?: string;
}

interface UserFilterValues {
  search: string;
  role: string;
  status: string;
  entity: string;
}

// Enhanced Create User Form with 2-step process
const CreateUserForm: React.FC<{
  onCreateUser: (userData: any) => void;
}> = ({ onCreateUser }) => {
  const [currentStep, setCurrentStep] = useState('entity');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [createdUser, setCreatedUser] = useState<UserResponse | null>(null);
  
  const steps = [
    {
      id: 'entity',
      title: 'Select Entity',
      description: 'Choose or create business entity'
    },
    {
      id: 'user',
      title: 'Create User', 
      description: 'Add user details and credentials'
    }
  ];

  const completedSteps = currentStep === 'user' && selectedEntity ? ['entity'] : [];

  const handleEntitySelected = (entity: Entity) => {
    setSelectedEntity(entity);
  };

  const handleNextStep = () => {
    setCurrentStep('user');
  };

  const handleBackStep = () => {
    setCurrentStep('entity');
  };

  const handleUserCreated = (user: UserResponse) => {
    setCreatedUser(user);
  };

  const handleComplete = () => {
    // Call the parent callback if needed
    if (createdUser) {
      onCreateUser({
        firstName: createdUser.name,
        lastName: createdUser.surname,
        email: createdUser.email,
        userRole: createdUser.role,
        associatedEntity: selectedEntity?.entityName || '',
        id: createdUser.id
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
            <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Create New User
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add a new user to the Six Steps - FarmaAggregator platform
            </p>
            </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
            </div>
          </div>
        </div>
            </div>
            
      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 mb-6">
        <Stepper 
          steps={steps} 
          currentStep={currentStep} 
          completedSteps={completedSteps}
              />
            </div>
            
      {/* Step Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        {currentStep === 'entity' && (
          <div className="p-6">
            <EntitySelectionStep
              selectedEntity={selectedEntity}
              onEntitySelected={handleEntitySelected}
              onNext={handleNextStep}
            />
              </div>
        )}

        {currentStep === 'user' && selectedEntity && (
          <div className="p-6">
            <UserCreationStep
              selectedEntity={selectedEntity}
              onUserCreated={handleUserCreated}
              onBack={handleBackStep}
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const { user: currentUser, userRole } = useUser();
  const [activeTab, setActiveTab] = useState('users');
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<UserFilterValues>({
    search: '',
    role: '',
    status: '',
    entity: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Activities state - loaded from API
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);

  useEffect(() => {
    loadUsers();
    loadEntities();
    loadActivities(true); // true = reset
  }, []);

  // Early return if not admin - additional security check (AFTER all hooks)
  if (userRole !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Access Denied</div>
          <div className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</div>
        </div>
      </div>
    );
  }

  // Helper function to get entity name by ID
  const getEntityName = (entityId: string): string => {
    const entity = entities.find(e => e.id === entityId);
    return entity ? entity.entityName : entityId; // Fallback to ID if entity not found
  };

  // Map API user to UI User format
  const mapApiUserToUser = (apiUser: ApiUser): User => {
    return {
      id: apiUser.id,
      firstName: apiUser.name,
      lastName: apiUser.surname,
      email: apiUser.email,
      role: mapApiRoleToUIRole(apiUser.role),
      associatedEntity: getEntityName(apiUser.entity),
      status: (apiUser.status || 'Active') as 'Active' | 'Inactive',
      lastLogin: apiUser.lastLogin || 'Recently'
    };
  };

  // Map API role to UI role
  const mapApiRoleToUIRole = (apiRole: string): 'Administrator' | 'Manager' | 'Pharmacy' | 'Supplier' => {
    switch (apiRole.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Pharmacy';
      case 'manager':
        return 'Manager';
      case 'supplier':
        return 'Supplier';
      default:
        return 'Pharmacy';
    }
  };

  // Get users in UI format
  const users: User[] = apiUsers.map(mapApiUserToUser);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      const usersData = await getAllUsers();
      console.log('Users API response:', usersData);
      
      if (Array.isArray(usersData)) {
        setApiUsers(usersData);
        console.log('Users set successfully:', usersData.length, 'users');
      } else {
        console.warn('API returned non-array data:', usersData);
        setApiUsers([]);
        showToast('Invalid response format from server', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setApiUsers([]);
      showToast('Failed to load users from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEntities = async () => {
    try {
      console.log('Loading entities...');
      const entitiesData = await getAllEntities();
      console.log('Entities API response:', entitiesData);
      
      if (Array.isArray(entitiesData)) {
        setEntities(entitiesData);
        console.log('Entities set successfully:', entitiesData.length, 'entities');
      } else {
        console.warn('API returned non-array data for entities:', entitiesData);
        setEntities([]);
        showToast('Failed to load entities from server', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading entities:', error);
      setEntities([]);
      showToast('Failed to load entities from server', 'error');
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      showToast(`User ${userData.firstName} ${userData.lastName} created successfully!`, 'success');
      
      // Reload users to reflect changes
      await loadUsers();
      
      // Switch back to user management tab
      setActiveTab('users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast(error.message || 'Failed to create user', 'error');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = async () => {
    await loadUsers(); // Refresh the users list
  };

  const handleUserDeleted = async () => {
    await loadUsers(); // Refresh the users list
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadUsers(), loadEntities()]);
      showToast('Data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (filterType: keyof UserFilterValues, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      entity: ''
    });
  };

  const handleCreateNewUser = () => {
    setActiveTab('create');
  };

  // Apply filters to users
  const filteredUsers = users.filter(user => {
    // Search filter (name, email)
    const searchMatch = !filters.search || 
      user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    // Role filter
    const roleMatch = !filters.role || user.role === filters.role;
    
    // Status filter  
    const statusMatch = !filters.status || user.status === filters.status;
    
    // Entity filter
    const entityMatch = !filters.entity || user.associatedEntity.toLowerCase().includes(filters.entity.toLowerCase());
    
    return searchMatch && roleMatch && statusMatch && entityMatch;
  });

  // Get unique values for dropdowns
  const availableRoles = Array.from(new Set(users.map(user => user.role)));
  const availableStatuses = Array.from(new Set(users.map(user => user.status)));

  // Calculate statistics for role cards (based on filtered data)
  const roleStats = {
    administrator: filteredUsers.filter(u => u.role === 'Administrator').length,
    manager: filteredUsers.filter(u => u.role === 'Manager').length,
    pharmacy: filteredUsers.filter(u => u.role === 'Pharmacy').length,
    supplier: filteredUsers.filter(u => u.role === 'Supplier').length,
  };

  // Load activities from API
  const loadActivities = async (reset: boolean = false) => {
    if (activitiesLoading) return;
    
    setActivitiesLoading(true);
    try {
      const currentPage = reset ? 1 : activitiesPage;
      const response = await getLogs(currentPage, 20);
      
      if (reset) {
        setActivities(response.logs);
        setActivitiesPage(2);
      } else {
        setActivities(prev => [...prev, ...response.logs]);
        setActivitiesPage(currentPage + 1);
      }
      
      // Check if there are more pages
      setHasMoreActivities(currentPage < response.pagination.totalPages);
      
      console.log('Activities loaded:', response.logs);
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('Failed to load activities', 'error');
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Load more activities for infinite scroll
  const loadMoreActivities = () => {
    if (!activitiesLoading && hasMoreActivities) {
      loadActivities(false);
    }
  };

  // Download activities as CSV
  const handleDownloadCSV = async () => {
    try {
      await downloadLogs();
      showToast('Logs CSV downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading logs CSV:', error);
      showToast('Failed to download logs CSV', 'error');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
          Manage users, permissions, and monitor activity
        </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User Management
          </button>
          {currentUser?.entityType === 'ADMIN' && (
            <button 
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New User
            </button>
          )}
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Recent Activity
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Role Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Administrator Card */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Administrator</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full system access with all pe...</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {roleStats.administrator}
                </div>
              </div>
            </div>
            
            {/* Manager Card */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Manager</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Can manage orders and products...</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {roleStats.manager}
                </div>
              </div>
            </div>
            
            {/* Pharmacy Card */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Pharmacy</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Can place orders and manage ph...</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {roleStats.pharmacy}
                </div>
              </div>
            </div>
            
            {/* Supplier Card */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
        <div>
                    <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Supplier</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Can manage product listings an...</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {roleStats.supplier}
                </div>
              </div>
            </div>
          </div>
          
          {/* Filters Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left side - Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users by name, email..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
                {/* Role Filter */}
                <div className="min-w-[140px]">
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Roles</option>
                    {availableRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="min-w-[140px]">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Status</option>
                    {availableStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right side - Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Reset
                </button>
                
              <button
                  onClick={handleCreateNewUser}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                New User
              </button>
              
              <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRefreshing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                  )}
                Refresh
              </button>
              </div>
            </div>
          </div>
          
          {/* Users Table */}
          <UsersTable 
            users={filteredUsers}
            totalUsers={users.length}
            hasActiveFilters={!!(filters.search || filters.role || filters.status || filters.entity)}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      )}
      
      {activeTab === 'create' && currentUser?.entityType === 'ADMIN' && (
            <CreateUserForm onCreateUser={handleCreateUser} />
      )}
      
      {activeTab === 'activity' && (
          <ActivitiesTable 
          activities={activities} 
          loading={activitiesLoading}
          hasMore={hasMoreActivities}
          onLoadMore={loadMoreActivities}
          onDownloadCSV={handleDownloadCSV}
        />
      )}

      {/* Modals */}
      <EditUserModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        user={selectedUser}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
};

export default UserManagement; 