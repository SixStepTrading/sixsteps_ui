import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

// Import our custom components
import OrderCard, { OrderData } from '../common/molecules/OrderCard';
import OrderFilterControls from '../common/molecules/OrderFilterControls';
import OrderTabs from '../common/molecules/OrderTabs';
import OrderPagination from '../common/molecules/OrderPagination';
import OrderDetailsModal, { OrderDetailData, OrderProductDetail } from '../common/molecules/OrderDetailsModal';

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

// Dati dettagliati per ciascun ordine (prodotti ordinati)
const ORDER_DETAILS: Record<string, OrderProductDetail[]> = {
  'ODA-2587': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 10, unitPrice: 22.50, totalPrice: 225.00 },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 15, unitPrice: 15.80, totalPrice: 237.00 },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 25, unitPrice: 9.90, totalPrice: 247.50 },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 45, unitPrice: 11.90, totalPrice: 535.50 }
  ],
  'ODA-2586': [
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 20, unitPrice: 12.40, totalPrice: 248.00 },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 32, unitPrice: 18.70, totalPrice: 598.40 }
  ],
  'ODA-2585': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 15, unitPrice: 22.50, totalPrice: 337.50 },
    { id: 'P002', code: 'BIOD-002', name: 'BIODERMA ATODERM', quantity: 25, unitPrice: 15.80, totalPrice: 395.00 },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 30, unitPrice: 12.40, totalPrice: 372.00 },
    { id: 'P004', code: 'ENTG-004', name: 'ENTEROGERMINA 2MLD', quantity: 40, unitPrice: 9.90, totalPrice: 396.00 },
    { id: 'P005', code: 'OMEG-005', name: 'OMEGA 3 PLUS', quantity: 12, unitPrice: 18.70, totalPrice: 224.40 },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 15, unitPrice: 11.25, totalPrice: 168.75 }
  ],
  'ODA-2584-DRAFT': [
    { id: 'P001', code: 'ALVG-001', name: 'ALVITA GINOCCHIERA', quantity: 5, unitPrice: 22.50, totalPrice: 112.50 },
    { id: 'P003', code: 'ZERO-003', name: 'ZERODOL GEL', quantity: 10, unitPrice: 12.40, totalPrice: 124.00 },
    { id: 'P006', code: 'VITC-006', name: 'VITAMINA C 1000MG', quantity: 7.50, unitPrice: 11.25, totalPrice: 84.38 }
  ],
  'ODA-2583-DRAFT': []
};

// Informazioni aggiuntive per gli ordini
const ORDER_ADDITIONAL_INFO: Record<string, {
  deliveryAddress?: string;
  deliveryDate?: string;
  paymentMethod?: string;
  notes?: string;
}> = {
  'ODA-2587': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    deliveryDate: 'May 15, 2025',
    paymentMethod: 'Bank Transfer',
  },
  'ODA-2586': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
  },
  'ODA-2585': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    deliveryDate: 'May 20, 2025',
    paymentMethod: 'Bank Transfer',
    notes: 'Deliver during business hours (9AM-6PM). Call before delivery.'
  },
  'ODA-2584-DRAFT': {
    deliveryAddress: 'Pharmacy Main Branch, Via Roma 123, Milano',
    paymentMethod: 'Credit Card',
  },
  'ODA-2583-DRAFT': {}
};

// Mock data for demonstration
const MOCK_ORDERS: OrderData[] = [
  {
    id: 'ODA-2587',
    createdOn: 'May 8, 2025',
    totalProducts: 28,
    items: 95,
    amount: 1245.80,
    status: 'Approved',
    deliveryStatus: 'Delivered',
    deliveryDate: 'May 15, 2025'
  },
  {
    id: 'ODA-2586',
    createdOn: 'May 7, 2025',
    totalProducts: 15,
    items: 52,
    amount: 845.50,
    status: 'Pending Approval',
    estimatedDelivery: 'Awaiting approval'
  },
  {
    id: 'ODA-2585',
    createdOn: 'May 6, 2025',
    totalProducts: 42,
    items: 137,
    amount: 1892.30,
    status: 'Processing',
    estimatedDelivery: 'May 20, 2025'
  },
  {
    id: 'ODA-2584-DRAFT',
    createdOn: 'May 5, 2025',
    totalProducts: 8,
    items: 22,
    amount: 320.75,
    status: 'Draft',
    completion: 60
  },
  {
    id: 'ODA-2583-DRAFT',
    createdOn: 'May 3, 2025',
    totalProducts: 0,
    items: 0,
    amount: 0,
    status: 'Draft',
    completion: 10
  }
];

// Tab definitions
const ORDER_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'pending', label: 'Pending Approval' },
  { id: 'processing', label: 'Processing' },
  { id: 'approved', label: 'Approved' }
];

// Filter options
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Approved', label: 'Approved' }
];

