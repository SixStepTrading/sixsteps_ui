import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { mockOrders, OrderWithDetails, OrderStatus, CounterOfferDetail } from '../../data/mockOrders';
import OrderStatCard from '../common/OrderStatCard';
import { SidebarContext } from '../../contexts/SidebarContext';
import { v4 as uuidv4 } from 'uuid';

// Status constants for Admin actions
enum AdminAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  COUNTER_OFFER = 'counter_offer'
}

// Simulated order statistics for Admin dashboard
interface OrderStats {
  totalOrders: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  processingTime: string;
  approvalRate: number;
}

const ManageOrders: React.FC = () => {
  const { showToast } = useToast();
  const { isDrawerCollapsed } = useContext(SidebarContext);
  const navigate = useNavigate();
  
  // State for buyers' orders
  const [buyerOrders, setBuyerOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Filter values
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    buyer: '',
    dateRange: 'last30days',
  });
  
  // Stats for the summary cards
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    processingTime: '1.2 days',
    approvalRate: 0
  });
  
  // State for counter offer modal
  const [counterOfferModalOpen, setCounterOfferModalOpen] = useState(false);
  const [selectedOrderForCounter, setSelectedOrderForCounter] = useState<string | null>(null);
  const [counterOfferDetails, setCounterOfferDetails] = useState({
    newAmount: 0,
    message: '',
  });
  
  // Sort state
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Simulated list of buyers
  const [buyers] = useState([
    { id: 'B001', name: 'Pharmacy One' },
    { id: 'B002', name: 'MediPlus' },
    { id: 'B003', name: 'HealthCare Pharmacy' },
    { id: 'B004', name: 'QuickMeds' }
  ]);
  
  // Load orders on component mount
  useEffect(() => {
    // In a real app, this would fetch only buyers' orders
    // For now, filter mock orders to simulate buyer orders
    // Admin should not see Draft orders as they haven't been submitted yet
    const buyersData = mockOrders
      .filter(order => order.status !== 'Draft') // Admin doesn't see draft orders
      .map(order => ({
      ...order,
      buyerId: buyers[Math.floor(Math.random() * buyers.length)].id,
      buyerName: buyers[Math.floor(Math.random() * buyers.length)].name,
    }));
    
    setBuyerOrders(buyersData);
    setFilteredOrders(buyersData);
    
    // Calculate stats
    updateOrderStats(buyersData);
  }, [buyers]);
  
  // Calculate and update order statistics
  const updateOrderStats = (orders: OrderWithDetails[]) => {
    const pendingCount = orders.filter(order => order.status === 'Pending Approval').length;
    const approvedCount = orders.filter(order => order.status === 'Approved').length;
    const rejectedCount = orders.filter(order => order.status === 'Rejected').length || 0;
    
    setOrderStats({
      totalOrders: orders.length,
      pendingApproval: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      processingTime: '1.2 days', // Example static value
      approvalRate: approvedCount > 0 
        ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100) 
        : 0
    });
  };
  
  // Filter orders when filter values change
  useEffect(() => {
    let result = [...buyerOrders];
    
    // Filter by search term (order ID or buyer name)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(term) || 
        order.buyerName?.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (filters.status) {
      result = result.filter(order => order.status === filters.status);
    }
    
    // Filter by buyer
    if (filters.buyer) {
      result = result.filter(order => order.buyerId === filters.buyer);
    }
    
    // Date range filtering would be implemented here
    
    setFilteredOrders(result);
  }, [buyerOrders, filters]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({...filters, ...newFilters});
  };
  
  // Refresh filters
  const handleRefresh = () => {
    setFilters({
      searchTerm: '',
      status: '',
      buyer: '',
      dateRange: 'last30days',
    });
    setSelectedOrderIds([]);
  };
  
  // Handle selecting/deselecting orders
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };
  
  // Select all orders
  const selectAllOrders = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      // If all are selected, deselect all
      setSelectedOrderIds([]);
    } else {
      // Otherwise select all
      setSelectedOrderIds(filteredOrders.map(order => order.id));
    }
  };
  
  // Admin actions
  const handleBulkAction = (action: AdminAction) => {
    if (selectedOrderIds.length === 0) {
      showToast('Please select at least one order', 'warning');
      return;
    }
    
    if (action === AdminAction.COUNTER_OFFER && selectedOrderIds.length > 1) {
      showToast('Counter offers can only be sent to one order at a time', 'warning');
      return;
    }
    
    switch (action) {
      case AdminAction.APPROVE:
        // Update orders status to Approved
        const approvedOrders = buyerOrders.map(order => 
          selectedOrderIds.includes(order.id)
            ? {...order, status: 'Approved' as OrderStatus}
            : order
        );
        setBuyerOrders(approvedOrders);
        updateOrderStats(approvedOrders);
        showToast(`${selectedOrderIds.length} order(s) approved`, 'success');
        setSelectedOrderIds([]);
        break;
        
      case AdminAction.REJECT:
        // Update orders status to Rejected 
        const rejectedOrders = buyerOrders.map(order => 
          selectedOrderIds.includes(order.id)
            ? {...order, status: 'Rejected' as OrderStatus}
            : order
        );
        setBuyerOrders(rejectedOrders);
        updateOrderStats(rejectedOrders);
        showToast(`${selectedOrderIds.length} order(s) rejected`, 'success');
        setSelectedOrderIds([]);
        break;
        
      case AdminAction.COUNTER_OFFER:
        // Open counter offer modal for the selected order
        setSelectedOrderForCounter(selectedOrderIds[0]);
        setCounterOfferModalOpen(true);
        
        // Pre-fill with current order amount
        const selectedOrder = buyerOrders.find(order => order.id === selectedOrderIds[0]);
        if (selectedOrder) {
          setCounterOfferDetails({
            newAmount: selectedOrder.amount * 0.95, // Example: 5% discount
            message: 'We can offer a better price with these adjustments.',
          });
        }
        break;
    }
  };
  
  // Submit counter offer
  const submitCounterOffer = () => {
    if (!selectedOrderForCounter) return;
    
    const selectedOrder = buyerOrders.find(order => order.id === selectedOrderForCounter);
    if (!selectedOrder) return;
    
    // Create a proper counter offer object
    const counterOffer: CounterOfferDetail = {
      id: uuidv4(),
      originalAmount: selectedOrder.amount,
      proposedAmount: counterOfferDetails.newAmount,
      message: counterOfferDetails.message,
      createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), // 7 days from now
      status: 'Pending',
      adminId: 'ADM-001', // This would come from the current admin user
      adminName: 'Admin User' // This would come from the current admin user
    };
    
    // Update the order with counter offer flag
    const updatedOrders = buyerOrders.map(order => 
      order.id === selectedOrderForCounter
        ? {
            ...order, 
            status: 'Counter Offer' as OrderStatus,
            counterOffer: counterOffer
          }
        : order
    );
    
    setBuyerOrders(updatedOrders);
    updateOrderStats(updatedOrders);
    
    showToast('Counter offer sent successfully', 'success');
    setCounterOfferModalOpen(false);
    setSelectedOrderForCounter(null);
    setSelectedOrderIds([]);
  };
  
  // Get class for status badge
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Pending Approval':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'Rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'Counter Offer':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'Draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };
  
  // Sort logic
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
      case 'buyer':
        comparison = (a.buyerName || '').localeCompare(b.buyerName || '');
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Rendering sort icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600 dark:text-blue-400">↑</span>
      : <span className="ml-1 text-blue-600 dark:text-blue-400">↓</span>;
  };
  
  return (
    <div>
      {/* Stats summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OrderStatCard 
          title="Total Orders" 
          value={orderStats.totalOrders}
          color="blue"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        
        <OrderStatCard 
          title="Pending Approval" 
          value={orderStats.pendingApproval}
          color="yellow"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <OrderStatCard 
          title="Approval Rate" 
          value={`${orderStats.approvalRate}%`}
          color="green"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <OrderStatCard 
          title="Avg. Processing Time" 
          value={orderStats.processingTime}
          color="purple"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
      
      {/* Filter controls */}
      <div className="mb-6 bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg border dark:border-dark-border-primary">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[1000px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500 dark:text-dark-text-muted">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by order ID or buyer..." 
                className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange({searchTerm: e.target.value})}
              />
            </div>

            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Counter Offer">Counter Offer</option>
                <option value="Processing">Processing</option>
              </select>
            </div>

            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                value={filters.buyer || ''}
                onChange={(e) => handleFilterChange({buyer: e.target.value})}
              >
                <option value="">All Buyers</option>
                {buyers.map(buyer => (
                  <option key={buyer.id} value={buyer.id}>{buyer.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                value={filters.dateRange || 'last30days'}
                onChange={(e) => handleFilterChange({dateRange: e.target.value})}
              >
                <option value="last30days">Last 30 Days</option>
                <option value="last60days">Last 60 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleBulkAction(AdminAction.APPROVE)}
          disabled={selectedOrderIds.length === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium
            ${selectedOrderIds.length === 0 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Approve
        </button>
        
        <button
          onClick={() => handleBulkAction(AdminAction.REJECT)}
          disabled={selectedOrderIds.length === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium
            ${selectedOrderIds.length === 0 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
        
        <button
          onClick={() => handleBulkAction(AdminAction.COUNTER_OFFER)}
          disabled={selectedOrderIds.length !== 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium
            ${selectedOrderIds.length !== 1
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-800'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          Counter Offer
        </button>
        
        <button 
          className="flex items-center gap-1 border border-gray-500 dark:border-gray-600 text-gray-700 dark:text-dark-text-secondary text-sm py-1.5 px-3 rounded hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors ml-auto"
          onClick={handleRefresh}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Orders counter */}
      <div className="w-full flex flex-col gap-1 mb-4">
        <div className="flex items-center mb-1 px-2">
          <div className="text-xs text-slate-600 dark:text-dark-text-muted bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded flex items-center border dark:border-blue-800/30">
            <span className="font-medium">Total Orders:</span>
            <span className="ml-1 font-semibold text-blue-600 dark:text-blue-300">{filteredOrders.length}</span>
          </div>
        </div>
      </div>
      
      {/* Orders table */}
      <div className="overflow-x-auto w-full overflow-y-visible">
        <div className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'} transition-all duration-300`}>
          {/* Table header */}
          <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-secondary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
            <div className="w-[4%] flex items-center justify-center">
              <input 
                type="checkbox" 
                checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                onChange={selectAllOrders}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-dark-bg-secondary border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="w-[12%] cursor-pointer select-none flex items-center" onClick={() => {
              if (sortBy === 'orderId') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('orderId'); setSortDirection('asc'); }
            }}>
              Order ID {renderSortIcon('orderId')}
            </div>
            <div className="w-[9%] cursor-pointer select-none flex items-center" onClick={() => {
              if (sortBy === 'date') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('date'); setSortDirection('desc'); }
            }}>
              Date {renderSortIcon('date')}
            </div>
            <div className="w-[12%] cursor-pointer select-none flex items-center" onClick={() => {
              if (sortBy === 'buyer') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('buyer'); setSortDirection('asc'); }
            }}>
              Buyer {renderSortIcon('buyer')}
            </div>
            <div className="w-[11%] text-center cursor-pointer select-none flex items-center justify-center" onClick={() => {
              if (sortBy === 'status') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('status'); setSortDirection('asc'); }
            }}>
              Status {renderSortIcon('status')}
            </div>
            <div className="w-[8%] text-center">Products</div>
            <div className="w-[14%] text-right cursor-pointer select-none flex items-center justify-end" onClick={() => {
              if (sortBy === 'amount') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('amount'); setSortDirection('desc'); }
            }}>
              Amount {renderSortIcon('amount')}
            </div>
            <div className="w-[30%] text-right">Actions</div>
          </div>
          
          {/* Table rows */}
          {sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-card rounded-xl shadow dark:shadow-dark-md border border-slate-100 dark:border-dark-border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">No orders found</h3>
              <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">Try adjusting your search or filter criteria to find orders.</p>
            </div>
          ) : (
            sortedOrders.map((order, idx) => {
              const isSelected = selectedOrderIds.includes(order.id);
              
              return (
                <div 
                  key={order.id}
                  className={`
                    flex items-center px-3 py-3 bg-white dark:bg-dark-bg-card border border-gray-100 dark:border-dark-border-primary
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer
                    relative
                    rounded-xl my-1.5
                  `}
                >
                  {/* Checkbox */}
                  <div className="w-[4%] flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-dark-bg-secondary border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>
                  
                  {/* Order ID */}
                  <div className="w-[12%] flex flex-col">
                    <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary">{order.id}</span>
                  </div>
                  
                  {/* Date */}
                  <div className="w-[9%]">
                    <span className="text-sm text-slate-600 dark:text-dark-text-secondary">{order.createdOn}</span>
                  </div>
                  
                  {/* Buyer */}
                  <div className="w-[12%]">
                    <span className="text-sm text-gray-900 dark:text-dark-text-primary">{order.buyerName || 'Unknown'}</span>
                  </div>
                  
                  {/* Status */}
                  <div className="w-[11%] flex justify-center">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  {/* Products */}
                  <div className="w-[8%] flex flex-col items-center text-xs">
                    <div className="text-slate-600 dark:text-dark-text-secondary">
                      <span className="font-medium">{order.totalProducts}</span> Products
                    </div>
                    <div className="text-slate-600 dark:text-dark-text-secondary">
                      <span className="font-medium">{order.items}</span> Items
                    </div>
                    <div className="text-slate-600 dark:text-dark-text-secondary">
                      <span className="font-medium">{order.suppliers?.length || 0}</span> Suppliers
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div className="w-[14%] text-right">
                    <span className="font-semibold text-sm text-slate-700 dark:text-dark-text-primary">€{order.amount.toFixed(2)}</span>
                    {order.counterOffer && (
                      <div className="text-xs text-purple-600 dark:text-purple-400">Counter: €{order.counterOffer.proposedAmount.toFixed(2)}</div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="w-[30%] flex justify-end space-x-1">
                    {order.status === 'Pending Approval' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order.id);
                            handleBulkAction(AdminAction.APPROVE);
                          }}
                          className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderSelection(order.id);
                            handleBulkAction(AdminAction.REJECT);
                          }}
                          className="px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderIds([order.id]);
                            handleBulkAction(AdminAction.COUNTER_OFFER);
                          }}
                          className="px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50"
                        >
                          Counter
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/purchase-orders/order/${order.id}`);
                      }}
                      className="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Counter offer modal */}
      {counterOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70" onClick={() => setCounterOfferModalOpen(false)}></div>
          <div className="bg-white dark:bg-dark-bg-card rounded-lg shadow-xl dark:shadow-dark-lg p-6 max-w-md w-full z-10 relative border dark:border-dark-border-primary">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-dark-text-primary">Send Counter Offer</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">New Amount</label>
              <input
                type="number"
                step="0.01"
                value={counterOfferDetails.newAmount}
                onChange={(e) => setCounterOfferDetails({
                  ...counterOfferDetails,
                  newAmount: parseFloat(e.target.value)
                })}
                className="w-full p-2 border border-gray-300 dark:border-dark-border-primary bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Message</label>
              <textarea
                value={counterOfferDetails.message}
                onChange={(e) => setCounterOfferDetails({
                  ...counterOfferDetails,
                  message: e.target.value
                })}
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-dark-border-primary bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Explain the counter offer..."
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCounterOfferModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-dark-border-primary rounded text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover"
              >
                Cancel
              </button>
              <button
                onClick={submitCounterOffer}
                className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                Send Counter Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders; 