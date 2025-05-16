import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { SidebarContext } from '../../contexts/SidebarContext';

// Import Tooltip component from ProductTable
import { Tooltip } from '../Dashboard/ProductTable';
import OrderDetailsModal from '../common/molecules/OrderDetailsModal';

// Import the OrderDetailData type from the OrderDetailsModal
import type { OrderDetailData } from '../common/molecules/OrderDetailsModal';

// Import order data from mock data file
import { 
  mockOrders, 
  ORDER_DETAILS, 
  ORDER_ADDITIONAL_INFO, 
  getOrderDetails,
  OrderWithDetails,
  OrderDetailData as MockOrderDetailData
} from '../../data/mockOrders';

// Dati dei prodotti che simulano quelli della dashboard
const DASHBOARD_PRODUCTS = [
  {
    id: 'P001',
    code: 'ALVG-001',
    name: 'ALVITA GINOCCHIERA',
    price: 22.50
  },
  {
    id: 'P002',
    code: 'BIOD-002',
    name: 'BIODERMA ATODERM',
    price: 15.80
  },
  {
    id: 'P003',
    code: 'ZERO-003',
    name: 'ZERODOL GEL',
    price: 12.40
  },
  {
    id: 'P004',
    code: 'ENTG-004',
    name: 'ENTEROGERMINA 2MLD',
    price: 9.90
  },
  {
    id: 'P005',
    code: 'OMEG-005',
    name: 'OMEGA 3 PLUS',
    price: 18.70
  },
  {
    id: 'P006',
    code: 'VITC-006',
    name: 'VITAMINA C 1000MG',
    price: 11.25
  }
];

