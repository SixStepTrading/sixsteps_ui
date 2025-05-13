import React from 'react';
import { Box, Tooltip } from '@mui/material';

interface StockWarningIndicatorProps {
  quantity: number;
  availableStock: number;
}

const StockWarningIndicator: React.FC<StockWarningIndicatorProps> = ({
  quantity,
  availableStock
}) => {
  if (quantity === 0 || quantity <= availableStock) {
    return null;
  }
  
  return (
    <Tooltip title={`Attenzione: La quantità richiesta (${quantity}) supera lo stock disponibile (${availableStock}). Non è possibile selezionare questo prodotto.`}>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: '#ff9800',
        color: 'white',
        fontWeight: 'bold'
      }}>
        !
      </Box>
    </Tooltip>
  );
};

export default StockWarningIndicator; 