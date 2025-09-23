import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { getAllEntities, Entity, updateEntity, deleteEntity } from '../../utils/api';
import { SearchIcon, PlusIcon, FilterIcon } from '@heroicons/react/outline';
import EditEntityModal from './EditEntityModal';
import DeleteEntityModal from './DeleteEntityModal';
import CreateEntityModal from './CreateEntityModal';
import ResetSuppliesModal from './ResetSuppliesModal';
import EntityTable from './EntityTable';
import ApiErrorMessage from '../common/atoms/ApiErrorMessage';

interface EntityFilterValues {
  search: string;
  entityType: string;
  activeOnly: boolean;
}

interface EntityManagementProps {
  openCreateModal?: boolean;
}

const EntityManagement: React.FC<EntityManagementProps> = ({ openCreateModal = false }) => {
  const { showToast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState<EntityFilterValues>({
    search: '',
    entityType: '',
    activeOnly: true
  });

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetSuppliesModalOpen, setResetSuppliesModalOpen] = useState(false);
  const [showCreateEntityModal, setShowCreateEntityModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    loadEntities();
  }, []);

  useEffect(() => {
    if (openCreateModal) {
      setShowCreateEntityModal(true);
    }
  }, [openCreateModal]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      console.log('Loading entities...');
      const entitiesData = await getAllEntities();
      console.log('Entities API response:', entitiesData);
      
      if (Array.isArray(entitiesData)) {
        setEntities(entitiesData);
        setApiError(null);
        console.log('Entities set successfully:', entitiesData.length, 'entities');
      } else {
        console.warn('API returned non-array data:', entitiesData);
        setEntities([]);
        setApiError('ENTITIES_API_ERROR');
        showToast('Invalid response format from server', 'warning');
      }
    } catch (error: any) {
      console.error('Error loading entities:', error);
      setEntities([]);
      setApiError('ENTITIES_API_ERROR');
      showToast('Failed to load entities from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntity = (entity: Entity) => {
    setSelectedEntity(entity);
    setEditModalOpen(true);
  };

  const handleDeleteEntity = (entity: Entity) => {
    setSelectedEntity(entity);
    setDeleteModalOpen(true);
  };

  const handleResetSupplies = (entity: Entity) => {
    setSelectedEntity(entity);
    setResetSuppliesModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedEntity(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedEntity(null);
  };

  const handleCloseResetSuppliesModal = () => {
    setResetSuppliesModalOpen(false);
    setSelectedEntity(null);
  };

  const handleEntityUpdated = async () => {
    await loadEntities(); // Refresh the entities list
  };

  const handleEntityDeleted = async () => {
    await loadEntities(); // Refresh the entities list
  };

  const handleSuppliesReset = async () => {
    await loadEntities(); // Refresh the entities list
    showToast('Supplies reset successfully!', 'success');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadEntities();
      showToast('Data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFilterChange = (filterType: keyof EntityFilterValues, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      entityType: '',
      activeOnly: false
    });
  };

  // Apply filters to entities
  const filteredEntities = entities.filter(entity => {
    // Search filter (name, country)
    const searchMatch = !filters.search || 
      entity.entityName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (entity.country && entity.country.toLowerCase().includes(filters.search.toLowerCase()));
    
    // Entity type filter
    const typeMatch = !filters.entityType || entity.entityType === filters.entityType;
    
    // Active only filter
    const activeMatch = !filters.activeOnly || entity.status === 'ACTIVE' || !entity.status;
    
    return searchMatch && typeMatch && activeMatch;
  });

  // Get unique entity types for dropdown
  const availableEntityTypes = Array.from(new Set(entities.map(entity => entity.entityType)));

  // Calculate statistics for entity type cards
  const entityTypeStats = {
    supplier: filteredEntities.filter(e => e.entityType === 'SUPPLIER').length,
    manager: filteredEntities.filter(e => e.entityType === 'MANAGER').length,
    pharmacy: filteredEntities.filter(e => e.entityType === 'PHARMACY').length,
    admin: filteredEntities.filter(e => e.entityType === 'ADMIN').length,
  };

  return (
    <div className="space-y-6">
      {/* Entity Type Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Product suppliers and vendors</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {entityTypeStats.supplier}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Management entities</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {entityTypeStats.manager}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Pharmacy entities</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {entityTypeStats.pharmacy}
            </div>
          </div>
        </div>
        
        {/* Admin Card */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Admin</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Administrative entities</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {entityTypeStats.admin}
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
                placeholder="Search entities by name, country..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Entity Type Filter */}
            <div className="min-w-[140px]">
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                {availableEntityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Active Only Filter */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.activeOnly}
                  onChange={(e) => handleFilterChange('activeOnly', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active Only
                </span>
              </label>
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
            
            <button
              onClick={() => setShowCreateEntityModal(true)}
              className="flex items-center px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Entity
            </button>
          </div>
        </div>
      </div>
      
      {/* Entities Table or API Error Message */}
      {apiError === 'ENTITIES_API_ERROR' ? (
        <ApiErrorMessage
          title="Servizio Gestione Entità Non Disponibile"
          description="Il sistema di gestione entità non è attualmente raggiungibile. Questo impedisce la visualizzazione e la gestione delle entità."
          endpoint="/entities/get/all"
          className="min-h-[400px]"
        />
      ) : (
        <EntityTable 
          entities={filteredEntities}
          totalEntities={entities.length}
          hasActiveFilters={!!(filters.search || filters.entityType || filters.activeOnly)}
          onEditEntity={handleEditEntity}
          onDeleteEntity={handleDeleteEntity}
          onResetSupplies={handleResetSupplies}
        />
      )}

      {/* Modals */}
      <EditEntityModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        entity={selectedEntity}
        onEntityUpdated={handleEntityUpdated}
      />

      <DeleteEntityModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        entity={selectedEntity}
        onEntityDeleted={handleEntityDeleted}
      />

      <ResetSuppliesModal
        isOpen={resetSuppliesModalOpen}
        onClose={handleCloseResetSuppliesModal}
        entity={selectedEntity}
        onSuppliesReset={handleSuppliesReset}
      />
      
      <CreateEntityModal
        isOpen={showCreateEntityModal}
        onClose={() => setShowCreateEntityModal(false)}
        onEntityCreated={loadEntities}
      />
    </div>
  );
};

export default EntityManagement;
