import React from 'react';
import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  SxProps,
  Theme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FilterOption } from './FilterField';

interface FilterSelectProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: FilterOption[];
  placeholder?: string;
  allowClear?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  allowClear = true,
  compact = false,
  fullWidth = true,
  sx
}) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      {compact ? (
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem' }}>
          {label}
        </Typography>
      ) : null}
      
      <FormControl 
        fullWidth 
        size="small" 
        variant="outlined"
        sx={{ 
          '& .MuiInputBase-root': { 
            height: compact ? 32 : 40,
            fontSize: compact ? '0.8rem' : '0.875rem'
          },
          '& .MuiInputLabel-root': {
            fontSize: compact ? '0.8rem' : '0.875rem',
            transform: compact ? undefined : 'translate(14px, 10px) scale(1)'
          },
          '& .MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
            backgroundColor: 'white',
            padding: '0 4px',
            marginLeft: '-4px',
            '&:before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '40%',
              width: '100%',
              height: '1px',
              backgroundColor: 'white',
              zIndex: -1
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dddddd'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#aaaaaa'
          }
        }}
      >
        {!compact && (
          <InputLabel 
            id={`${id}-label`}
            shrink={!!value}
          >
            {label}
          </InputLabel>
        )}
        
        <Select
          labelId={`${id}-label`}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={compact ? undefined : label}
          displayEmpty
          sx={{
            '& .MuiSelect-select': {
              paddingTop: compact ? 0.5 : undefined,
              paddingBottom: compact ? 0.5 : undefined,
              paddingLeft: 1.5,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              paddingRight: value && allowClear ? '32px' : undefined
            }
          }}
          endAdornment={
            value && allowClear ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ p: '2px', mr: 0.5 }}
                  edge="end"
                >
                  <CloseIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 300,
                mt: 0.5
              }
            }
          }}
        >
          <MenuItem value="">
            <Typography noWrap sx={{ fontSize: compact ? '0.8rem' : '0.875rem', color: 'text.secondary' }}>
              {placeholder}
            </Typography>
          </MenuItem>
          
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Typography noWrap sx={{ fontSize: compact ? '0.8rem' : '0.875rem' }}>
                {option.label}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterSelect; 