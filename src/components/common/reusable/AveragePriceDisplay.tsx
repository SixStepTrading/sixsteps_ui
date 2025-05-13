import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

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
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
        --
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" sx={{ 
          fontWeight: 'medium', 
          fontSize: '0.875rem',
          color: isStockExceeded ? '#ff9800' : 'inherit'
        }}>
          €{averagePrice.toFixed(2)}
        </Typography>
        
        {isStockExceeded && (
          <Tooltip title="Il prezzo medio potrebbe essere impreciso a causa di stock insufficiente">
            <Box sx={{ 
              display: 'inline-flex',
              color: '#ff9800', 
              fontSize: '1rem' 
            }}>
              <InfoIcon fontSize="small" />
            </Box>
          </Tooltip>
        )}
      </Box>
      
      <Typography variant="caption" 
        color={isStockExceeded ? '#ff9800' : 'text.secondary'} 
        sx={{ fontSize: '0.75rem' }}
      >
        Total: €{(averagePrice * quantity).toFixed(2)}
      </Typography>
    </Box>
  );
};

export default AveragePriceDisplay; 