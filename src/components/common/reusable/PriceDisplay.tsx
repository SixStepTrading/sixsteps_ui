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
    <Box sx={{ backgroundColor: backgroundColor || 'transparent' }}>
      <Typography variant="body2" sx={{ 
        fontWeight: 'medium', 
        fontSize: compact ? '0.75rem' : '0.875rem',
        lineHeight: compact ? 1.2 : 1.43
      }}>
        €{supplierPrice.toFixed(2)}
      </Typography>
      
      <Typography variant="caption" color="error" sx={{ 
        fontSize: compact ? '0.65rem' : '0.75rem', 
        display: 'block',
        lineHeight: compact ? 1.1 : 1.25
      }}>
        -€{priceDifference.toFixed(2)} 
        <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
          ({percentDifference.toFixed(1)}%)
        </span>
      </Typography>
      
      {showNetVAT && !compact && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
          Sconto Netto: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
            {netPercentDifference.toFixed(1)}%
          </span>
        </Typography>
      )}
      
      <Typography variant="body2" sx={{ 
        fontSize: compact ? '0.7rem' : '0.8rem',
        lineHeight: compact ? 1.1 : 1.2
      }}>
        Stock: {stock}
      </Typography>
    </Box>
  );
};

export default PriceDisplay; 