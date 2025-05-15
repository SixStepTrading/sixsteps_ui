import React from 'react';

interface PriceDisplayProps {
  publicPrice: number;
  supplierPrice: number;
  vatRate: number;
  stock: number;
  backgroundColor?: string;
  showNetVAT?: boolean;
  compact?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  publicPrice,
  supplierPrice,
  vatRate,
  stock,
  backgroundColor,
  showNetVAT = true,
  compact = false
}) => {
  // Calculate price difference and percentages
  const priceDifference = publicPrice - supplierPrice;
  // Ensure the percentage is always positive as it represents a discount/savings
  const percentDifference = Math.abs((priceDifference / publicPrice) * 100);
  
  // Calculate VAT-adjusted percentages (VAT removed ONLY from public price)
  const netPublicPrice = publicPrice / (1 + vatRate / 100);
  // The supplier price already doesn't include VAT, so we use it directly
  const netPercentDifference = Math.abs(((netPublicPrice - supplierPrice) / netPublicPrice) * 100);

  return (
    <div className={`${backgroundColor ? '' : 'bg-transparent'}`}>
      <p className={`font-medium ${compact ? 'text-[0.75rem] leading-tight' : 'text-[0.875rem] leading-normal'}`}>
        €{supplierPrice.toFixed(2)}
      </p>
      
      <p className={`text-red-600 ${compact ? 'text-[0.65rem] leading-tight' : 'text-[0.75rem] leading-snug'} block`}>
        -€{priceDifference.toFixed(2)} 
        <span className="text-red-600 font-bold">
          ({percentDifference.toFixed(1)}%)
        </span>
      </p>
      
      {showNetVAT && !compact && (
        <p className="text-gray-500 text-[0.7rem] block">
          Sconto Netto: <span className="text-red-600 font-bold">
            {netPercentDifference.toFixed(1)}%
          </span>
        </p>
      )}
      
      <p className={`${compact ? 'text-[0.7rem] leading-tight' : 'text-[0.8rem] leading-snug'}`}>
        Stock: {stock}
      </p>
    </div>
  );
};

export default PriceDisplay; 