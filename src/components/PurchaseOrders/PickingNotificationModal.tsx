import React, { useState } from 'react';
import { PickingNotification, PickingDetails, processPickingDecision, acknowledgePickingNotification } from '../../data/mockOrders';
import { useToast } from '../../contexts/ToastContext';

interface PickingNotificationModalProps {
  open: boolean;
  onClose: () => void;
  notification: PickingNotification;
  pickingDetails?: PickingDetails;
  onDecisionMade: (decision: 'accept' | 'reject' | 'request_alternatives') => void;
}

const PickingNotificationModal: React.FC<PickingNotificationModalProps> = ({
  open,
  onClose,
  notification,
  pickingDetails,
  onDecisionMade
}) => {
  const { showToast } = useToast();
  const [selectedDecision, setSelectedDecision] = useState<'accept' | 'reject' | 'request_alternatives' | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmitDecision = () => {
    if (!selectedDecision) {
      showToast('Please select a decision', 'error');
      return;
    }

    const success = processPickingDecision(notification.orderId, selectedDecision);
    if (success) {
      acknowledgePickingNotification(notification.id);
      onDecisionMade(selectedDecision);
      
      const decisionText = {
        accept: 'accepted the partial delivery',
        reject: 'rejected the order',
        request_alternatives: 'requested alternative products'
      }[selectedDecision];
      
      showToast(`You have ${decisionText}`, 'success');
      onClose();
    } else {
      showToast('Failed to process decision', 'error');
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'partial_available':
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'out_of_stock':
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'alternative_suggested':
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-bg-card rounded-xl shadow-lg dark:shadow-dark-lg max-w-3xl w-full max-h-[90vh] overflow-auto border dark:border-dark-border-primary">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border-primary">
          <div className="flex items-center space-x-4">
            {getNotificationIcon()}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Picking Notification</h2>
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">Order {notification.orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-dark-text-muted hover:text-gray-500 dark:hover:text-dark-text-secondary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notification Message */}
          <div className="bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-dark-text-primary mb-2">Notification Details</h3>
            <p className="text-gray-700 dark:text-dark-text-secondary">{notification.message}</p>
            <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-2">Received: {notification.createdAt}</p>
          </div>

          {/* Picking Details */}
          {pickingDetails && (
            <div className="border border-gray-200 dark:border-dark-border-primary rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-dark-text-primary mb-4">Picking Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-blue-400">Requested</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-300">{pickingDetails.originalQuantity}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-green-400">Available</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-300">{pickingDetails.availableQuantity}</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-yellow-400">Reduction</div>
                  <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-300">
                    {Math.round(((pickingDetails.originalQuantity - pickingDetails.availableQuantity) / pickingDetails.originalQuantity) * 100)}%
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-2">Reason</h4>
                <p className="text-gray-700 dark:text-dark-text-secondary">{pickingDetails.reason}</p>
              </div>

              {pickingDetails.estimatedRestockDate && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-2">Estimated Restock</h4>
                  <p className="text-gray-700 dark:text-dark-text-secondary">{pickingDetails.estimatedRestockDate}</p>
                </div>
              )}

              {pickingDetails.supplierComment && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-2">Supplier Comment</h4>
                  <p className="text-gray-700 dark:text-dark-text-secondary">{pickingDetails.supplierComment}</p>
                </div>
              )}

              {pickingDetails.alternativeProducts && pickingDetails.alternativeProducts.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-dark-text-primary mb-2">Alternative Products Available</h4>
                  <div className="space-y-2">
                    {pickingDetails.alternativeProducts.map((alt, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg-secondary rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-dark-text-primary">{alt.productName}</div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-muted">Quantity: {alt.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-dark-text-primary">€{alt.unitPrice.toFixed(2)}</div>
                          <div className="text-sm text-gray-500 dark:text-dark-text-muted">per unit</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">Your Decision</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-dark-border-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-hover cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="accept"
                  checked={selectedDecision === 'accept'}
                  onChange={(e) => setSelectedDecision(e.target.value as 'accept')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-dark-border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-green-700 dark:text-green-400">Accept Partial Delivery</div>
                  <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                    Proceed with the available quantity {pickingDetails ? `(${pickingDetails.availableQuantity} units)` : ''}
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-dark-border-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-hover cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={selectedDecision === 'reject'}
                  onChange={(e) => setSelectedDecision(e.target.value as 'reject')}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-dark-border-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-red-700 dark:text-red-400">Reject Order</div>
                  <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                    Cancel this order and look for alternatives elsewhere
                  </div>
                </div>
              </label>

              {pickingDetails?.alternativeProducts && pickingDetails.alternativeProducts.length > 0 && (
                <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-dark-border-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-hover cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="request_alternatives"
                    checked={selectedDecision === 'request_alternatives'}
                    onChange={(e) => setSelectedDecision(e.target.value as 'request_alternatives')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-dark-border-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-blue-700 dark:text-blue-400">Request Alternative Products</div>
                    <div className="text-sm text-gray-500 dark:text-dark-text-muted">
                      Consider the suggested alternative products listed above
                    </div>
                  </div>
                </label>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any additional comments or special instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border-primary bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-border-primary flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border-primary rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-dark-bg-card"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitDecision}
            disabled={!selectedDecision}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-card ${
              selectedDecision
                ? 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-blue-500 dark:focus:ring-blue-400'
                : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            }`}
          >
            Submit Decision
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickingNotificationModal; 