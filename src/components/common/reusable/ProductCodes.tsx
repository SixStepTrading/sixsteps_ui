import React from 'react';
import { Box, Typography } from '@mui/material';

interface ProductCodesProps {
  ean: string;
  minsan: string;
}

const ProductCodes: React.FC<ProductCodesProps> = ({
  ean,
  minsan
}) => {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
        EAN: {ean}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
        Minsan: {minsan}
      </Typography>
    </Box>
  );
};

export default ProductCodes; 