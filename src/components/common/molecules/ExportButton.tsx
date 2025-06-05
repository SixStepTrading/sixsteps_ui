import React, { useState, useRef } from 'react';
import { exportSelectedProducts } from '../../../utils/exportUtils';
import { Tooltip } from '../../Dashboard/ProductTable';

interface ExportButtonProps {
  selectedProducts: Array<{
    id: string;
    ean: string;
    minsan: string;
    name: string;
    manufacturer: string;
    publicPrice: number;
    bestPrices: Array<{ price: number; stock: number; supplier?: string }>;
    vat: number;
  }>;
  isVisible: boolean;
  userRole?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ selectedProducts, isVisible, userRole = 'Buyer' }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasSelectedProducts = selectedProducts.length > 0;

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportSelectedProducts(selectedProducts, format, userRole);
    setIsDropdownOpen(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip text="Select at least one product to be able to export a .csv or .xlsx file" position="top">
        <button
          className={`flex items-center gap-1 text-sm py-1.5 px-3 rounded transition-colors ${
            hasSelectedProducts 
            ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800' 
            : 'bg-gray-300 dark:bg-dark-bg-hover text-gray-500 dark:text-dark-text-disabled cursor-not-allowed'
          }`}
          onClick={() => hasSelectedProducts && setIsDropdownOpen(!isDropdownOpen)}
          disabled={!hasSelectedProducts}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </Tooltip>
      
      {isDropdownOpen && hasSelectedProducts && (
        <div className="absolute z-10 right-0 mt-1 w-48 bg-white dark:bg-dark-bg-card rounded-md shadow-lg dark:shadow-dark-lg py-1 text-sm border dark:border-dark-border-primary">
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-hover w-full text-left text-gray-900 dark:text-dark-text-primary"
            onClick={() => handleExport('xlsx')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600 dark:text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125m0 0v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0 1.5-1.5m-1.5 1.5L9.75 12m0 0 1.5 1.5m-1.5-1.5h-1.5m1.5 1.5h1.5m-7.5-6h6" />
            </svg>
            Excel (.xlsx)
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-bg-hover w-full text-left text-gray-900 dark:text-dark-text-primary"
            onClick={() => handleExport('csv')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            CSV (.csv)
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton; 