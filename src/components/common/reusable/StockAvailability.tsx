import React from 'react';
import { getTotalAvailableStock } from '../utils/priceCalculations';

interface StockAvailabilityProps {
  bestPrices: Array<{ price: number; stock: number }>;
  compact?: boolean;
}

const StockAvailability: React.FC<StockAvailabilityProps> = ({ 
  bestPrices,
  compact = false
}) => {
  const totalStock = getTotalAvailableStock(bestPrices);
  
  return (
    <div className={`${compact ? 'mt-2' : 'mt-4'} flex items-center`}>
      <div className="group relative">
        <div className={`flex items-center bg-blue-50 dark:bg-blue-900/30 ${compact ? 'px-2 py-1' : 'px-4 py-2'} rounded ${compact ? 'text-[0.65rem]' : 'text-[0.75rem]'} font-medium text-gray-900 dark:text-dark-text-primary border dark:border-blue-800/30`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} mr-1 text-blue-600 dark:text-blue-400`}>
            <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          {compact ? "Stock: " : "Stock Totale: "}{totalStock}
        </div>
        <div className="absolute left-0 bottom-6 hidden group-hover:block bg-white dark:bg-dark-bg-card p-2 rounded shadow-lg dark:shadow-dark-lg text-xs w-60 z-50 border dark:border-dark-border-primary text-gray-900 dark:text-dark-text-primary">
          Disponibilità totale dello stock da tutti i fornitori
        </div>
      </div>
    </div>
  );
};

export default StockAvailability; 