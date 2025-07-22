import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Entity, CreateUserData, UserResponse, createUser } from '../../utils/api';

interface UserCreationStepProps {
  selectedEntity: Entity;
  onUserCreated: (user: UserResponse) => void;
  onBack: () => void;
  onComplete: () => void;
}

const UserCreationStep: React.FC<UserCreationStepProps> = ({
  selectedEntity,
  onUserCreated,
  onBack,
  onComplete
}) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<UserResponse | null>(null);
  
  const [userData, setUserData] = useState<CreateUserData>({
    name: '',
    surname: '',
    role: 'user',
    email: '',
    entity: selectedEntity.id,
    password: '',
    secret: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (field: keyof CreateUserData | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setUserData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!userData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!userData.password) {
      newErrors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (userData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Admin secret validation
    if (userData.role === 'admin' && !userData.secret?.trim()) {
      newErrors.secret = 'Admin secret is required for admin users';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare user data (remove secret if not admin)
      const userDataToSend: CreateUserData = {
        ...userData,
        entity: selectedEntity.id
      };
      
      console.log('Selected Entity for user creation:', selectedEntity);
      console.log('User data being sent to API:', userDataToSend);
      
      if (userData.role !== 'admin') {
        delete userDataToSend.secret;
        console.log('Removed secret field, final payload:', userDataToSend);
      }

      const newUser = await createUser(userDataToSend);
      console.log('User creation response:', newUser);
      setCreatedUser(newUser);
      onUserCreated(newUser);
      
      showToast(
        `${userData.role === 'admin' ? 'Admin' : 'User'} "${userData.name} ${userData.surname}" created successfully!`, 
        'success'
      );
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast(error.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Create New User
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add a new user to the selected entity
        </p>
      </div>

      {/* Selected Entity Info */}
      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Selected Entity: {selectedEntity.entityName}
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-200 mt-1">
              <span className="font-medium">Type:</span> {selectedEntity.entityType} • 
              <span className="font-medium ml-2">Status:</span> {selectedEntity.status || 'Active'}
            </div>
          </div>
        </div>
      </div>

      {!createdUser ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Role Selection */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              User Role *
            </label>
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
              <label className="flex items-center cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={userData.role === 'user'}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Regular User
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Standard access with basic permissions
                  </p>
                </div>
              </label>
              
              <label className="flex items-center cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={userData.role === 'admin'}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Administrator
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Full system access and management rights
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter first name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                  errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={userData.surname}
                onChange={(e) => handleChange('surname', e.target.value)}
                placeholder="Enter last name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                  errors.surname ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.surname && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.surname}</p>}
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Account Credentials
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter password"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                  errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.password && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                  errors.confirmPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.confirmPassword && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
          </div>

          {/* Admin Secret (only if admin role selected) */}
          {userData.role === 'admin' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-center mb-2">
                <div className="flex items-center justify-center w-6 h-6 bg-amber-100 dark:bg-amber-800 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <label className="block text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Admin Secret Key *
                </label>
              </div>
              <input
                type="password"
                value={userData.secret || ''}
                onChange={(e) => handleChange('secret', e.target.value)}
                placeholder="Enter admin secret key"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${
                  errors.secret ? 'border-red-300 dark:border-red-600' : 'border-amber-300 dark:border-amber-600'
                }`}
              />
              {errors.secret && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.secret}</p>}
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Admin accounts require a special secret key for security purposes.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back: Select Entity
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating {userData.role === 'admin' ? 'Admin' : 'User'}...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create {userData.role === 'admin' ? 'Admin' : 'User'}
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Success State */
        <div className="space-y-4">
          <div className="p-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                  🎉 {userData.role === 'admin' ? 'Admin' : 'User'} Created Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p><strong>Name:</strong> {createdUser.name} {createdUser.surname}</p>
                  <p><strong>Email:</strong> {createdUser.email}</p>
                  <p><strong>Role:</strong> {createdUser.role}</p>
                  <p><strong>Entity:</strong> {selectedEntity.entityName}</p>
                  <p><strong>User ID:</strong> {createdUser.id}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Complete & Return to Users List
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreationStep; 