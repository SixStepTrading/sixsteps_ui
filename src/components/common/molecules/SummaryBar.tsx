import React from 'react';
import { Tooltip } from '../../../components/Dashboard/ProductTable';

interface SummaryBarProps {
  selectedCount: number;
  totalItems: number;
  totalAmount: number;
  onSaveAsDraft: () => void;
  onCreateOrder: () => void;
  sidebarWidth: number;
  onSaveForLater?: () => void;
  hasSelectionProblems?: boolean;
  belowTargetCount?: number;
  aboveTargetCount?: number;
  stockIssuesCount?: number;
  selectedProducts?: Array<{
    id: string;
    ean: string;
    minsan: string;
    name: string;
    manufacturer: string;
    publicPrice: number;
    bestPrices: Array<{ price: number; stock: number; supplier?: string }>;
    vat: number;
    quantity: number;
  }>;
}

const SummaryBar: React.FC<SummaryBarProps> = ({
  selectedCount,
  totalItems,
  totalAmount,
  onSaveAsDraft,
  onCreateOrder,
  sidebarWidth = 0,
  onSaveForLater,
  hasSelectionProblems = false,
  belowTargetCount = 0,
  aboveTargetCount = 0,
  stockIssuesCount = 0,
  selectedProducts = []
}) => {
  // Non mostrare la barra se non ci sono elementi selezionati
  if (selectedCount === 0) return null;
  
  // Count products without quantity
  const productsWithoutQtyCount = selectedProducts.filter(p => !p.quantity).length;
  const hasProductsWithoutQty = productsWithoutQtyCount > 0;
  
  return (
    <div 
      className="fixed bottom-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        left: `${sidebarWidth + 24}px`, // 24px di padding dal sidebar
        right: '24px' // 24px di padding dal lato destro
      }}
    >
      <div 
        className="bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border-primary rounded-t-lg px-6 py-4 max-w-5xl mx-auto"
        style={{
          boxShadow: '0 0 30px 10px rgba(0, 0, 0, 0.15), 0 15px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center">
          {/* Selection summary */}
          <div className="flex items-center mb-3 sm:mb-0">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                Selected products: <span className="font-bold">{selectedCount}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                {totalItems} items in total
              </p>
              {hasProductsWithoutQty && (
                <p className="text-xs text-red-500 dark:text-red-400 font-semibold mt-1">
                  Set the QTY to continue!
                </p>
              )}
            </div>
          </div>

          {/* Product Statistics */}
          <div className="flex items-center gap-3 mb-3 sm:mb-0">
            <Tooltip text="Products with price below your target price - good deals!">
              <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full px-2 py-1">
                <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-1"></span>
                <span>Below target: <span className="font-bold">{belowTargetCount}</span></span>
              </div>
            </Tooltip>
            
            <Tooltip text="Products with price above your target price - consider alternatives">
              <div className="flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-full px-2 py-1">
                <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full mr-1"></span>
                <span>Above target: <span className="font-bold">{aboveTargetCount}</span></span>
              </div>
            </Tooltip>
            
            <Tooltip text="Products with insufficient stock that need attention">
              <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs rounded-full px-2 py-1">
                <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mr-1"></span>
                <span>Stock issues: <span className="font-bold">{stockIssuesCount}</span></span>
              </div>
            </Tooltip>
            
            {hasProductsWithoutQty && (
              <Tooltip text="Products with no quantity specified - set a quantity to proceed">
                <div className="flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded-full px-2 py-1">
                  <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full mr-1"></span>
                  <span>Missing QTY: <span className="font-bold">{productsWithoutQtyCount}</span></span>
                </div>
              </Tooltip>
            )}
          </div>

          {/* Total price */}
          <div className="flex items-center justify-between sm:justify-center mb-3 sm:mb-0 sm:mx-4">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">€{totalAmount.toFixed(2)}</span>
            <span className="text-xs text-gray-500 dark:text-dark-text-muted sm:hidden ml-2">Total</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between sm:justify-end gap-3">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center
                ${hasProductsWithoutQty || hasSelectionProblems 
                  ? 'bg-gray-200 dark:bg-dark-bg-hover text-gray-400 dark:text-dark-text-disabled cursor-not-allowed' 
                  : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg-hover'}`}
              onClick={onSaveAsDraft}
              disabled={hasProductsWithoutQty || hasSelectionProblems}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save draft
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 flex items-center
                ${hasProductsWithoutQty || hasSelectionProblems 
                  ? 'bg-gray-400 dark:bg-dark-bg-hover cursor-not-allowed' 
                  : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'}`}
              onClick={onCreateOrder}
              disabled={hasProductsWithoutQty || hasSelectionProblems}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryBar; 