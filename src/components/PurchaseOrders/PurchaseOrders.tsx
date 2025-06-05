import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { SidebarContext } from '../../contexts/SidebarContext';

// Import Tooltip component from ProductTable
import { Tooltip } from '../Dashboard/ProductTable';

// Import order data from mock data file
import { 
  mockOrders, 
  OrderWithDetails,
  acceptCounterOffer,
  rejectCounterOffer,
  BuyerPickingPreferences,
  PickingNotification,
  MOCK_BUYER_PREFERENCES,
  MOCK_PICKING_NOTIFICATIONS
} from '../../data/mockOrders';
import CounterOfferModal from '../common/molecules/CounterOfferModal';
import PickingPreferencesModal from './PickingPreferencesModal';
import PickingNotificationModal from './PickingNotificationModal';

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
  


  // State for counter offer modal
  const [counterOfferModalOpen, setCounterOfferModalOpen] = useState(false);
  const [selectedCounterOffer, setSelectedCounterOffer] = useState<{orderId: string, counterOffer: any} | null>(null);

  // New state for picking functionality
  const [buyerPreferences, setBuyerPreferences] = useState<BuyerPickingPreferences>(MOCK_BUYER_PREFERENCES);
  const [pickingPreferencesModalOpen, setPickingPreferencesModalOpen] = useState(false);
  const [pickingNotificationModalOpen, setPickingNotificationModalOpen] = useState(false);
  const [selectedPickingNotification, setSelectedPickingNotification] = useState<PickingNotification | null>(null);
  const [pickingNotifications, setPickingNotifications] = useState<PickingNotification[]>(MOCK_PICKING_NOTIFICATIONS);

  // Sorting state
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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



  // Handle opening the details page
  const handleViewDetails = (id: string) => {
    navigate(`/purchase-orders/order/${id}`);
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

  // Counter offer handlers
  const handleViewCounterOffer = (order: OrderWithDetails) => {
    if (order.counterOffer) {
      setSelectedCounterOffer({ orderId: order.id, counterOffer: order.counterOffer });
      setCounterOfferModalOpen(true);
    }
  };

  const handleAcceptCounterOffer = async (orderId: string) => {
    try {
      const success = acceptCounterOffer(orderId);
      if (success) {
        // Update local state
        const updatedOrders = orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'Approved' as any, amount: order.counterOffer?.proposedAmount || order.amount }
            : order
        );
        setOrders(updatedOrders);
        showToast('Counter offer accepted successfully', 'success');
      } else {
        showToast('Failed to accept counter offer', 'error');
      }
    } catch (error) {
      showToast('Error accepting counter offer', 'error');
    }
  };

  const handleRejectCounterOffer = async (orderId: string) => {
    try {
      const success = rejectCounterOffer(orderId);
      if (success) {
        // Update local state
        const updatedOrders = orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'Rejected' as any }
            : order
        );
        setOrders(updatedOrders);
        showToast('Counter offer rejected', 'info');
      } else {
        showToast('Failed to reject counter offer', 'error');
      }
    } catch (error) {
      console.error('Error rejecting counter offer:', error);
      showToast('Error rejecting counter offer', 'error');
    }
    setCounterOfferModalOpen(false);
    setSelectedCounterOffer(null);
  };

  // New picking-related handlers
  const handleOpenPickingPreferences = () => {
    setPickingPreferencesModalOpen(true);
  };

  const handlePickingPreferencesUpdated = (preferences: BuyerPickingPreferences) => {
    setBuyerPreferences(preferences);
  };

  const handleViewPickingNotification = (notification: PickingNotification) => {
    setSelectedPickingNotification(notification);
    setPickingNotificationModalOpen(true);
  };

  const handlePickingDecisionMade = (decision: 'accept' | 'reject' | 'request_alternatives') => {
    // Update order status based on decision
    if (selectedPickingNotification) {
      const updatedOrders = orders.map(order => {
        if (order.id === selectedPickingNotification.orderId) {
          let newStatus: OrderWithDetails['status'] = order.status;
          if (decision === 'accept') {
            newStatus = 'Partial Approved';
          } else if (decision === 'reject') {
            newStatus = 'Rejected';
          } else if (decision === 'request_alternatives') {
            newStatus = 'Counter Offer';
          }
          return { ...order, status: newStatus, hasPartialPickingApproval: decision === 'accept' };
        }
        return order;
      });
      setOrders(updatedOrders);

      // Mark notification as acknowledged
      const updatedNotifications = pickingNotifications.map(notif =>
        notif.id === selectedPickingNotification.id
          ? { ...notif, acknowledged: true }
          : notif
      );
      setPickingNotifications(updatedNotifications);
    }
  };

  const getUnacknowledgedPickingCount = () => {
    return pickingNotifications.filter(notif => !notif.acknowledged).length;
  };

  // Get status chip style and text
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      case 'Pending Approval':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'Approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'Counter Offer':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'Picking Required':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'Partial Approved':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  // Sorting logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'orderId':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'date':
        comparison = new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'products':
        comparison = a.totalProducts - b.totalProducts;
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'delivery':
        // Prioritize delivered, then by delivery date
        if (a.deliveryStatus === b.deliveryStatus) {
          if (a.deliveryDate && b.deliveryDate) {
            comparison = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
          } else {
            comparison = 0;
          }
        } else {
          comparison = (a.deliveryStatus || '').localeCompare(b.deliveryStatus || '');
        }
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Sorting icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300 dark:text-dark-text-disabled">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600 dark:text-blue-400">↑</span>
      : <span className="ml-1 text-blue-600 dark:text-blue-400">↓</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-500 dark:text-dark-text-muted text-sm">View and track your purchase orders</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Picking Notifications Badge */}
          {getUnacknowledgedPickingCount() > 0 && (
            <button
              onClick={() => {
                const unacknowledged = pickingNotifications.find(n => !n.acknowledged);
                if (unacknowledged) handleViewPickingNotification(unacknowledged);
              }}
              className="relative flex items-center gap-1 bg-orange-600 dark:bg-orange-700 text-white text-sm py-1 px-3 rounded hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              Picking Alert
              <span className="absolute -top-2 -right-2 bg-red-500 dark:bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getUnacknowledgedPickingCount()}
              </span>
            </button>
          )}
          
          {/* Picking Preferences Button */}
          <button
            onClick={handleOpenPickingPreferences}
            className="flex items-center gap-1 border border-gray-500 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-secondary text-sm py-1 px-3 rounded hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Picking Settings
          </button>

        <button
            className="flex items-center gap-1 bg-blue-600 dark:bg-blue-700 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          onClick={handleCreateOda}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Order
          </button>
          <button 
            className="flex items-center gap-1 border border-gray-500 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-secondary text-sm py-1 px-3 rounded hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors"
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
      <div className="mb-6 bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg border dark:border-dark-border-primary">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[1000px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500 dark:text-dark-text-muted">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search orders by ID..." 
                className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm text-gray-900 dark:text-dark-text-primary"
                value={filterValues.searchTerm || ''}
                onChange={(e) => handleFilterChange({...filterValues, searchTerm: e.target.value})}
        />
      </div>

            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm text-gray-900 dark:text-dark-text-primary"
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
                className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm text-gray-900 dark:text-dark-text-primary"
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
          <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded flex items-center">
            <span className="font-medium">Total Orders:</span>
            <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">{filteredOrders.length}</span>
          </div>
        </div>
        
        {/* Table container with only horizontal scroll, ensuring no max-height is applied anywhere */}
        <div className="overflow-x-auto w-full overflow-y-visible">
          <div className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'} transition-all duration-300`}>
            {/* Header columns - sortable */}
            <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-tertiary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
              <div className="w-[4%] text-center">#</div>
              <div className="w-[15%] cursor-pointer select-none flex items-center" onClick={() => {
                if (sortBy === 'orderId') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                else { setSortBy('orderId'); setSortDirection('asc'); }
              }}>
                Order ID {renderSortIcon('orderId')}
              </div>
              <div className="w-[12%] cursor-pointer select-none flex items-center" onClick={() => {
                if (sortBy === 'date') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                else { setSortBy('date'); setSortDirection('desc'); }
              }}>
                Date {renderSortIcon('date')}
              </div>
              <div className="w-[15%] cursor-pointer select-none flex items-center" onClick={() => {
                if (sortBy === 'status') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                else { setSortBy('status'); setSortDirection('asc'); }
              }}>
                Status {renderSortIcon('status')}
              </div>
              <div className="w-[12%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => {
                if (sortBy === 'products') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                else { setSortBy('products'); setSortDirection('desc'); }
              }}>
                Products {renderSortIcon('products')}
              </div>
              <div className="w-[12%] text-right cursor-pointer select-none flex items-center justify-end" onClick={() => {
                if (sortBy === 'amount') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                else { setSortBy('amount'); setSortDirection('desc'); }
              }}>
                Amount {renderSortIcon('amount')}
              </div>
              <div className="w-[15%] cursor-pointer select-none flex items-center" onClick={() => {
                if (sortBy === 'delivery') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                else { setSortBy('delivery'); setSortDirection('asc'); }
              }}>
                Delivery {renderSortIcon('delivery')}
              </div>
              <div className="w-[15%] text-center">Actions</div>
            </div>

            {/* Rows */}
            {sortedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-secondary rounded-xl shadow border border-slate-100 dark:border-dark-border-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-dark-text-disabled mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">No orders found</h3>
                <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">Try adjusting your search or filter criteria to find orders.</p>
              </div>
            ) : (
              sortedOrders.map((order, idx) => {
                const isOrderSelected = isSelected(order.id);
                
                return (
                  <div
                    key={order.id}
                    className={`
                      flex items-center px-3 py-3 bg-white dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border-primary
                      ${idx === sortedOrders.length - 1 ? 'rounded-b-lg' : ''}
                      ${isOrderSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer
                      transition-colors duration-150
                      relative
                      rounded-xl my-1.5
                    `}
                    onClick={() => handleViewDetails(order.id)}
                  >
                    {/* Row number only - removed checkbox */}
                    <div className="w-[4%] flex items-center justify-center">
                      <span className="text-xs text-gray-600 dark:text-dark-text-muted font-medium text-center">{idx + 1}</span>
                    </div>

                    {/* Order ID */}
                    <div className="w-[15%] flex flex-col">
                      <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary">{order.id}</span>
                    </div>

                    {/* Created Date */}
                    <div className="w-[12%]">
                      <span className="text-sm text-slate-600 dark:text-dark-text-muted">{order.createdOn}</span>
                    </div>

                    {/* Status */}
                    <div className="w-[15%] flex justify-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Products Info */}
                    <div className="w-[12%] flex flex-col items-center text-xs">
                      <div className="text-slate-600 dark:text-dark-text-muted">
                        <span className="font-medium">{order.totalProducts}</span> Products
                      </div>
                      <div className="text-slate-600 dark:text-dark-text-muted">
                        <span className="font-medium">{order.items}</span> Items
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="w-[12%] text-right">
                      <span className="font-semibold text-sm text-slate-700 dark:text-dark-text-primary">€{order.amount.toFixed(2)}</span>
                    </div>

                    {/* Delivery Info - Leave empty for Draft status */}
                    <div className="w-[15%] flex flex-col items-center text-xs">
                      {order.status !== 'Draft' && (
                        <>
                          {order.deliveryStatus && (
                            <span className={`text-sm ${order.deliveryStatus === 'Delivered' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {order.deliveryStatus}
                            </span>
                          )}
                          {order.deliveryDate && (
                            <span className="text-slate-600 dark:text-dark-text-muted">{order.deliveryDate}</span>
                          )}
                          {order.estimatedDelivery && !order.deliveryDate && (
                            <span className="text-slate-600 dark:text-dark-text-muted">Est: {order.estimatedDelivery}</span>
                          )}
                          {order.completion !== undefined && (
                            <div className="w-full mt-1 bg-gray-200 dark:bg-dark-bg-tertiary rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full" 
                                style={{ width: `${order.completion}%` }}
                              ></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="w-[15%] flex justify-end space-x-2">
                      <button
                        className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(order.id);
                        }}
                      >
                        View Details
                      </button>
                      
                      {order.status === 'Approved' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
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
                          className="px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50"
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
                          className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrack(order.id);
                          }}
                        >
                          Track
                        </button>
                      )}
                      
                      {order.status === 'Counter Offer' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCounterOffer(order);
                          }}
                        >
                          View Offer
                        </button>
                      )}
                      
                      {order.status === 'Picking Required' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 rounded hover:bg-orange-200 dark:hover:bg-orange-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            const notification = pickingNotifications.find(n => n.orderId === order.id && !n.acknowledged);
                            if (notification) handleViewPickingNotification(notification);
                          }}
                        >
                          Review Picking
                        </button>
                      )}
                      
                      {order.status === 'Partial Approved' && (
                        <button
                          className="px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrack(order.id);
                          }}
                        >
                          Track Partial
                        </button>
                      )}
                      
                      {order.status === 'Draft' && (
                        <>
                          <button
                            className="px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(order.id);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
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
      
      {/* Counter Offer Modal */}
      {selectedCounterOffer && (
        <CounterOfferModal
          open={counterOfferModalOpen}
          onClose={() => {
            setCounterOfferModalOpen(false);
            setSelectedCounterOffer(null);
          }}
          counterOffer={selectedCounterOffer.counterOffer}
          orderId={selectedCounterOffer.orderId}
          onAccept={handleAcceptCounterOffer}
          onReject={handleRejectCounterOffer}
        />
      )}

      {/* Picking Preferences Modal */}
      <PickingPreferencesModal
        open={pickingPreferencesModalOpen}
        onClose={() => setPickingPreferencesModalOpen(false)}
        currentPreferences={buyerPreferences}
        buyerId="current-buyer-id" // In a real app, this would come from user context
        onPreferencesUpdated={handlePickingPreferencesUpdated}
      />

      {/* Picking Notification Modal */}
      {selectedPickingNotification && (
        <PickingNotificationModal
          open={pickingNotificationModalOpen}
          onClose={() => {
            setPickingNotificationModalOpen(false);
            setSelectedPickingNotification(null);
          }}
          notification={selectedPickingNotification}
          pickingDetails={selectedPickingNotification.orderId === 'ODA-2594' ? {
            id: 'PD-001',
            originalQuantity: 100,
            availableQuantity: 65,
            allocatedQuantity: 65,
            reason: 'Current stock limitation - high demand product',
            alternativeProducts: [
              {
                productId: 'P003-ALT',
                productName: 'VOLTAREN GEL 50g (Alternative)',
                quantity: 35,
                unitPrice: 11.80
              }
            ],
            estimatedRestockDate: 'May 22, 2025',
            supplierComment: 'Premium alternative available with similar efficacy'
          } : undefined}
          onDecisionMade={handlePickingDecisionMade}
        />
      )}
    </div>
  );
};

export default PurchaseOrders; 