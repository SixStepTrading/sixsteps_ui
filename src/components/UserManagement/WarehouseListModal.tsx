import React, { useState, useEffect, useCallback } from 'react';
import { fetchWarehouseStats, fetchWarehouseLogs, deleteWarehouseSupplies, removeWarehouseFromEntity, updateEntity } from '../../utils/api';
import { Entity } from '../../utils/api';

interface WarehouseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
}


interface WarehouseStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lastActivity: string;
  recentUploads: number;
}

const WarehouseListModal: React.FC<WarehouseListModalProps> = ({
  isOpen,
  onClose,
  entity
}) => {
  const [warehouseStats, setWarehouseStats] = useState<Record<string, WarehouseStats>>({});
  const [warehouseLogs, setWarehouseLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<string | null>(null);
  const [showCreateWarehouseDialog, setShowCreateWarehouseDialog] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);

  // Fetch warehouse data including logs for last activity
  const fetchWarehouseData = useCallback(async () => {
    if (!entity || !entity.warehouses || entity.warehouses.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both stats and logs for last activity
      const dataPromises = entity.warehouses.map(async (warehouse) => {
        try {
          const [stats, logs] = await Promise.all([
            fetchWarehouseStats(entity.id, warehouse),
            fetchWarehouseLogs(warehouse)
          ]);
          return { 
            warehouse, 
            stats,
            logs: logs[0] || null
          };
        } catch (err) {
          console.error(`Error fetching data for warehouse ${warehouse}:`, err);
          return { 
            warehouse, 
            stats: {
              totalProducts: 0,
              totalStock: 0,
              totalValue: 0,
              lastActivity: 'Unknown',
              recentUploads: 0
            },
            logs: null
          };
        }
      });
      
      const results = await Promise.all(dataPromises);
      const statsMap: Record<string, WarehouseStats> = {};
      const logsMap: Record<string, any> = {};
      
      results.forEach(({ warehouse, stats, logs }) => {
        statsMap[warehouse] = stats;
        if (logs) {
          logsMap[warehouse] = logs;
        }
      });
      
      setWarehouseStats(statsMap);
      setWarehouseLogs(logsMap);
    } catch (err) {
      console.error('Error fetching warehouse data:', err);
      setError('Failed to fetch warehouse data');
    } finally {
      setLoading(false);
    }
  }, [entity]);

  // Handle warehouse deletion
  const handleDeleteWarehouse = async (warehouseName: string) => {
    if (!entity) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete warehouse "${warehouseName}"?\n\nThis will:\n1. Delete all supplies in this warehouse\n2. Remove the warehouse from the entity\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setDeletingWarehouse(warehouseName);
    setError(null);
    
    try {
      // Step 1: Delete all supplies for this warehouse
      await deleteWarehouseSupplies(entity.id, warehouseName);
      
      // Step 2: Remove warehouse from entity
      await removeWarehouseFromEntity(entity.id, warehouseName);
      
      // Refresh data to reflect changes
      await fetchWarehouseData();
      
      alert(`Warehouse "${warehouseName}" has been successfully deleted.`);
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      setError(`Failed to delete warehouse: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingWarehouse(null);
    }
  };

  // Handle warehouse creation
  const handleCreateWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      setError('Warehouse name is required');
      return;
    }
    if (!entity) {
      setError('Entity not found');
      return;
    }
    
    setCreatingWarehouse(true);
    setError(null);
    
    try {
      const updatedWarehouses = [...(entity.warehouses || []), newWarehouseName.trim()];
      await updateEntity({
        entityId: entity.id,
        entityName: entity.entityName,
        entityType: entity.entityType,
        country: entity.country || 'IT',
        warehouses: updatedWarehouses,
        notes: entity.notes || '',
        status: entity.status || 'ACTIVE'
      });
      
      console.log('✅ New warehouse created:', newWarehouseName);
      await fetchWarehouseData(); // Refresh data
      setShowCreateWarehouseDialog(false);
      setNewWarehouseName('');
      alert(`Warehouse "${newWarehouseName}" has been successfully created.`);
    } catch (error) {
      console.error('❌ Error creating warehouse:', error);
      setError(error instanceof Error ? error.message : 'Failed to create warehouse');
    } finally {
      setCreatingWarehouse(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && entity) {
      fetchWarehouseData();
    }
  }, [isOpen, entity, fetchWarehouseData]);

  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (!isOpen || !entity) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-dark-bg-card rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Warehouses - {entity.entityName}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">
                Warehouse statistics and management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateWarehouseDialog(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Warehouse
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-600 dark:text-dark-text-muted">
                  Loading warehouse activity...
                </span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error Loading Activity
                    </h4>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Stock
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {entity.warehouses?.map((warehouse) => {
                      const stats = warehouseStats[warehouse];
                      const log = warehouseLogs[warehouse];
                      
                      return (
                        <tr key={warehouse} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {/* Warehouse Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {warehouse}
                            </div>
                          </td>
                          
                          {/* Products Count */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium inline-block">
                              {stats?.totalProducts || 0}
                            </div>
                          </td>
                          
                          {/* Total Stock */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium inline-block">
                              {stats?.totalStock || 0}
                            </div>
                          </td>
                          
                          {/* Total Value */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium inline-block">
                              €{stats?.totalValue?.toLocaleString() || '0'}
                            </div>
                          </td>
                          
                          {/* Last Activity */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {log ? formatTimestamp(log.timestamp) : 'No activity'}
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteWarehouse(warehouse)}
                              disabled={deletingWarehouse === warehouse}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete warehouse"
                            >
                              {deletingWarehouse === warehouse ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Create Warehouse Dialog */}
      {showCreateWarehouseDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-dark-bg-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-dark-bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-text-primary" id="modal-title">
                      Create New Warehouse
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                        Add a new warehouse to {entity?.entityName}
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="warehouse-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Warehouse Name *
                          </label>
                          <input
                            type="text"
                            id="warehouse-name"
                            value={newWarehouseName}
                            onChange={(e) => setNewWarehouseName(e.target.value)}
                            placeholder="e.g., WAREHOUSE_3, Main Warehouse, etc."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                        
                        {error && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateWarehouse}
                  disabled={creatingWarehouse || !newWarehouseName.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingWarehouse ? 'Creating...' : 'Create Warehouse'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateWarehouseDialog(false);
                    setNewWarehouseName('');
                    setError(null);
                  }}
                  disabled={creatingWarehouse}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseListModal;
