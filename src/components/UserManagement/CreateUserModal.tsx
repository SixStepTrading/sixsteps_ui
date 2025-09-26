import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { getAllEntities, createUser, Entity, CreateUserData, UserResponse } from '../../utils/api';
import Stepper from '../common/Stepper';
import SearchableDropdown from '../common/molecules/SearchableDropdown';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
  onNavigateToEntityManagement: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  onNavigateToEntityManagement
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState('entity');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [createdUser, setCreatedUser] = useState<UserResponse | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [userData, setUserData] = useState<CreateUserData>({
    name: '',
    surname: '',
    role: 'user',
    email: '',
    entity: '',
    password: '',
    secret: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const steps = [
    {
      id: 'entity',
      title: 'Select Entity',
      description: 'Choose business entity'
    },
    {
      id: 'user',
      title: 'Create User',
      description: 'Add user details'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      loadEntities();
    }
  }, [isOpen]);

  const loadEntities = async () => {
    try {
      setLoadingEntities(true);
      const entitiesData = await getAllEntities();
      setEntities(entitiesData);
    } catch (error) {
      showToast('Failed to load entities', 'error');
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleEntitySelect = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      setSelectedEntity(entity);
      setCurrentStep('user');
    }
  };

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!userData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!userData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!userData.role) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEntity) {
      showToast('Please select an entity first', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userPayload = {
        ...userData,
        entity: selectedEntity.id
      };
      
      const newUser = await createUser(userPayload);
      setCreatedUser(newUser);
      showToast('User created successfully!', 'success');
      onUserCreated();
      handleClose();
    } catch (error: any) {
      showToast(
        error.response?.data?.message || 
        error.message || 
        'Failed to create user',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('entity');
    setSelectedEntity(null);
    setCreatedUser(null);
    setUserData({
      name: '',
      surname: '',
      role: 'user',
      email: '',
      entity: '',
      password: '',
      secret: ''
    });
    setErrors({});
    onClose();
  };

  const handleBackToEntitySelection = () => {
    setCurrentStep('entity');
    setSelectedEntity(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New User
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new user to the Six Steps - FarmaAggregator platform
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>

          {/* Step Content */}
          {currentStep === 'entity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select Business Entity
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose the business entity this user will be associated with
                </p>
              </div>

              <SearchableDropdown
                options={entities
                  .filter(entity => entity.status === 'ACTIVE' || !entity.status)
                  .map(entity => ({
                    id: entity.id,
                    name: entity.entityName,
                    type: entity.entityType,
                    country: entity.country,
                    status: entity.status
                  }))
                }
                selectedId={selectedEntity?.id || ''}
                onSelect={handleEntitySelect}
                placeholder="Select an entity"
                searchPlaceholder="Search entities..."
                loading={loadingEntities}
                className="mb-4"
              />

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={onNavigateToEntityManagement}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Entity
                </button>
              </div>
            </div>
          )}

          {currentStep === 'user' && selectedEntity && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Create User for {selectedEntity.entityName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fill in the user details below
                  </p>
                </div>
                <button
                  onClick={handleBackToEntitySelection}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  {/* Surname */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Surname *
                    </label>
                    <input
                      type="text"
                      value={userData.surname}
                      onChange={(e) => handleInputChange('surname', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.surname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.surname && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.surname}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role *
                    </label>
                    <select
                      value={userData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.role ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={userData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                  </div>

                  {/* Secret */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Secret
                    </label>
                    <input
                      type="text"
                      value={userData.secret}
                      onChange={(e) => handleInputChange('secret', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter secret (optional)"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBackToEntitySelection}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
