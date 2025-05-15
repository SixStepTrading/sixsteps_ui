import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import UsersTable from './UsersTable';
import ActivitiesTable from './ActivitiesTable';
import { User } from './UserTableRow';
import { UserActivity } from './ActivityTableRow';
import { SearchIcon as HeroSearchIcon, PlusIcon, FilterIcon, ChevronDownIcon } from '@heroicons/react/outline';

// Mock data for users
const MOCK_USERS: User[] = [
    {
    id: '1',
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'm.rossi@farmaciasammarco.it',
    role: 'Administrator',
    associatedEntity: 'Farmacia San Marco',
      status: 'Active',
    lastLogin: 'May 9, 2025 - 10:42'
    },
    {
    id: '2',
    firstName: 'Laura',
    lastName: 'Bianchi',
    email: 'l.bianchi@farmaciacentrale.it',
    role: 'Manager',
    associatedEntity: 'Farmacia Centrale',
      status: 'Active',
    lastLogin: 'May 8, 2025 - 15:23'
    },
    {
    id: '3',
    firstName: 'Giuseppe',
    lastName: 'Verdi',
    email: 'g.verdi@medifarma.com',
    role: 'Supplier',
    associatedEntity: 'MediFarma Supplies',
      status: 'Active',
    lastLogin: 'May 7, 2025 - 09:11'
    },
    {
    id: '4',
    firstName: 'Elena',
    lastName: 'Ferrari',
    email: 'e.ferrari@pharmatech.it',
      role: 'Supplier',
    associatedEntity: 'PharmaTech Solutions',
    status: 'Active',
    lastLogin: 'May 6, 2025 - 14:05'
    },
    {
    id: '5',
    firstName: 'Paolo',
    lastName: 'Colombo',
    email: 'p.colombo@farmaciarossi.it',
    role: 'Pharmacy',
    associatedEntity: 'Farmacia Rossi',
    status: 'Inactive',
    lastLogin: 'Apr 28, 2025 - 11:30'
  }
];

// Mock data for recent activities
const MOCK_ACTIVITIES: UserActivity[] = [
  {
    id: '1',
    user: 'Marco Rossi',
    action: 'Login',
    details: 'Successful login',
    dateTime: 'May 9, 2025 - 10:42',
    ipAddress: '192.168.1.105'
  },
  {
    id: '2',
    user: 'Laura Bianchi',
    action: 'Order Created',
    details: 'Created order #ODA-2542',
    dateTime: 'May 8, 2025 - 15:23',
    ipAddress: '192.168.1.87'
  },
  {
    id: '3',
    user: 'Giuseppe Verdi',
    action: 'Product Update',
    details: 'Updated inventory for 15 products',
    dateTime: 'May 7, 2025 - 09:11',
    ipAddress: '192.168.1.42'
  },
  {
    id: '4',
    user: 'Elena Ferrari',
    action: 'Password Reset',
    details: 'Requested password reset',
    dateTime: 'May 6, 2025 - 14:05',
    ipAddress: '192.168.1.56'
  },
  {
    id: '5',
    user: 'Marco Rossi',
    action: 'User Created',
    details: 'Created user Paolo Colombo',
    dateTime: 'May 5, 2025 - 11:30',
    ipAddress: '192.168.1.105'
  }
  ];

// Role-related data
const ROLE_INFO = {
  Administrator: { count: 12, description: 'Full system access with all permissions' },
  Manager: { count: 24, description: 'Can manage orders and products, limited admin access' },
  Pharmacy: { count: 98, description: 'Can place orders and manage pharmacy inventory' },
  Supplier: { count: 53, description: 'Can manage product listings and fulfill orders' }
};

// Components
const CreateUserForm: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
      email: '',
    phoneNumber: '',
    tempPassword: '',
    userRole: '',
    associatedEntity: '',
      status: 'Active',
    permissions: {
      dashboard: false,
      orderManagement: false,
      productManagement: false,
      userManagement: false,
      analytics: false,
      systemSettings: false
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-medium mb-1">Create New User</h2>
      <p className="text-sm text-gray-600 mb-6">Add a new user to the FarmaBooster platform</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">User Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input 
              type="text" 
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2" 
              placeholder="Enter first name" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input 
              type="text" 
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2" 
              placeholder="Enter last name" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2" 
              placeholder="Enter email address" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              type="text" 
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2" 
              placeholder="Enter phone number" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="tempPassword"
                value={formData.tempPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10" 
                placeholder="Enter temporary password" 
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">User will be prompted to change password on first login</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Role & Permissions</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role *</label>
            <select 
              name="userRole"
              value={formData.userRole}
              onChange={handleChange as any}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select role</option>
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Supplier">Supplier</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Associated Entity</label>
            <select 
              name="associatedEntity"
              value={formData.associatedEntity}
              onChange={handleChange as any}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select entity</option>
              <option value="Farmacia San Marco">Farmacia San Marco</option>
              <option value="Farmacia Centrale">Farmacia Centrale</option>
              <option value="MediFarma Supplies">MediFarma Supplies</option>
              <option value="PharmaTech Solutions">PharmaTech Solutions</option>
              <option value="Farmacia Rossi">Farmacia Rossi</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the pharmacy or supplier this user is associated with</p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Access Permissions</h3>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="dashboard"
                  checked={formData.permissions.dashboard}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">Dashboard Access</span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="orderManagement"
                  checked={formData.permissions.orderManagement}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">Order Management</span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="productManagement"
                  checked={formData.permissions.productManagement}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">Product Management</span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="userManagement"
                  checked={formData.permissions.userManagement}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">User Management</span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="analytics"
                  checked={formData.permissions.analytics}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">Analytics & Reports</span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  name="systemSettings"
                  checked={formData.permissions.systemSettings}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">System Settings</span>
              </label>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Account Status</h3>
            
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="status"
                  value="Active"
                  checked={formData.status === "Active"}
                  onChange={handleChange}
                  className="border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">Active</span>
              </label>
              
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="status"
                  value="Inactive"
                  checked={formData.status === "Inactive"}
                  onChange={handleChange}
                  className="border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500" 
                />
                <span className="ml-2 text-sm">Inactive</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button 
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create User
        </button>
      </div>
    </div>
  );
};

