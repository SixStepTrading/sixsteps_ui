import React from 'react';
import { Button } from '@mui/material';
import { 
  KeyboardArrowUp as KeyboardArrowUpIcon, 
  KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';

interface ShowMorePricesButtonProps {
  showAllPrices: boolean;
  additionalPricesCount: number;
  onClick: (e: React.MouseEvent) => void;
}

const ShowMorePricesButton: React.FC<ShowMorePricesButtonProps> = ({
  showAllPrices,
  additionalPricesCount,
  onClick
}) => {
  if (additionalPricesCount <= 0) {
    return null;
  }
  
  return (
    <Button 
      variant="text"
      color="primary"
      size="small" 
      startIcon={showAllPrices ? <KeyboardArrowUpIcon /> : <KeyboardArrowRightIcon />}
      onClick={onClick}
      sx={{ fontSize: '0.8rem', padding: '4px 8px' }}
    >
      {showAllPrices ? 'Hide' : `Show ${additionalPricesCount} more`}
    </Button>
  );
};

export default ShowMorePricesButton; 