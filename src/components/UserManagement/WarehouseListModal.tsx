import React, { useState, useEffect } from 'react';
import { fetchWarehouseLogs } from '../../utils/api';
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
}

const WarehouseListModal: React.FC<WarehouseListModalProps> = ({
  isOpen,
  onClose,
  entity
}) => {
  const [warehouseLogs, setWarehouseLogs] = useState<Record<string, WarehouseLog>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs for all warehouses
  const fetchAllWarehouseLogs = async () => {
    if (!entity || !entity.warehouses || entity.warehouses.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const logPromises = entity.warehouses.map(async (warehouse) => {
        try {
          const logs = await fetchWarehouseLogs(warehouse);
          return { warehouse, logs: logs[0] || null };
        } catch (err) {
          console.error(`Error fetching logs for warehouse ${warehouse}:`, err);
          return { warehouse, logs: null };
        }
      });
      
      const results = await Promise.all(logPromises);
      const logsMap: Record<string, WarehouseLog> = {};
      
      results.forEach(({ warehouse, logs }) => {
        if (logs) {
          logsMap[warehouse] = logs;
        }
      });
      
      setWarehouseLogs(logsMap);
    } catch (err) {
      console.error('Error fetching warehouse logs:', err);
      setError('Failed to fetch warehouse activity logs');
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs when modal opens
  useEffect(() => {
    if (isOpen && entity) {
      fetchAllWarehouseLogs();
    }
  }, [isOpen, entity]);

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
                Warehouse Activity - {entity.entityName}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-muted">
                Last activity for each warehouse
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
              <div className="space-y-3">
                {entity.warehouses?.map((warehouse) => {
                  const log = warehouseLogs[warehouse];
                  
                  return (
                    <div 
                      key={warehouse}
                      className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {warehouse}
                        </h4>
                        {log ? (
                          <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                            Last activity: {formatTimestamp(log.timestamp)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            No activity found
                          </span>
                        )}
                      </div>
                      
                      {log ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-block py-1 px-2 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-dark-text-secondary">
                              {getCustomActionLabel(log.customAction)}
                            </span>
                          </div>
                          
                          {log.details && (
                            <div className="text-xs text-gray-500 dark:text-dark-text-muted">
                              <div>IP: {log.ip}</div>
                              {log.user && (
                                <div>User: {log.user.name || log.user.email || 'Unknown'}</div>
                              )}
                              {log.uploadResult && (
                                <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                                  <div className="font-medium">Upload Result:</div>
                                  <div>Success: {log.uploadResult.success ? 'Yes' : 'No'}</div>
                                  {log.uploadResult.message && (
                                    <div>Message: {log.uploadResult.message}</div>
                                  )}
                                  {log.uploadResult.totalRows && (
                                    <div>Rows: {log.uploadResult.processedRows}/{log.uploadResult.totalRows}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 dark:text-gray-500">
                          No recent activity recorded for this warehouse
                        </div>
                      )}
                    </div>
                  );
                })}
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
