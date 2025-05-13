import React from 'react';
import { Typography, Box, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface PriceDisplayProps {
  publicPrice: number;
  supplierPrice: number;
  vatRate: number;
  stock: number;
  backgroundColor?: string;
  showNetVAT?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  publicPrice,
  supplierPrice,
  vatRate,
  stock,
  backgroundColor,
  showNetVAT = true
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
    <Box sx={{ backgroundColor: backgroundColor || 'transparent' }}>
      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
        €{supplierPrice.toFixed(2)}
      </Typography>
      
      <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', display: 'block' }}>
        -€{priceDifference.toFixed(2)} 
        <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
          (Sconto: {percentDifference.toFixed(1)}%)
        </span>
      </Typography>
      
      {showNetVAT && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
          Sconto Netto: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
            {netPercentDifference.toFixed(1)}%
          </span>
        </Typography>
      )}
      
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        Stock: {stock}
      </Typography>
    </Box>
  );
};

export default PriceDisplay; 