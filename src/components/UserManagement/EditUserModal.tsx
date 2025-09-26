import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { editUser, EditUserData, getAllEntities, Entity } from '../../utils/api';
import { User } from './UserTableRow';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  
  const [formData, setFormData] = useState<EditUserData>({
    userId: '',
    name: '',
    surname: '',
    role: 'user',
    email: '',
    password: '',
    entity: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && user) {
      // Find entity ID from entity name
      const entityId = entities.find(e => e.entityName === user.associatedEntity)?.id || '';
      
      setFormData({
        userId: user.id,
        name: user.firstName,
        surname: user.lastName,
        role: mapUIRoleToApiRole(user.role),
        email: user.email,
        password: '', // Leave empty for optional field
        entity: entityId
      });
      
      if (entities.length === 0) {
        loadEntities();
      }
    }
  }, [isOpen, user, entities]);

  // Map UI role to API role
  const mapUIRoleToApiRole = (uiRole: string): string => {
    switch (uiRole) {
      case 'Administrator':
        return 'admin';
      case 'Manager':
        return 'manager';
      case 'Pharmacy':
        return 'user';
      case 'Supplier':
        return 'supplier';
      default:
        return 'user';
    }
  };

  const loadEntities = async () => {
    try {
      setLoadingEntities(true);
      const entitiesData = await getAllEntities();
      if (Array.isArray(entitiesData)) {
        setEntities(entitiesData);
      }
    } catch (error: any) {
      showToast('Failed to load entities', 'error');
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleChange = (field: keyof EditUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.entity) {
      newErrors.entity = 'Entity is required';
    }

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      
      // Remove password from payload if empty
      const submitData: EditUserData = { ...formData };
      if (!submitData.password?.trim()) {
        delete submitData.password;
      }
      
      await editUser(submitData);
      showToast('User updated successfully!', 'success');
      onUserUpdated();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      userId: '',
      name: '',
      surname: '',
      role: 'user',
      email: '',
      password: '',
      entity: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit User: {user?.firstName} {user?.lastName}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Role Selection */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                User Role *
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'user', label: 'Regular User', description: 'Standard access' },
                  { value: 'admin', label: 'Administrator', description: 'Full access' },
                  { value: 'manager', label: 'Manager', description: 'Management access' },
                  { value: 'supplier', label: 'Supplier', description: 'Supplier access' }
                ].map(roleOption => (
                  <label key={roleOption.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={roleOption.value}
                      checked={formData.role === roleOption.value}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {roleOption.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {roleOption.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
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
                  value={formData.surname}
                  onChange={(e) => handleChange('surname', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                    errors.surname ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.surname && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.surname}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                  errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Entity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Associated Entity *
              </label>
              <select
                value={formData.entity}
                onChange={(e) => handleChange('entity', e.target.value)}
                disabled={loadingEntities}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                  errors.entity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select an entity...</option>
                {entities
                  .filter(entity => entity.status === 'ACTIVE' || !entity.status)
                  .map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {entity.entityName} ({entity.entityType})
                    </option>
                  ))}
              </select>
              {errors.entity && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.entity}</p>}
            </div>

            {/* Password (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password <span className="text-gray-500 dark:text-gray-400">(leave empty to keep current)</span>
              </label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter new password (optional)"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                  errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.password && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating User...
                  </>
                ) : (
                  'Update User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal; 