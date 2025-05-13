import React from 'react';
import { Box, TextField } from '@mui/material';

interface QuantityInputProps {
  value: number | string;
  onChange: (value: number) => void;
  isExceeded?: boolean;
  width?: number | string;
  min?: number;
  step?: number;
}

const QuantityInput: React.FC<QuantityInputProps> = ({
  value,
  onChange,
  isExceeded = false,
  width = 100,
  min = 0,
  step = 1
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseInt(e.target.value);
    onChange(isNaN(parsedValue) ? 0 : parsedValue);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        type="number"
        size="small"
        InputProps={{ 
          inputProps: { min, step },
          sx: { 
            height: '30px', 
            fontSize: '0.875rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isExceeded ? '#ff9800' : 'rgba(0, 0, 0, 0.12)',
              borderWidth: isExceeded ? '2px' : '1px'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isExceeded ? '#ff9800' : 'rgba(0, 0, 0, 0.23)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isExceeded ? '#ff9800' : '#1976d2'
            }
          }
        }}
        value={value || ''}
        onChange={handleChange}
        sx={{ 
          width,
          '& input': {
            padding: '6px 8px',
            textAlign: 'center'
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

export default QuantityInput; 