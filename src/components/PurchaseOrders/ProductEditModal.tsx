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
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full z-10 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Edit Product</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900">{product.name}</h4>
          <p className="text-sm text-gray-600">{product.code}</p>
          <p className="text-sm text-gray-600">Supplier: {product.supplierName}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Original: {product.quantity}</span>
              <input
                type="number"
                min="1"
                value={editedProduct.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Price (€)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Original: €{product.unitPrice.toFixed(2)}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editedProduct.unitPrice}
                onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between text-sm">
              <span>Original Total:</span>
              <span>€{product.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>New Total:</span>
              <span className={savings > 0 ? 'text-green-600' : savings < 0 ? 'text-red-600' : ''}>
                €{editedProduct.totalPrice.toFixed(2)}
              </span>
            </div>
            {savings !== 0 && (
              <div className="flex justify-between text-sm">
                <span>Difference:</span>
                <span className={savings > 0 ? 'text-green-600' : 'text-red-600'}>
                  {savings > 0 ? '-' : '+'}€{Math.abs(savings).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {hasChanges && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for changes (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Explain why these changes are being made..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductEditModal; 