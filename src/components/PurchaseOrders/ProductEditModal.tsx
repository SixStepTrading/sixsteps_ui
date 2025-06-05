import React, { useState } from 'react';
import { OrderProductDetail } from '../../data/mockOrders';

interface ProductEditModalProps {
  open: boolean;
  onClose: () => void;
  product: OrderProductDetail;
  onSave: (updatedProduct: OrderProductDetail, reason?: string) => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  open,
  onClose,
  product,
  onSave
}) => {
  const [editedProduct, setEditedProduct] = useState<OrderProductDetail>({
    ...product,
    totalPrice: product.quantity * product.unitPrice
  });
  const [reason, setReason] = useState('');

  const handleQuantityChange = (quantity: number) => {
    const updatedProduct = {
      ...editedProduct,
      quantity,
      totalPrice: quantity * editedProduct.unitPrice
    };
    setEditedProduct(updatedProduct);
  };

  const handlePriceChange = (unitPrice: number) => {
    const updatedProduct = {
      ...editedProduct,
      unitPrice,
      totalPrice: editedProduct.quantity * unitPrice
    };
    setEditedProduct(updatedProduct);
  };

  const handleSave = () => {
    onSave(editedProduct, reason);
    onClose();
  };

  const hasChanges = 
    editedProduct.quantity !== product.quantity || 
    editedProduct.unitPrice !== product.unitPrice;

  const savings = product.totalPrice - editedProduct.totalPrice;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white dark:bg-dark-bg-card rounded-lg shadow-xl dark:shadow-dark-lg p-6 max-w-md w-full z-10 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text-primary">Edit Product</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-dark-text-primary">{product.name}</h4>
          <p className="text-sm text-gray-600 dark:text-dark-text-muted">{product.code}</p>
          <p className="text-sm text-gray-600 dark:text-dark-text-muted">Supplier: {product.supplierName}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              value={editedProduct.quantity}
              onChange={(e) => setEditedProduct({
                ...editedProduct,
                quantity: parseInt(e.target.value) || 0,
                totalPrice: (parseInt(e.target.value) || 0) * editedProduct.unitPrice
              })}
              className="w-full p-2 border border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
              Unit Price (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editedProduct.unitPrice}
              onChange={(e) => setEditedProduct({
                ...editedProduct,
                unitPrice: parseFloat(e.target.value) || 0,
                totalPrice: editedProduct.quantity * (parseFloat(e.target.value) || 0)
              })}
              className="w-full p-2 border border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary"
            />
          </div>

          <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-3 rounded border dark:border-dark-border-primary">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-dark-text-muted">Original Total:</span>
              <span className="text-gray-900 dark:text-dark-text-primary">€{product.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-600 dark:text-dark-text-muted">New Total:</span>
              <span className={savings > 0 ? 'text-green-600 dark:text-green-400' : savings < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-dark-text-primary'}>
                €{editedProduct.totalPrice.toFixed(2)}
              </span>
            </div>
            {savings !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-dark-text-muted">Difference:</span>
                <span className={savings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {savings > 0 ? '-' : '+'}€{Math.abs(savings).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {hasChanges && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                Reason for changes (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary"
                placeholder="Explain why these changes are being made..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-dark-border-primary rounded text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductEditModal; 