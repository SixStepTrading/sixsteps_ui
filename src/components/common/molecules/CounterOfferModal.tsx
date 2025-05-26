import React, { useState } from 'react';
import { CounterOfferDetail } from '../../../data/mockOrders';

interface CounterOfferModalProps {
  open: boolean;
  onClose: () => void;
  counterOffer: CounterOfferDetail;
  orderId: string;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
}

const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
  open,
  onClose,
  counterOffer,
  orderId,
  onAccept,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!open) return null;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(orderId);
      onClose();
    } catch (error) {
      console.error('Error accepting counter offer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(orderId);
      onClose();
    } catch (error) {
      console.error('Error rejecting counter offer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const savings = counterOffer.originalAmount - counterOffer.proposedAmount;
  const savingsPercentage = ((savings / counterOffer.originalAmount) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 z-10 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Counter Offer Received</h3>
            <p className="text-sm text-gray-500 mt-1">Order ID: {orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Counter Offer Details */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <div className="bg-blue-100 rounded-full p-2 mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Special Pricing Offer</h4>
              <p className="text-sm text-gray-600">From: {counterOffer.adminName}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Original Amount</p>
              <p className="text-lg font-semibold text-gray-900">€{counterOffer.originalAmount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Proposed Amount</p>
              <p className="text-lg font-semibold text-green-600">€{counterOffer.proposedAmount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Your Savings</p>
              <p className="text-lg font-semibold text-green-600">€{savings.toLocaleString()}</p>
              <p className="text-xs text-green-600">({savingsPercentage}% discount)</p>
            </div>
          </div>

          <div className="bg-white rounded-md p-3">
            <p className="text-sm text-gray-700 font-medium mb-2">Message from Admin:</p>
            <p className="text-sm text-gray-600">{counterOffer.message}</p>
          </div>

          {/* Product-level changes */}
          {counterOffer.productChanges && counterOffer.productChanges.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Product Changes:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {counterOffer.productChanges.map((change, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md border">
                    <div className="font-medium text-gray-900 mb-2">Product {change.productId}</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <div className="flex items-center">
                          <span className="text-gray-500">{change.originalQuantity}</span>
                          <svg className="w-4 h-4 mx-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className={change.proposedQuantity !== change.originalQuantity ? 'font-medium text-blue-600' : 'text-gray-500'}>
                            {change.proposedQuantity}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit Price:</span>
                        <div className="flex items-center">
                          <span className="text-gray-500">€{change.originalUnitPrice.toFixed(2)}</span>
                          <svg className="w-4 h-4 mx-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className={change.proposedUnitPrice !== change.originalUnitPrice ? 'font-medium text-green-600' : 'text-gray-500'}>
                            €{change.proposedUnitPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Total:</span>
                      <div className="flex items-center">
                        <span className="text-gray-500">€{change.originalTotalPrice.toFixed(2)}</span>
                        <svg className="w-4 h-4 mx-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className={change.proposedTotalPrice < change.originalTotalPrice ? 'font-medium text-green-600' : change.proposedTotalPrice > change.originalTotalPrice ? 'font-medium text-red-600' : 'text-gray-500'}>
                          €{change.proposedTotalPrice.toFixed(2)}
                        </span>
                        {change.proposedTotalPrice !== change.originalTotalPrice && (
                          <span className={change.proposedTotalPrice < change.originalTotalPrice ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                            ({change.proposedTotalPrice < change.originalTotalPrice ? '-' : '+'}€{Math.abs(change.proposedTotalPrice - change.originalTotalPrice).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                    {change.reason && (
                      <div className="mt-2 text-xs text-blue-600 italic bg-blue-50 p-2 rounded">
                        <strong>Reason:</strong> {change.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Offer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Offer Created</p>
            <p className="font-medium">{counterOffer.createdDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Expires On</p>
            <p className="font-medium text-red-600">{counterOffer.expiryDate}</p>
          </div>
        </div>

        {/* Warning about expiry */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-yellow-800">
              This offer expires on {counterOffer.expiryDate}. Please make your decision before the expiry date.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Review Later
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-6 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : null}
            Reject Offer
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="px-6 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : null}
            Accept Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterOfferModal; 