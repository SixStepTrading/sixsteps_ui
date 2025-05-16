import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import UsersTable from './UsersTable';
import ActivitiesTable from './ActivitiesTable';
import { User } from './UserTableRow';
import { UserActivity } from './ActivityTableRow';
import { SearchIcon, PlusIcon, FilterIcon } from '@heroicons/react/outline';

// Custom icon components
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

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

// Definizione tipo filtri utente
type UserFilterValues = {
  search: string;
  role: string;
  status: string;
};

// Tab component for navigation
interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ id, label, icon, active, onClick }) => {
  return (
    <button
      id={id}
      className={`flex items-center px-4 py-2 space-x-2 rounded-md transition-colors ${
        active 
          ? 'bg-blue-100 text-blue-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <span className={active ? 'text-blue-600' : 'text-gray-500'}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
};

// Tab navigation component
interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'users', label: 'User Management', icon: <UsersIcon className="h-5 w-5" /> },
    { id: 'create', label: 'Create New User', icon: <PlusIcon className="h-5 w-5" /> },
    { id: 'activity', label: 'Recent Activity', icon: <ActivityIcon className="h-5 w-5" /> }
  ];

  return (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex space-x-4 overflow-x-auto">
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Create User Form Component (no longer a modal)
const CreateUserForm: React.FC<{
  onCreateUser: (userData: any) => void;
}> = ({ onCreateUser }) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, checked, type } = e.target as HTMLInputElement;
    
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateUser(formData);
    // Reset form
    setFormData({
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
  };

  return (
    <div className="bg-white rounded-lg shadow-none p-0 max-w-2xl w-full">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Information Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">User Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="Enter first name" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="Enter last name" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="Enter email address" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="Enter temporary password" 
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
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
          
          {/* Role & Permissions Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Role & Permissions</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Role *</label>
              <select 
                name="userRole"
                value={formData.userRole}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                required
              >
                <option value="">Select role</option>
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Associated Entity *</label>
              <input 
                type="text" 
                name="associatedEntity"
                value={formData.associatedEntity}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                placeholder="Enter company or organization" 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Active" 
                    checked={formData.status === 'Active'} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Inactive" 
                    checked={formData.status === 'Inactive'} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Module Permissions</label>
              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    name="dashboard" 
                    checked={formData.permissions.dashboard} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Dashboard Access</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    name="orderManagement" 
                    checked={formData.permissions.orderManagement} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Order Management</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    name="productManagement" 
                    checked={formData.permissions.productManagement} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Product Management</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    name="userManagement" 
                    checked={formData.permissions.userManagement} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">User Management</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    name="analytics" 
                    checked={formData.permissions.analytics} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Analytics & Reports</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    name="systemSettings" 
                    checked={formData.permissions.systemSettings} 
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                  />
                  <span className="ml-2 text-sm text-gray-700">System Settings</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create User
          </button>
        </div>
      </form>
    </div>
  );
};

// Role Card Component
const RoleCard: React.FC<{
  role: string;
  count: number;
  description: string;
}> = ({ role, count, description }) => {
  const getRoleColorClass = (role: string) => {
    switch(role) {
      case 'Administrator': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' };
      case 'Manager': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' };
      case 'Pharmacy': return { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' };
      case 'Supplier': return { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'bg-gray-100' };
    }
  };
  const colorClass = getRoleColorClass(role);
  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'Administrator':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        );
      case 'Manager':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'Pharmacy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'Supplier':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };
  return (
    <div className={`${colorClass.bg} rounded-lg p-3 flex items-center justify-between min-h-[60px]`}>
      <div className="flex items-center gap-2">
        <div className={`${colorClass.icon} ${colorClass.text} p-2 rounded-full`}>{getRoleIcon(role)}</div>
        <div>
          <div className={`${colorClass.text} text-base font-semibold`}>{role}</div>
          {/* Tooltip per la descrizione */}
          <div className="text-xs text-gray-400" title={description}></div>
        </div>
      </div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
  );
};

// Nuovo UserFilterBar stile Dashboard
const UserFilterBar: React.FC<{
  values: UserFilterValues;
  onChange: (v: UserFilterValues) => void;
  onReset: () => void;
}> = ({ values, onChange, onReset }) => (
  <div className="flex flex-wrap items-center mb-6 gap-2 justify-between bg-gray-50 p-4 rounded-lg">
    <div className="relative max-w-xs w-full flex-1">
      <input
        type="text"
        placeholder="Search users by name, email..."
        value={values.search}
        onChange={e => onChange({ ...values, search: e.target.value })}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 1010 17a7 7 0 004-4z" /></svg>
      </div>
    </div>
    <select value={values.role} onChange={e => onChange({ ...values, role: e.target.value })} className="border border-gray-300 rounded-md px-2 py-2 text-sm">
      <option value="">All Roles</option>
      <option value="Administrator">Administrator</option>
      <option value="Manager">Manager</option>
      <option value="Pharmacy">Pharmacy</option>
      <option value="Supplier">Supplier</option>
    </select>
    <select value={values.status} onChange={e => onChange({ ...values, status: e.target.value })} className="border border-gray-300 rounded-md px-2 py-2 text-sm">
      <option value="">All Status</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
    <button onClick={onReset} className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 ml-2">Reset</button>
  </div>
);

// Main Component
const UserManagement: React.FC = () => {
  const { userRole, userName } = useUser();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [usersPage, setUsersPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [orderBy, setOrderBy] = useState('recentActivity');
  const [userFilterValues, setUserFilterValues] = useState<UserFilterValues>({
    search: '',
    role: '',
    status: ''
  });
  
  // Filter users based on search query
  const filteredUsers = MOCK_USERS.filter(user => {
    if (userFilterValues.role && user.role !== userFilterValues.role) return false;
    if (userFilterValues.status && user.status !== userFilterValues.status) return false;
    if (!userFilterValues.search) return true;
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(userFilterValues.search.toLowerCase()) || 
           user.email.toLowerCase().includes(userFilterValues.search.toLowerCase()) ||
           user.role.toLowerCase().includes(userFilterValues.search.toLowerCase());
  });
  
  const handlePageChange = (page: number) => {
    setUsersPage(page);
  };
  
  const handleActivityPageChange = (page: number) => {
    setActivitiesPage(page);
  };
  
  const handleOrderChange = (value: string) => {
    setOrderBy(value);
  };
  
  const handleCreateUser = (userData: any) => {
    // In a real app, this would send the user data to an API
    console.log('Creating user with data:', userData);
    showToast(`User ${userData.firstName} ${userData.lastName} created successfully!`, 'success');
    // After creation, switch back to user management tab
    setActiveTab('users');
  };

  const handleUserSelect = (user: User) => {
    showToast(`Selected user: ${user.firstName} ${user.lastName}`, 'info');
  };

  const handleEditUser = (user: User) => {
    showToast(`Editing user: ${user.firstName} ${user.lastName}`, 'info');
  };

  const handleDeleteUser = (user: User) => {
    showToast(`Deleted user: ${user.firstName} ${user.lastName}`, 'success');
  };
  
  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage users, permissions, and monitor activity
        </p>
      </div>
      
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Content for each tab */}
      {activeTab === 'users' && (
        <div>
          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.keys(ROLE_INFO).map(role => (
              <RoleCard 
                key={role} 
                role={role} 
                count={ROLE_INFO[role as keyof typeof ROLE_INFO].count}
                description={ROLE_INFO[role as keyof typeof ROLE_INFO].description}
              />
            ))}
          </div>
          
          {/* Action Bar */}
          <div className="flex justify-between mb-6">
            <UserFilterBar
              values={userFilterValues}
              onChange={setUserFilterValues}
              onReset={() => setUserFilterValues({ search: '', role: '', status: '' })}
            />
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-2 px-3 py-1.5 h-8 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors text-xs"
                aria-label="Create new user"
              >
                <PlusIcon className="h-4 w-4" />
                <span>New User</span>
              </button>
            </div>
          </div>
          
          {/* Users Table */}
          <UsersTable 
            users={filteredUsers}
            page={usersPage}
            rowsPerPage={5}
            onPageChange={handlePageChange}
            onUserSelect={handleUserSelect}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      )}
      
      {activeTab === 'create' && (
        <div className="w-full flex justify-center">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl w-full border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Create New User</h2>
            <p className="text-sm text-gray-500 mb-6">Add a new user to the FarmaBooster platform</p>
            <CreateUserForm onCreateUser={handleCreateUser} />
          </div>
        </div>
      )}
      
      {activeTab === 'activity' && (
        <div>
          <ActivitiesTable 
            activities={MOCK_ACTIVITIES} 
            page={activitiesPage}
            rowsPerPage={5}
            onPageChange={handleActivityPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagement; 