const DATE_RANGE_OPTIONS = [
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last60days', label: 'Last 60 days' },
  { value: 'last90days', label: 'Last 90 days' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const PurchaseOrders: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [currentTab, setCurrentTab] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState<OrderData[]>(MOCK_ORDERS);
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [dateValue, setDateValue] = useState('last30days');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // State per il modale dei dettagli dell'ordine
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetailData | null>(null);

  // Filter orders based on selected criteria
  useEffect(() => {
    let result = [...MOCK_ORDERS];
    
    // Filter by tab
    if (currentTab !== 'all') {
      if (currentTab === 'drafts') {
        result = result.filter(order => order.status === 'Draft');
      } else if (currentTab === 'pending') {
        result = result.filter(order => order.status === 'Pending Approval');
      } else if (currentTab === 'processing') {
        result = result.filter(order => order.status === 'Processing');
      } else if (currentTab === 'approved') {
        result = result.filter(order => order.status === 'Approved');
      }
    }
    
    // Filter by search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Filter by status
    if (statusValue) {
      result = result.filter(order => order.status === statusValue);
    }
    
    // Date filter would be implemented here with real data
    // For now, we're just using the mock data
    
    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [currentTab, searchValue, statusValue, dateValue]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  // Handle creating a new purchase order
  const handleCreateOda = () => {
    //navigate('/purchase-orders/new');
    showToast('This feature is coming soon!', 'info');
  };

  // Get only the items for the current page
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  };

  // Get full order details from order ID
  const getOrderDetails = (orderId: string): OrderDetailData => {
    const order = MOCK_ORDERS.find(o => o.id === orderId);
    const products = ORDER_DETAILS[orderId] || [];
    const additionalInfo = ORDER_ADDITIONAL_INFO[orderId] || {};
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    return {
      id: order.id,
      createdOn: order.createdOn,
      status: order.status,
      products,
      deliveryAddress: additionalInfo.deliveryAddress || '',
      deliveryDate: additionalInfo.deliveryDate || order.deliveryDate || order.estimatedDelivery || '',
      paymentMethod: additionalInfo.paymentMethod || '',
      notes: additionalInfo.notes || '',
      totalAmount: order.amount,
      totalProducts: order.items
    };
  };

  // Handle opening the details modal
  const handleViewDetails = (id: string) => {
    try {
      const details = getOrderDetails(id);
      setSelectedOrderDetails(details);
      setDetailsModalOpen(true);
    } catch (error) {
      showToast(`Failed to load order details: ${error}`, 'error');
    }
  };

  // Handle reordering
  const handleReorder = (id: string) => {
    showToast(`Reordering order ${id}`, 'info');
  };

  // Handle editing an order
  const handleEdit = (id: string) => {
    // navigate(`/purchase-orders/edit/${id}`);
    showToast('This feature is coming soon!', 'info');
  };

  // Handler for deleting an order
  const handleDelete = (id: string) => {
    showToast(`Order ${id} has been deleted`, 'success');
  };

  // Handler for tracking an order
  const handleTrack = (id: string) => {
    showToast(`Tracking information for order ${id} coming soon`, 'info');
  };

  // Handler for following up on an order
  const handleFollowUp = (id: string) => {
    showToast(`Follow up email sent for order ${id}`, 'success');
  };

  // Handler for submitting a draft order
  const handleSubmit = (id: string) => {
    showToast(`Draft order ${id} has been submitted for approval`, 'success');
  };

  // Handler for continuing to edit a draft order
  const handleContinueEditing = (id: string) => {
    // navigate(`/purchase-orders/edit/${id}`);
    showToast('This feature is coming soon!', 'info');
  };

  // Handler for printing an order
  const handlePrintOrder = () => {
    window.print();
    showToast('Printing order...', 'info');
  };

  // Handler for downloading an order
  const handleDownloadOrder = () => {
    showToast('Order downloaded as PDF', 'success');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <p className="text-gray-600 text-sm">Manage and track your purchase orders</p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
          onClick={handleCreateOda}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Order</span>
        </button>
      </div>

      <div className="mb-6">
        <OrderFilterControls
          searchValue={searchValue}
          statusValue={statusValue}
          dateValue={dateValue}
          onSearchChange={setSearchValue}
          onStatusChange={setStatusValue}
          onDateChange={setDateValue}
          statusOptions={STATUS_OPTIONS}
          dateRangeOptions={DATE_RANGE_OPTIONS}
        />
      </div>

      <div className="mb-6">
        <OrderTabs
          tabs={ORDER_TABS}
          currentTab={currentTab}
          onTabChange={handleTabChange}
        />
      </div>

      <div className="mb-6">
        {getCurrentPageItems().map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={handleViewDetails}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTrack={handleTrack}
            onFollowUp={handleFollowUp}
            onSubmit={handleSubmit}
            onContinueEditing={handleContinueEditing}
          />
        ))}
        
        {filteredOrders.length === 0 && (
          <div className="p-8 bg-white rounded-lg shadow text-center">
            <p className="text-gray-500">No orders found matching your criteria.</p>
          </div>
        )}
      </div>
      
      {filteredOrders.length > 0 && (
        <OrderPagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
      
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