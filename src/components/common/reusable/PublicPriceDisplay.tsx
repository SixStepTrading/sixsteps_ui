import React from 'react';
import { Typography } from '@mui/material';

interface PublicPriceDisplayProps {
  price: number;
  vatRate: number;
}

const PublicPriceDisplay: React.FC<PublicPriceDisplayProps> = ({
  price,
  vatRate
}) => {
  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
        €{price.toFixed(2)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
        VAT {vatRate}%
      </Typography>
    </>
  );
};

export default PublicPriceDisplay; 