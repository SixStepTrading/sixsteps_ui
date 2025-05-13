import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Inventory } from '@mui/icons-material';
import { getTotalAvailableStock } from '../utils/priceCalculations';

interface StockAvailabilityProps {
  bestPrices: Array<{ price: number; stock: number }>;
}

const StockAvailability: React.FC<StockAvailabilityProps> = ({ bestPrices }) => {
  const totalStock = getTotalAvailableStock(bestPrices);
  
  return (
    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Disponibilità totale dello stock da tutti i fornitori">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: '#eef7ff',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 'medium'
        }}>
          <Inventory sx={{ fontSize: '0.9rem', mr: 0.5, color: '#1976d2' }} />
          Stock Totale: {totalStock}
        </Box>
      </Tooltip>
    </Box>
  );
};

export default StockAvailability; 