import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Entity, CreateEntityData, getAllEntities, createEntity } from '../../utils/api';

interface EntitySelectionStepProps {
  selectedEntity: Entity | null;
  onEntitySelected: (entity: Entity) => void;
  onNext: () => void;
}

const EntitySelectionStep: React.FC<EntitySelectionStepProps> = ({
  selectedEntity,
  onEntitySelected,
  onNext
}) => {
  const { showToast } = useToast();
  const [entityMode, setEntityMode] = useState<'existing' | 'new'>('existing');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  
  // New entity form data
  const [newEntityData, setNewEntityData] = useState<CreateEntityData>({
    entityType: 'PHARMA',
    entityName: '',
    country: 'ITALY',
    notes: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (entityMode === 'existing') {
      loadEntities();
    }
  }, [entityMode]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      console.log('Loading entities...');
      const entitiesData = await getAllEntities();
      console.log('Entities API response:', entitiesData);
      
      if (Array.isArray(entitiesData)) {
        setEntities(entitiesData);
        console.log('Entities set successfully:', entitiesData.length, 'entities');
      } else {
        console.warn('API returned non-array data:', entitiesData);
        setEntities([]);
        showToast('Invalid response format from server', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading entities:', error);
      setEntities([]); // Ensure entities is always an array
      showToast('Failed to load entities from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEntityModeChange = (mode: 'existing' | 'new') => {
    setEntityMode(mode);
    setSelectedEntityId('');
    onEntitySelected(null as any); // Clear selection
  };

  const handleExistingEntitySelect = (entityId: string) => {
    setSelectedEntityId(entityId);
    const entity = entities.find(e => e.id === entityId);
    if (entity) {
      onEntitySelected(entity);
    }
  };

  const handleNewEntityDataChange = (field: keyof CreateEntityData, value: string) => {
    setNewEntityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateNewEntity = async () => {
    if (!newEntityData.entityName.trim()) {
      showToast('Entity name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const createdEntity = await createEntity(newEntityData);
      onEntitySelected(createdEntity);
      showToast(`Entity "${createdEntity.entityName}" created successfully!`, 'success');
    } catch (error: any) {
      console.error('Error creating entity:', error);
      showToast(error.message || 'Failed to create entity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!selectedEntity) {
      showToast('Please select or create an entity first', 'warning');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select Business Entity
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose an existing entity or create a new one for this user
        </p>
      </div>

      {/* Entity Mode Selection */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Entity Selection Method
        </h4>
        <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0">
          <label className="flex items-center cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <input
              type="radio"
              name="entityMode"
              value="existing"
              checked={entityMode === 'existing'}
              onChange={() => handleEntityModeChange('existing')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Use Existing Entity
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select from existing business entities
              </p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <input
              type="radio"
              name="entityMode"
              value="new"
              checked={entityMode === 'new'}
              onChange={() => handleEntityModeChange('new')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Create New Entity
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create a new business entity
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Existing Entity Selection */}
      {entityMode === 'existing' && (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Select Entity
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading entities...</span>
              </div>
            ) : (
              <select
                value={selectedEntityId}
                onChange={(e) => handleExistingEntitySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select an entity...</option>
                {Array.isArray(entities) && entities.length > 0 ? (
                  entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.entityName} ({entity.entityType})
                    </option>
                  ))
                ) : (
                  !loading && <option value="" disabled>No entities available</option>
                )}
              </select>
            )}
          </div>

          {selectedEntity && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">Selected Entity</h4>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p><strong>Name:</strong> {selectedEntity.entityName}</p>
                <p><strong>Type:</strong> {selectedEntity.entityType}</p>
                {selectedEntity.country && <p><strong>Country:</strong> {selectedEntity.country}</p>}
                {selectedEntity.status && <p><strong>Status:</strong> {selectedEntity.status}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Entity Creation Form */}
      {entityMode === 'new' && (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Create New Entity
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Fill in the details to create a new business entity
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity Type *
              </label>
              <select
                value={newEntityData.entityType}
                onChange={(e) => handleNewEntityDataChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="PHARMA">Pharmacy</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="LANDLORD">Landlord</option>
                <option value="TENANT">Tenant</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity Name *
              </label>
              <input
                type="text"
                value={newEntityData.entityName}
                onChange={(e) => handleNewEntityDataChange('entityName', e.target.value)}
                placeholder="e.g., DrugStore Inc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={newEntityData.country}
                onChange={(e) => handleNewEntityDataChange('country', e.target.value)}
                placeholder="e.g., ITALY"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={newEntityData.status}
                onChange={(e) => handleNewEntityDataChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={newEntityData.notes}
              onChange={(e) => handleNewEntityDataChange('notes', e.target.value)}
              placeholder="Additional notes about this entity..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreateNewEntity}
              disabled={submitting || !newEntityData.entityName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Entity'
              )}
            </button>
          </div>

          {selectedEntity && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200">✅ Entity Created Successfully!</h4>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p><strong>Name:</strong> {selectedEntity.entityName}</p>
                <p><strong>Type:</strong> {selectedEntity.entityType}</p>
                <p><strong>ID:</strong> {selectedEntity.id}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Entity Summary */}
      {selectedEntity && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Entity Selected: {selectedEntity.entityName}
              </h4>
              <div className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                <span className="font-medium">Type:</span> {selectedEntity.entityType} • 
                <span className="font-medium ml-2">Status:</span> {selectedEntity.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleNext}
          disabled={!selectedEntity}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next: Create User
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EntitySelectionStep; 