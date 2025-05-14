import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { Inventory } from '@mui/icons-material';
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
    <Box sx={{ 
      mt: compact ? 0.5 : 1, 
      display: 'flex', 
      alignItems: 'center' 
    }}>
      <Tooltip title="Disponibilità totale dello stock da tutti i fornitori">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: '#eef7ff',
          px: compact ? 0.5 : 1,
          py: compact ? 0.25 : 0.5,
          borderRadius: 1,
          fontSize: compact ? '0.65rem' : '0.75rem',
          fontWeight: 'medium'
        }}>
          <Inventory sx={{ 
            fontSize: compact ? '0.75rem' : '0.9rem', 
            mr: 0.5, 
            color: '#1976d2' 
          }} />
          {compact ? "Stock: " : "Stock Totale: "}{totalStock}
        </Box>
      </Tooltip>
    </Box>
  );
};

export default StockAvailability; 