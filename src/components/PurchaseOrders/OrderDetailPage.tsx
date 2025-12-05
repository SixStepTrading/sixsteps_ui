import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { 
  getOrderDetails, 
  OrderDetailData, 
  OrderProductDetail,
  getSupplierById 
} from '../../data/mockOrders';
import ProductEditModal from './ProductEditModal';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { userRole } = useUser();
  
  const [orderDetails, setOrderDetails] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingToSuppliers, setSendingToSuppliers] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<OrderProductDetail | null>(null);
  const [productEditModalOpen, setProductEditModalOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      try {
        const details = getOrderDetails(orderId);
        if (details) {
          setOrderDetails(details);
        } else {
          showToast('Order not found', 'error');
          navigate('/purchase-orders');
        }
      } catch (error) {
        showToast('Error loading order details', 'error');
        navigate('/purchase-orders');
      } finally {
        setLoading(false);
      }
    }
  }, [orderId, navigate, showToast]);

  const handleSendToSupplier = async (supplierId: string) => {
    setSendingToSuppliers(prev => [...prev, supplierId]);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const supplier = getSupplierById(supplierId);
      showToast(`Order sent successfully to ${supplier?.name}`, 'success');
    } catch (error) {
      showToast('Error sending order to supplier', 'error');
    } finally {
      setSendingToSuppliers(prev => prev.filter(id => id !== supplierId));
    }
  };

  const handleSendToSelectedSuppliers = async () => {
    if (selectedSuppliers.length === 0) {
      showToast('Please select at least one supplier', 'warning');
      return;
    }

    setSendingToSuppliers([...selectedSuppliers]);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast(`Order sent successfully to ${selectedSuppliers.length} supplier(s)`, 'success');
      setSelectedSuppliers([]);
    } catch (error) {
      showToast('Error sending order to suppliers', 'error');
    } finally {
      setSendingToSuppliers([]);
    }
  };

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleEditProduct = (product: OrderProductDetail) => {
    setEditingProduct(product);
    setProductEditModalOpen(true);
  };

  const handleSaveProductEdit = (updatedProduct: OrderProductDetail, reason?: string) => {
    if (!orderDetails) return;

    // Update the product in the order details
    const updatedProducts = orderDetails.products.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    );

    // Recalculate total amount
    const newTotalAmount = updatedProducts.reduce((sum, product) => sum + product.totalPrice, 0);

    setOrderDetails({
      ...orderDetails,
      products: updatedProducts,
      totalAmount: newTotalAmount
    });

    showToast(
      `Product ${updatedProduct.name} updated successfully${reason ? ` - ${reason}` : ''}`, 
      'success'
    );
    
    setEditingProduct(null);
    setProductEditModalOpen(false);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      case 'Processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'Pending Approval':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Partially Filled':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'Executed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'High':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'Medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  // Group products by warehouse (for Admin view) or keep flat (for Buyer view)
  const groupProductsByWarehouse = (products: OrderProductDetail[]) => {
    const grouped: Record<string, OrderProductDetail[]> = {};
    
    products.forEach(product => {
      // Use warehouseId if available, otherwise fallback to supplierId
      const warehouseId = product.warehouseId || product.supplierId || 'unknown';
      if (!grouped[warehouseId]) {
        grouped[warehouseId] = [];
      }
      grouped[warehouseId].push(product);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex-grow p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text-muted">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex-grow p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-dark-text-muted mb-4">The requested order could not be found.</p>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const groupedProducts = groupProductsByWarehouse(orderDetails.products);

  return (
    <div className="flex-grow p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="mr-4 p-2 text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-hover rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">Order Details</h1>
            <p className="text-gray-600 dark:text-dark-text-muted">Order ID: {orderDetails.id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(orderDetails.status)}`}>
            {orderDetails.status}
          </span>
          {orderDetails.priority && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityClass(orderDetails.priority)}`}>
              {orderDetails.priority} Priority
            </span>
          )}
        </div>
      </div>

      {/* Order Summary - Compact for Admin */}
      {userRole === 'Admin' ? (
        <div className="bg-white dark:bg-dark-bg-card rounded-lg shadow dark:shadow-dark-md p-4 mb-6 border dark:border-dark-border-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Order Information</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSendToSelectedSuppliers}
                disabled={selectedSuppliers.length === 0 || sendingToSuppliers.length > 0}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
              >
                {sendingToSuppliers.length > 0 ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : (
                  `Send to Selected (${selectedSuppliers.length})`
                )}
              </button>
              <button
                onClick={() => navigate(`/purchase-orders`)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-secondary rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg-hover text-sm"
              >
                Back to Orders
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-dark-text-muted">Created</p>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.createdOn}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-dark-text-muted">Type</p>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.orderType || 'Standard'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-dark-text-muted">Products</p>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.totalProducts}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-dark-text-muted">Total</p>
              <p className="font-medium text-lg text-gray-900 dark:text-dark-text-primary">€{orderDetails.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-dark-text-muted">Payment</p>
              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.paymentMethod || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-dark-text-muted">Priority</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(orderDetails.priority)}`}>
                {orderDetails.priority || 'Medium'}
              </span>
            </div>
          </div>
          {orderDetails.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border-primary">
              <p className="text-sm text-gray-600 dark:text-dark-text-muted">Notes: <span className="text-gray-900 dark:text-dark-text-primary">{orderDetails.notes}</span></p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-bg-card rounded-lg shadow dark:shadow-dark-md p-6 border dark:border-dark-border-primary">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Created On</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.createdOn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Order Type</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.orderType || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Total Products</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.totalProducts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Total Amount</p>
                  <p className="font-medium text-lg text-gray-900 dark:text-dark-text-primary">€{orderDetails.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Delivery Address</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.deliveryAddress || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Payment Method</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.paymentMethod || 'Not specified'}</p>
                </div>
              </div>
              {orderDetails.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Notes</p>
                  <p className="font-medium text-gray-900 dark:text-dark-text-primary">{orderDetails.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-dark-bg-card rounded-lg shadow dark:shadow-dark-md p-6 border dark:border-dark-border-primary">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">Quick Actions</h2>
              <div className="space-y-3">
                {/* Actions for regular users */}
                {orderDetails?.status === 'Executed' && (
                  <button
                    onClick={() => showToast('Reorder functionality coming soon', 'info')}
                    className="w-full px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reorder
                  </button>
                )}
                
                {orderDetails?.status === 'Partially Filled' && (
                  <button
                    onClick={() => showToast('Tracking partial order', 'info')}
                    className="w-full px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded-md hover:bg-orange-700 dark:hover:bg-orange-800 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Track Partial
                  </button>
                )}
                
                {orderDetails?.status === 'Processing' && (
                  <button
                    onClick={() => showToast('Tracking information will be available soon', 'info')}
                    className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Track Order
                  </button>
                )}
                
                <button
                  onClick={() => navigate(`/purchase-orders`)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-secondary rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg-hover"
                >
                  Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Section - Only visible to Admin, not to regular buyers */}
      {orderDetails.counterOffer && userRole === 'Admin' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4">Counter Offer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Original Amount</p>
              <p className="font-semibold text-purple-900 dark:text-purple-300">€{orderDetails.counterOffer.originalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Proposed Amount</p>
              <p className="font-semibold text-green-600 dark:text-green-400">€{orderDetails.counterOffer.proposedAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Status</p>
              <p className="font-semibold text-purple-900 dark:text-purple-300">{orderDetails.counterOffer.status}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-purple-600 dark:text-purple-400">Message</p>
            <p className="text-purple-900 dark:text-purple-300">{orderDetails.counterOffer.message}</p>
          </div>
        </div>
      )}

      {/* Products by Warehouse - Admin View */}
      {userRole === 'Admin' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Products by Warehouse</h2>
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">
              {Object.keys(groupedProducts).length} warehouse(s) involved
            </p>
          </div>

          {Object.entries(groupedProducts).map(([warehouseId, products]) => {
            // Get warehouse name from first product in group, or use warehouseId
            const warehouseName = products[0]?.warehouseName || products[0]?.warehouseId || warehouseId;
            const supplier = warehouseId !== 'unknown' ? getSupplierById(warehouseId) : null;
            const isSelected = selectedSuppliers.includes(warehouseId);
            const isSending = sendingToSuppliers.includes(warehouseId);
          
          return (
            <div key={warehouseId} className="bg-white dark:bg-dark-bg-card rounded-lg shadow dark:shadow-dark-md border dark:border-dark-border-primary">
              <div className="p-6 border-b border-gray-200 dark:border-dark-border-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSupplierSelection(warehouseId)}
                      className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-dark-border-primary"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary">
                        {warehouseName}
                      </h3>
                      {supplier && (
                        <div className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">
                          <p>{supplier.email} • {supplier.phone}</p>
                          <p>{supplier.address}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-500">★</span>
                            <span className="ml-1">{supplier.rating}/5</span>
                            <span className="ml-3">Delivery: {supplier.deliveryTime}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast('Approve warehouse functionality coming soon', 'info')}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleSendToSupplier(warehouseId)}
                      disabled={isSending}
                      className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send to Warehouse
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-dark-border-primary">
                        <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Product</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Quantity</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Unit Price</th>
                        <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Total</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Stock</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Delivery</th>
                        {orderDetails.status === 'Pending Approval' && (
                          <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100 dark:border-dark-border-primary">
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-dark-text-primary">{product.name}</p>
                              <p className="text-sm text-gray-600 dark:text-dark-text-muted">{product.code}</p>
                            </div>
                          </td>
                          <td className="text-center py-3 text-gray-900 dark:text-dark-text-primary">{product.quantity}</td>
                          <td className="text-right py-3 text-gray-900 dark:text-dark-text-primary">€{product.unitPrice.toFixed(2)}</td>
                          <td className="text-right py-3 font-medium text-gray-900 dark:text-dark-text-primary">€{product.totalPrice.toFixed(2)}</td>
                          <td className="text-center py-3">
                            {product.stockAvailable ? (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                product.stockAvailable >= product.quantity 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {product.stockAvailable}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-dark-text-disabled">N/A</span>
                            )}
                          </td>
                          <td className="text-center py-3 text-sm text-gray-600 dark:text-dark-text-muted">
                            {product.estimatedDelivery || 'N/A'}
                          </td>
                          {orderDetails.status === 'Pending Approval' && (
                            <td className="text-center py-3">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-dark-border-primary">
                        <td colSpan={3} className="py-3 font-medium text-gray-900 dark:text-dark-text-primary">Warehouse Total:</td>
                        <td className="text-right py-3 font-semibold text-gray-900 dark:text-dark-text-primary">
                          €{products.reduce((sum, p) => sum + p.totalPrice, 0).toFixed(2)}
                        </td>
                        <td colSpan={orderDetails.status === 'Pending Approval' ? 3 : 2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Products List - Regular User View (No warehouse/supplier references) */}
      {userRole !== 'Admin' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Order Products</h2>
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">
              {orderDetails.products.length} product(s) in this order
            </p>
          </div>

          <div className="bg-white dark:bg-dark-bg-card rounded-lg shadow dark:shadow-dark-md border dark:border-dark-border-primary">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-border-primary">
                      <th className="text-left py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Product</th>
                      <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Quantity</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Unit Price</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Total</th>
                      <th className="text-center py-2 text-sm font-medium text-gray-600 dark:text-dark-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 dark:border-dark-border-primary">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-dark-text-primary">{product.name}</p>
                            <p className="text-sm text-gray-600 dark:text-dark-text-muted">{product.code}</p>
                          </div>
                        </td>
                        <td className="text-center py-3 text-gray-900 dark:text-dark-text-primary">{product.quantity}</td>
                        <td className="text-right py-3 text-gray-900 dark:text-dark-text-primary">€{product.unitPrice.toFixed(2)}</td>
                        <td className="text-right py-3 font-medium text-gray-900 dark:text-dark-text-primary">€{product.totalPrice.toFixed(2)}</td>
                        <td className="text-center py-3">
                          {orderDetails.status === 'Executed' ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              Confirmed
                            </span>
                          ) : orderDetails.status === 'Partially Filled' ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                              Partial
                            </span>
                          ) : orderDetails.status === 'Processing' ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              Processing
                            </span>
                          ) : orderDetails.status === 'Pending Approval' ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                              {orderDetails.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-dark-border-primary">
                      <td colSpan={3} className="py-3 font-medium text-gray-900 dark:text-dark-text-primary">Order Total:</td>
                      <td className="text-right py-3 font-semibold text-lg text-gray-900 dark:text-dark-text-primary">
                        €{orderDetails.totalAmount.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          open={productEditModalOpen}
          onClose={() => {
            setProductEditModalOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          onSave={handleSaveProductEdit}
        />
      )}
    </div>
  );
};

export default OrderDetailPage; 