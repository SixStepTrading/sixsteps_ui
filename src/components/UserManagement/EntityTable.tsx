import React, { useState, useContext } from 'react';
import { Entity } from '../../utils/api';
import { SidebarContext } from '../../contexts/SidebarContext';
import WarehouseListModal from './WarehouseListModal';

interface EntityTableProps {
  entities: Entity[];
  totalEntities: number;
  hasActiveFilters?: boolean;
  onEditEntity: (entity: Entity) => void;
  onDeleteEntity: (entity: Entity) => void;
  onResetSupplies: (entity: Entity) => void;
}

const EntityTable: React.FC<EntityTableProps> = ({
  entities,
  totalEntities,
  hasActiveFilters = false,
  onEditEntity,
  onDeleteEntity,
  onResetSupplies
}) => {
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // Add sort state
  const [sortBy, setSortBy] = useState<string>('entityName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Warehouse modal state
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [selectedEntityForWarehouses, setSelectedEntityForWarehouses] = useState<Entity | null>(null);

  // Apply sorting
  const sortedEntities = [...entities].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'entityName':
        comparison = a.entityName.localeCompare(b.entityName);
        break;
      case 'entityType':
        comparison = a.entityType.localeCompare(b.entityType);
        break;
      case 'warehouses':
        const warehousesA = (a.warehouses || []).length;
        const warehousesB = (b.warehouses || []).length;
        comparison = warehousesA - warehousesB;
        break;
      case 'country':
        comparison = (a.country || '').localeCompare(b.country || '');
        break;
      case 'status':
        comparison = (a.status || 'ACTIVE').localeCompare(b.status || 'ACTIVE');
        break;
      case 'createdAt':
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Sorting functions
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600 dark:text-blue-400">↑</span>
      : <span className="ml-1 text-blue-600 dark:text-blue-400">↓</span>;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Handle warehouse count click
  const handleWarehouseCountClick = (entity: Entity) => {
    if ((entity.warehouses || []).length > 1) {
      setSelectedEntityForWarehouses(entity);
      setWarehouseModalOpen(true);
    }
  };

  // Handle warehouse modal close
  const handleWarehouseModalClose = () => {
    setWarehouseModalOpen(false);
    setSelectedEntityForWarehouses(null);
  };

  // Entity type color mapping
  const getEntityTypeColorClasses = (type: string) => {
    switch(type) {
      case 'SUPPLIER': return { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' };
      case 'MANAGER': return { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
      case 'PHARMACY': return { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
      case 'ADMIN': return { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
      default: return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const getAvatarColorClass = (type: string) => {
    switch(type) {
      case 'SUPPLIER': return 'bg-orange-600 dark:bg-orange-700';
      case 'MANAGER': return 'bg-purple-600 dark:bg-purple-700';
      case 'PHARMACY': return 'bg-green-600 dark:bg-green-700';
      case 'ADMIN': return 'bg-blue-600 dark:bg-blue-700';
      default: return 'bg-gray-600 dark:bg-gray-700';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="w-full flex flex-col gap-1 mb-8">
      {/* Entities counter */}
      <div className="w-full flex flex-col gap-1 mb-4">
        <div className="flex items-center justify-between mb-1 px-2">
          <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded flex items-center border dark:border-blue-800/30">
            <span className="font-medium">Total Entities:</span>
            <span className="ml-1 font-semibold text-blue-600 dark:text-blue-300">{totalEntities}</span>
          </div>
          {hasActiveFilters && (
            <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded flex items-center border dark:border-green-800/30">
              <span className="font-medium">Filtered:</span>
              <span className="ml-1 font-semibold text-green-600 dark:text-green-300">{sortedEntities.length}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Table container */}
      <div className="overflow-x-auto w-full overflow-y-visible">
        <div className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'} transition-all duration-300`}>
          {/* Table header */}
          <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-secondary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="w-[5%] text-center">#</div>
            <div className="w-[25%] cursor-pointer select-none flex items-center" onClick={() => handleSort('entityName')}>
              Entity Name {renderSortIcon('entityName')}
            </div>
            <div className="w-[15%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => handleSort('entityType')}>
              Type {renderSortIcon('entityType')}
            </div>
            <div className="w-[12%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => handleSort('warehouses')}>
              Warehouses {renderSortIcon('warehouses')}
            </div>
            <div className="w-[13%] cursor-pointer select-none flex items-center" onClick={() => handleSort('country')}>
              Country {renderSortIcon('country')}
            </div>
            <div className="w-[10%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => handleSort('status')}>
              Status {renderSortIcon('status')}
            </div>
            <div className="w-[15%] cursor-pointer select-none flex items-center" onClick={() => handleSort('createdAt')}>
              Created {renderSortIcon('createdAt')}
            </div>
            <div className="w-[15%] text-center">Notes</div>
            <div className="w-[5%] text-center">Actions</div>
          </div>
          
          {/* Table rows */}
          {sortedEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-card rounded-xl shadow dark:shadow-dark-md border border-slate-100 dark:border-dark-border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">
                {hasActiveFilters ? 'No entities match your filters' : 'No entities found'}
              </h3>
              <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">
                {hasActiveFilters 
                  ? 'Try adjusting your search criteria or filters to find entities.'
                  : 'There are no entities in the system yet.'
                }
              </p>
            </div>
          ) : (
            sortedEntities.map((entity, idx) => {
              const typeClasses = getEntityTypeColorClasses(entity.entityType);
              const statusClasses = (entity.status || 'ACTIVE') === 'ACTIVE' 
                ? { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' } 
                : { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };

              return (
                <div 
                  key={entity.id}
                  className={`
                    flex items-center px-3 py-3 bg-white dark:bg-dark-bg-card border border-gray-100 dark:border-dark-border-primary
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer
                    relative
                    rounded-xl my-1.5
                  `}
                >
                  {/* Index */}
                  <div className="w-[5%] flex items-center justify-center">
                    <span className="text-xs text-gray-600 dark:text-dark-text-muted font-medium">{idx + 1}</span>
                  </div>
                  
                  {/* Entity Name & Avatar */}
                  <div className="w-[25%] flex items-center">
                    <div className={`${getAvatarColorClass(entity.entityType)} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3`}>
                      {entity.entityName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary">
                        {entity.entityName}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-dark-text-muted">ID: {entity.id}</span>
                    </div>
                  </div>
                  
                  {/* Entity Type */}
                  <div className="w-[15%] flex justify-center">
                    <span className={`${typeClasses.bg} ${typeClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {entity.entityType}
                    </span>
                  </div>
                  
                  {/* Warehouses Count */}
                  <div className="w-[12%] flex justify-center">
                    <div className="flex items-center">
                      {(entity.warehouses || []).length > 1 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWarehouseCountClick(entity);
                          }}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                          title="Click to view warehouse activity"
                        >
                          {(entity.warehouses || []).length}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-slate-700 dark:text-dark-text-secondary">
                          {(entity.warehouses || []).length}
                        </span>
                      )}
                      {(entity.warehouses || []).length > 0 && (
                        <span className="ml-1 text-xs text-slate-500 dark:text-dark-text-muted">
                          ({entity.warehouses?.join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Country */}
                  <div className="w-[13%]">
                    <span className="text-sm text-slate-700 dark:text-dark-text-secondary">
                      {entity.country || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Status */}
                  <div className="w-[10%] flex justify-center">
                    <span className={`${statusClasses.bg} ${statusClasses.text} inline-block py-1 px-3 rounded text-xs font-medium border dark:border-opacity-30`}>
                      {entity.status || 'ACTIVE'}
                    </span>
                  </div>
                  
                  {/* Created Date */}
                  <div className="w-[15%]">
                    <span className="text-sm text-gray-500 dark:text-dark-text-muted">
                      {formatDate(entity.createdAt)}
                    </span>
                  </div>
                  
                  {/* Notes */}
                  <div className="w-[15%]">
                    <span className="text-sm text-slate-700 dark:text-dark-text-secondary truncate block max-w-[150px]" title={entity.notes || ''}>
                      {entity.notes || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="w-[5%] flex justify-center gap-1">
                    <button 
                      className="text-blue-600 dark:text-blue-400 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full group relative"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onEditEntity(entity); 
                      }}
                      aria-label="Edit entity"
                      title="Edit entity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Edit Entity
                      </div>
                    </button>
                    <button 
                      className="text-orange-600 dark:text-orange-400 p-1 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-full group relative"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onResetSupplies(entity); 
                      }}
                      aria-label="Reset supplies"
                      title="Reset all supplies for this entity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {/* Main cube/box icon */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        {/* Diagonal slash line for reset/delete indication */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" />
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Reset Supplies
                      </div>
                    </button>
                    <button 
                      className="text-red-600 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full group relative"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onDeleteEntity(entity); 
                      }}
                      aria-label="Delete entity"
                      title="Delete entity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Delete Entity
                      </div>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Warehouse List Modal */}
      <WarehouseListModal
        isOpen={warehouseModalOpen}
        onClose={handleWarehouseModalClose}
        entity={selectedEntityForWarehouses}
      />
    </div>
  );
};

export default EntityTable;