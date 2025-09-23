import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { updateEntity, Entity } from '../../utils/api';

interface EditEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  onEntityUpdated: () => void;
}

const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
  onEntityUpdated
}) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    entityId: '',
    entityName: '',
    entityType: 'SUPPLIER' as Entity['entityType'],
    country: '',
    address: '',
    phone: '',
    vatNumber: '',
    email: '',
    notes: '',
    status: 'ACTIVE' as const,
    warehouses: [] as string[]
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && entity) {
      setFormData({
        entityId: entity.id,
        entityName: entity.entityName,
        entityType: entity.entityType,
        country: entity.country || '',
        address: entity.address || '',
        phone: entity.phone || '',
        vatNumber: entity.vatNumber || '',
        email: entity.email || '',
        notes: entity.notes || '',
        status: entity.status || 'ACTIVE',
        warehouses: entity.warehouses || []
      });
    }
  }, [isOpen, entity]);

  const handleChange = (field: keyof typeof formData, value: string) => {
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
    if (!formData.entityName.trim()) {
      newErrors.entityName = 'Entity name is required';
    }
    if (!formData.entityType) {
      newErrors.entityType = 'Entity type is required';
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
      
      const updateData = {
        entityId: formData.entityId,
        entityName: formData.entityName,
        entityType: formData.entityType as Entity['entityType'],
        country: formData.country,
        address: formData.address,
        phone: formData.phone,
        vatNumber: formData.vatNumber,
        email: formData.email,
        notes: formData.notes,
        status: formData.status,
        warehouses: formData.warehouses
      };
      
      await updateEntity(updateData);
      showToast('Entity updated successfully!', 'success');
      onEntityUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating entity:', error);
      showToast(error.message || 'Failed to update entity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      entityId: '',
      entityName: '',
      entityType: 'SUPPLIER' as Entity['entityType'],
      country: '',
      address: '',
      phone: '',
      vatNumber: '',
      email: '',
      notes: '',
      status: 'ACTIVE' as const,
      warehouses: []
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
              Edit Entity: {entity?.entityName}
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
            {/* Entity Type Selection */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Entity Type *
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'SUPPLIER', label: 'Supplier', description: 'Product suppliers and vendors' },
                  { value: 'MANAGER', label: 'Manager', description: 'Management entities' },
                  { value: 'PHARMACY', label: 'Pharmacy', description: 'Pharmacy entities' },
                  { value: 'ADMIN', label: 'Admin', description: 'Administrative entities' }
                ].map(typeOption => (
                  <label key={typeOption.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="entityType"
                      value={typeOption.value}
                      checked={formData.entityType === typeOption.value}
                      onChange={(e) => handleChange('entityType', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                    />
                    <div className="ml-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {typeOption.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {typeOption.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Entity Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity Name *
              </label>
              <input
                type="text"
                value={formData.entityName}
                onChange={(e) => handleChange('entityName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                  errors.entityName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.entityName && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.entityName}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter entity address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Enter country"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* VAT Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                VAT Number
              </label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                placeholder="Enter VAT number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Enter additional notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Warehouses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Warehouses
              </label>
              <div className="space-y-2">
                {formData.warehouses.map((warehouse, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={warehouse}
                      onChange={(e) => {
                        const newWarehouses = [...formData.warehouses];
                        newWarehouses[index] = e.target.value;
                        setFormData(prev => ({ ...prev, warehouses: newWarehouses }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                      placeholder="Warehouse name"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newWarehouses = formData.warehouses.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, warehouses: newWarehouses }));
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, warehouses: [...prev.warehouses, ''] }));
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500 rounded-lg transition-colors"
                >
                  Add Warehouse
                </button>
              </div>
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
                    Updating Entity...
                  </>
                ) : (
                  'Update Entity'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEntityModal;
