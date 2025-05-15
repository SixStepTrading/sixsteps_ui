import React from 'react';

interface AveragePriceDisplayProps {
  averagePrice: number | null;
  quantity: number;
  isStockExceeded?: boolean;
}

const AveragePriceDisplay: React.FC<AveragePriceDisplayProps> = ({
  averagePrice,
  quantity,
  isStockExceeded = false
}) => {
  if (quantity <= 0 || averagePrice === null) {
    return (
      <p className="text-gray-500 text-sm">
        --
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <p className={`font-medium text-sm ${isStockExceeded ? 'text-amber-500' : ''}`}>
          €{averagePrice.toFixed(2)}
        </p>
        
        {isStockExceeded && (
          <div className="group relative">
            <div className="inline-flex text-amber-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
            </div>
            <div className="absolute left-0 bottom-5 hidden group-hover:block bg-white p-2 rounded shadow-lg text-xs w-60 z-50">
              Il prezzo medio potrebbe essere impreciso a causa di stock insufficiente
            </div>
          </div>
        )}
      </div>
      
      <p className={`text-xs ${isStockExceeded ? 'text-amber-500' : 'text-gray-500'}`}>
        Total: €{(averagePrice * quantity).toFixed(2)}
      </p>
    </div>
  );
};

export default AveragePriceDisplay; 