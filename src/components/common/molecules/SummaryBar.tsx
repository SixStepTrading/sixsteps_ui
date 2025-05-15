import React from 'react';

interface SummaryBarProps {
  selectedCount: number;
  totalItems: number;
  totalAmount: number;
  onSaveAsDraft: () => void;
  onCreateOrder: () => void;
  sidebarWidth: number;
  onSaveForLater?: () => void;
  hasSelectionProblems?: boolean;
}

const SummaryBar: React.FC<SummaryBarProps> = ({
  selectedCount,
  totalItems,
  totalAmount,
  onSaveAsDraft,
  onCreateOrder,
  sidebarWidth = 0,
  onSaveForLater,
  hasSelectionProblems = false
}) => {
  // Non mostrare la barra se non ci sono elementi selezionati
  if (selectedCount === 0) return null;
  
  return (
    <div 
      className="fixed bottom-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        left: `${sidebarWidth + 24}px`, // 24px di padding dal sidebar
        right: '24px' // 24px di padding dal lato destro
      }}
    >
      <div className="bg-white border border-gray-200 rounded-t-lg shadow-lg px-6 py-4 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center">
          {/* Selection summary */}
          <div className="flex items-center mb-3 sm:mb-0">
            <div>
              <p className="text-sm font-medium">
                Selected products: <span className="font-bold">{selectedCount}</span>
              </p>
              <p className="text-xs text-gray-500">
                {totalItems} items in total
              </p>
            </div>
          </div>

          {/* Total price */}
          <div className="flex items-center justify-between sm:justify-center mb-3 sm:mb-0 sm:mx-4">
            <span className="text-lg font-bold text-blue-600">€{totalAmount.toFixed(2)}</span>
            <span className="text-xs text-gray-500 sm:hidden ml-2">Total</span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between sm:justify-end gap-3">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 flex items-center"
              onClick={onSaveAsDraft}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save draft
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 flex items-center
                ${hasSelectionProblems 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={onCreateOrder}
              disabled={hasSelectionProblems}
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