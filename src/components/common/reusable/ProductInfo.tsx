import React from 'react';
import { Box, Typography } from '@mui/material';

interface ProductInfoProps {
  name: string;
  manufacturer: string;
  inStock: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  name,
  manufacturer,
  inStock
}) => {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
        {manufacturer} • {inStock ? 'In Stock' : 'Out of Stock'}
      </Typography>
    </Box>
  );
};

export default ProductInfo; 