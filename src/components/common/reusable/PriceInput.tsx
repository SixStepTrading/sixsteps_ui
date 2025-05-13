import React from 'react';
import { Box, TextField } from '@mui/material';

interface PriceInputProps {
  value: number | null | string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: number | string;
  currencySymbol?: string;
  min?: number;
  step?: number;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = '€ Target',
  width = 100,
  currencySymbol = '€',
  min = 0,
  step = 0.01
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <TextField
        type="number"
        size="small"
        placeholder={placeholder}
        InputProps={{ 
          inputProps: { 
            min, 
            step 
          },
          startAdornment: <span style={{ fontSize: '0.875rem', marginRight: 4 }}>{currencySymbol}</span>,
          sx: { 
            height: '30px', 
            fontSize: '0.875rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.12)',
              borderWidth: '1px'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.23)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2'
            }
          }
        }}
        value={value !== null ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        sx={{ 
          width,
          '& input': {
            padding: '6px 8px',
            textAlign: 'right'
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
            backgroundColor: 'white'
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
};

export default PriceInput; 