// DeFi style header component
const DeFiHeader: React.FC<{
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  totalItems?: number;
  orderBy?: string;
  onOrderChange?: (value: string) => void;
}> = ({ 
  title, 
  searchValue = "", 
  onSearchChange,
  totalItems,
  orderBy = "TVL",
  onOrderChange
}) => {
  return (
    <div className="px-6 py-4">
      <h2 className="text-xl font-medium text-blue-600 mb-2">
        {title}
      </h2>
      
      <p className="text-sm text-gray-600 mb-6 max-w-[90%]">
        Explore a comprehensive suite of user profiles and manage access to different application functions with granular control.
      </p>
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HeroSearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search strategies, tokens, protocols, and more..."
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button className="p-2 bg-white">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button className="p-2 bg-white">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50">
            <span className="text-sm mr-1">Order By</span>
            <span className="text-sm font-bold mr-1">{orderBy}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-4">
        {['Chains', 'Incentives', 'Tokens', 'Protocols', 'TVL', 'APY'].map((filter) => (
          <span
            key={filter}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex items-center"
          >
            {filter}
            {filter === 'TVL' && <ChevronDownIcon className="h-4 w-4 ml-1" />}
          </span>
        ))}
      </div>
      
      {totalItems && (
        <div className="text-sm text-gray-600 mt-4">
          {totalItems} users found
        </div>
      )}
    </div>
  );
};

// Role card component
const RoleCard: React.FC<{
  role: string;
  count: number;
  description: string;
}> = ({ role, count, description }) => {
  const getRoleColorClass = (role: string) => {
    switch(role) {
      case 'Administrator': return 'bg-blue-600';
      case 'Manager': return 'bg-purple-600';
      case 'Pharmacy': return 'bg-green-600';
      case 'Supplier': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-5 h-full shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-center mb-3">
        <div className={`${getRoleColorClass(role)} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-3`}>
          {role.charAt(0)}
        </div>
        <h3 className="text-lg font-medium">{role}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4 h-10">{description}</p>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-sm">
          Users: <span className="font-bold">{count}</span>
        </span>
        <button className="text-gray-500 p-1 rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Main component
const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [orderBy, setOrderBy] = useState('Name');

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleToggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleActivityPageChange = (page: number) => {
    setActivityPage(page);
  };

  const handleOrderChange = (value: string) => {
    setOrderBy(value);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
      <div className="py-3">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-medium text-blue-600 mb-3 sm:mb-0">
            User Management
          </h1>
          <button 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            onClick={handleToggleCreateForm}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New User
          </button>
        </div>

        {/* Create user form (placeholder) */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md mb-8 p-6 border border-gray-200">
            <CreateUserForm open={showCreateForm} onClose={handleToggleCreateForm} />
          </div>
        )}

        {/* Users Table with DeFi style header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <DeFiHeader 
              title="Manage Users"
              searchValue={searchValue}
              onSearchChange={handleSearch}
              totalItems={MOCK_USERS.length}
              orderBy={orderBy}
              onOrderChange={handleOrderChange}
            />
            <UsersTable 
              users={MOCK_USERS}
              page={page}
              rowsPerPage={5}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        {/* User roles overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-medium text-blue-600">
              User Roles Overview
            </h2>
            <button className="flex items-center px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <PlusIcon className="h-4 w-4 mr-1" />
              Create New Role
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(ROLE_INFO).map(([role, info]) => (
              <RoleCard
                key={role}
                role={role}
                count={info.count}
                description={info.description}
              />
            ))}
          </div>
        </div>

        {/* Activity Table */}
        <ActivitiesTable 
          activities={MOCK_ACTIVITIES}
          page={activityPage}
          rowsPerPage={5}
          onPageChange={handleActivityPageChange}
        />
      </div>
    </div>
  );
};

export default UserManagement; 