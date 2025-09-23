import React, { useState, useEffect, useCallback } from 'react';
import { fetchWarehouseLogs, fetchWarehouseStats } from '../../utils/api';
import { Entity } from '../../utils/api';

interface WarehouseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
}

interface WarehouseLog {
  _id: string;
  timestamp: number;
  action: string;
  customAction: string;
  warehouse: string;
  entityId: string;
  details: any;
  metadata: any;
  user: any;
  ip: string;
  uploadResult?: {
    success: boolean;
    message?: string;
    totalRows?: number;
    processedRows?: number;
    created?: number;
    updated?: number;
    skipped?: number;
    uploadId?: string;
  };
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
  const [warehouseLogs, setWarehouseLogs] = useState<Record<string, WarehouseLog>>({});
  const [warehouseStats, setWarehouseStats] = useState<Record<string, WarehouseStats>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs and stats for all warehouses
  const fetchAllWarehouseData = useCallback(async () => {
    if (!entity || !entity.warehouses || entity.warehouses.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const dataPromises = entity.warehouses.map(async (warehouse) => {
        try {
          const [logs, stats] = await Promise.all([
            fetchWarehouseLogs(warehouse),
            fetchWarehouseStats(entity.id, warehouse)
          ]);
          return { 
            warehouse, 
            logs: logs[0] || null,
            stats: stats
          };
        } catch (err) {
          console.error(`Error fetching data for warehouse ${warehouse}:`, err);
          return { 
            warehouse, 
            logs: null,
            stats: {
              totalProducts: 0,
              totalStock: 0,
              totalValue: 0,
              lastActivity: 'Unknown',
              recentUploads: 0
            }
          };
        }
      });
      
      const results = await Promise.all(dataPromises);
      const logsMap: Record<string, WarehouseLog> = {};
      const statsMap: Record<string, WarehouseStats> = {};
      
      results.forEach(({ warehouse, logs, stats }) => {
        if (logs) {
          logsMap[warehouse] = logs;
        }
        statsMap[warehouse] = stats;
      });
      
      setWarehouseLogs(logsMap);
      setWarehouseStats(statsMap);
    } catch (err) {
      console.error('Error fetching warehouse data:', err);
      setError('Failed to fetch warehouse data');
    } finally {
      setLoading(false);
    }
  }, [entity]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && entity) {
      fetchAllWarehouseData();
    }
  }, [isOpen, entity, fetchAllWarehouseData]);

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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ADMIN_ACTION':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'USER_ACTION':
        return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'SYSTEM_ACTION':
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getCustomActionLabel = (customAction: string) => {
    switch (customAction) {
      case 'SUPPLY_CSV_UPLOAD_ADMIN':
        return 'Admin CSV Upload';
      case 'SUPPLY_CSV_UPLOAD':
        return 'CSV Upload';
      case 'SUPPLY_RESET':
        return 'Supplies Reset';
      case 'WAREHOUSE_CREATE':
        return 'Warehouse Created';
      case 'WAREHOUSE_UPDATE':
        return 'Warehouse Updated';
      default:
        return customAction;
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
                Warehouse Analytics - {entity.entityName}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">
                Comprehensive statistics and activity overview for all warehouses
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recent Uploads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {entity.warehouses?.map((warehouse) => {
                      const log = warehouseLogs[warehouse];
                      const stats = warehouseStats[warehouse];
                      
                      return (
                        <tr key={warehouse} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {/* Warehouse Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {warehouse}
                            </div>
                          </td>
                          
                          {/* Products Count */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-sm font-medium">
                                {stats?.totalProducts || 0}
                              </div>
                            </div>
                          </td>
                          
                          {/* Total Stock */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-sm font-medium">
                                {stats?.totalStock || 0}
                              </div>
                            </div>
                          </td>
                          
                          {/* Total Value */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-sm font-medium">
                                €{stats?.totalValue?.toLocaleString() || '0'}
                              </div>
                            </div>
                          </td>
                          
                          {/* Recent Uploads */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-sm font-medium">
                                {stats?.recentUploads || 0}
                              </div>
                            </div>
                          </td>
                          
                          {/* Last Activity */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {log ? formatTimestamp(log.timestamp) : 'No activity'}
                            </div>
                          </td>
                          
                          {/* User */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {log?.user?.name || log?.user?.email || 'N/A'}
                            </div>
                          </td>
                          
                          {/* Action */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log ? (
                              <div className="flex flex-col space-y-1">
                                <span className={`inline-block py-1 px-2 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                  {log.action}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {getCustomActionLabel(log.customAction)}
                                </span>
                                {log.uploadResult && (
                                  <div className="text-xs">
                                    <span className={log.uploadResult.success ? 'text-green-600' : 'text-red-600'}>
                                      {log.uploadResult.success ? '✓ Success' : '✗ Failed'}
                                    </span>
                                    {log.uploadResult.totalRows && (
                                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                                        ({log.uploadResult.processedRows}/{log.uploadResult.totalRows})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                No activity
                              </span>
                            )}
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
    </div>
  );
};

export default WarehouseListModal;