const PurchaseOrders: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // State for orders and filtering
  const [orders, setOrders] = useState<OrderWithDetails[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>(mockOrders);
  const [selected, setSelected] = useState<string[]>([]);
  
  // Filter values using the same structure as Dashboard
  const [filterValues, setFilterValues] = useState({
    searchTerm: '',
    status: '',
    dateRange: 'last30days'
  });
  
  // Available filter options
  const [statuses] = useState([
    'Draft',
    'Pending Approval',
    'Processing',
    'Approved'
  ]);

  const [dateRanges] = useState([
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'last60days', label: 'Last 60 days' },
    { value: 'last90days', label: 'Last 90 days' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]);
  
  // State for the details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetailData | null>(null);

  // Filter orders based on selected criteria
  useEffect(() => {
    let result = [...orders];
    
    // Filter by search term
    if (filterValues.searchTerm) {
      const searchTerm = filterValues.searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by status
    if (filterValues.status) {
      result = result.filter(order => order.status === filterValues.status);
    }
    
    // Date filter would be implemented here with real data
    
    setFilteredOrders(result);
  }, [orders, filterValues]);

  // Handle filter changes
  const handleFilterChange = (newValues: any) => {
    setFilterValues(newValues);
  };

  // Reset filters
  const handleRefresh = () => {
    setFilterValues({
      searchTerm: '',
      status: '',
      dateRange: 'last30days'
    });
    setSelected([]);
  };

  // Handle creating a new purchase order
  const handleCreateOda = () => {
    showToast('Creating new purchase order...', 'info');
  };

  // Convert MockOrderDetailData to OrderDetailData (compatible with OrderDetailsModal)
  const convertOrderDetailData = (data: MockOrderDetailData): OrderDetailData => {
    return {
      ...data,
      status: data.status as "Approved" | "Pending Approval" | "Processing" | "Draft"
    };
  };

  // Handle opening the details modal
  const handleViewDetails = (id: string) => {
    try {
      const details = getOrderDetails(id);
      if (details) {
        // Convert to the expected type
        setSelectedOrderDetails(convertOrderDetailData(details));
      setDetailsModalOpen(true);
      } else {
        showToast(`Failed to load order details: Order not found`, 'error');
      }
    } catch (error) {
      showToast(`Failed to load order details: ${error}`, 'error');
    }
  };

  // Handle item selection
  const isSelected = (id: string) => selected.includes(id);

  // Toggle selection
  const handleSelect = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      // Add to selection
      newSelected = [...selected, id];
    } else {
      // Remove from selection
      newSelected = selected.filter(selectedId => selectedId !== id);
    }

    setSelected(newSelected);
  };

  // Action handlers
  const handleReorder = (id: string) => showToast(`Reordering order ${id}`, 'info');
  const handleEdit = (id: string) => showToast(`Editing order ${id}`, 'info');
  const handleDelete = (id: string) => showToast(`Order ${id} has been deleted`, 'success');
  const handleTrack = (id: string) => showToast(`Tracking information for order ${id}`, 'info');
  const handleFollowUp = (id: string) => showToast(`Follow up email sent for order ${id}`, 'success');
  const handleSubmit = (id: string) => showToast(`Draft order ${id} submitted for approval`, 'success');
  const handleContinueEditing = (id: string) => showToast(`Continuing to edit order ${id}`, 'info');
  const handlePrintOrder = () => showToast('Printing order...', 'info');
  const handleDownloadOrder = () => showToast('Order downloaded as PDF', 'success');

  // Get status chip style and text
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex-grow p-3 pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium">Purchase Orders</h1>
          <p className="text-gray-500 text-sm">Manage and track your purchase orders</p>
        </div>
        <div className="flex gap-2 items-center">
        <button
            className="flex items-center gap-1 bg-blue-600 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 transition-colors"
          onClick={handleCreateOda}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Order
          </button>
          <button 
            className="flex items-center gap-1 border border-gray-500 text-gray-700 text-sm py-1 px-3 rounded hover:bg-gray-50 transition-colors"
            onClick={handleRefresh}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
            Refresh
        </button>
        </div>
      </div>

      {/* Filter controls (using Dashboard style) */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[1000px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search orders by ID..." 
                className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filterValues.searchTerm || ''}
                onChange={(e) => handleFilterChange({...filterValues, searchTerm: e.target.value})}
        />
      </div>

            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filterValues.status || ''}
                onChange={(e) => handleFilterChange({...filterValues, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filterValues.dateRange || 'last30days'}
                onChange={(e) => handleFilterChange({...filterValues, dateRange: e.target.value})}
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders table using ProductTable style */}
      <div className="w-full flex flex-col gap-1 mb-8">
        <div className="flex items-center mb-1 px-2">
          <div className="text-xs text-slate-600 bg-blue-50 px-3 py-1 rounded flex items-center">
            <span className="font-medium">Total Orders:</span>
            <span className="ml-1 font-semibold text-blue-600">{filteredOrders.length}</span>
          </div>
        </div>
        
        {/* Table container with only horizontal scroll, ensuring no max-height is applied anywhere */}
        <div className="overflow-x-auto w-full overflow-y-visible">
          <div className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'} transition-all duration-300`}>
            {/* Header columns */}
            <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 font-semibold tracking-wider bg-gray-50 rounded-t-lg rounded-xl my-1.5 border-b border-gray-200">
              <div className="w-[4%] text-center">#</div>
              <div className="w-[15%]">Order ID</div>
              <div className="w-[12%]">Date</div>
              <div className="w-[10%] text-center">Status</div>
              <div className="w-[12%] text-center">Products</div>
              <div className="w-[12%] text-right">Total Amount</div>
              <div className="w-[15%] text-center">Delivery</div>
              <div className="w-[20%] text-right">Actions</div>
            </div>

            {/* Rows */}
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl shadow border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                <p className="text-gray-500 mt-1 max-w-md">Try adjusting your search or filter criteria to find orders.</p>
              </div>
            ) : (
              filteredOrders.map((order, idx) => {
                const isOrderSelected = isSelected(order.id);
                
                return (
                  <div
                    key={order.id}
                    className={`
                      flex items-center px-3 py-3 bg-white border border-gray-100 last:rounded-b-lg
                      ${isOrderSelected ? 'bg-blue-50' : ''}
                      hover:bg-blue-50 cursor-pointer
                      relative
                      rounded-xl my-1.5
                    `}
                    onClick={() => handleViewDetails(order.id)}
                  >
                    {/* Row number only - removed checkbox */}
                    <div className="w-[4%] flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium text-center">{idx + 1}</span>
                    </div>

                    {/* Order ID */}
                    <div className="w-[15%] flex flex-col">
                      <span className="font-medium text-sm text-slate-800">{order.id}</span>
                    </div>

                    {/* Created Date */}
                    <div className="w-[12%]">
                      <span className="text-sm text-slate-600">{order.createdOn}</span>
                    </div>

                    {/* Status */}
                    <div className="w-[10%] flex justify-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Products Info */}
                    <div className="w-[12%] flex flex-col items-center text-xs">
                      <div className="text-slate-600">
                        <span className="font-medium">{order.totalProducts}</span> Products
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium">{order.items}</span> Items
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="w-[12%] text-right">
                      <span className="font-semibold text-sm text-slate-700">€{order.amount.toFixed(2)}</span>
                    </div>

                    {/* Delivery Info - Leave empty for Draft status */}
                    <div className="w-[15%] flex flex-col items-center text-xs">
                      {order.status !== 'Draft' && (
                        <>
                          {order.deliveryStatus && (
                            <span className={`text-sm ${order.deliveryStatus === 'Delivered' ? 'text-green-600' : 'text-blue-600'}`}>
                              {order.deliveryStatus}
                            </span>
                          )}
                          {order.deliveryDate && (
                            <span className="text-slate-600">{order.deliveryDate}</span>
                          )}
                          {order.estimatedDelivery && !order.deliveryDate && (
                            <span className="text-slate-600">Est: {order.estimatedDelivery}</span>
                          )}
                          {order.completion !== undefined && (
                            <div className="w-full mt-1 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${order.completion}%` }}
                              ></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="w-[20%] flex justify-end space-x-2">
                      <button
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(order.id);
                        }}
                      >
                        View Details
                      </button>
                      
                      {order.status === 'Approved' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(order.id);
                          }}
                        >
                          Reorder
                        </button>
                      )}
                      
                      {order.status === 'Pending Approval' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowUp(order.id);
                          }}
                        >
                          Follow Up
                        </button>
                      )}
                      
                      {order.status === 'Processing' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrack(order.id);
                          }}
                        >
                          Track
                        </button>
                      )}
                      
                      {order.status === 'Draft' && (
                        <>
                          <button
                            className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(order.id);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmit(order.id);
                            }}
                          >
                            Submit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <OrderDetailsModal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          orderDetails={selectedOrderDetails}
          onPrint={handlePrintOrder}
          onDownload={handleDownloadOrder}
        />
      )}
    </div>
  );
};

export default PurchaseOrders; 