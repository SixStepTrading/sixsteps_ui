import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Typography,
  Slider,
  Input,
  InputAdornment,
  IconButton,
  Stack,
  SxProps,
  Theme
} from '@mui/material';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';

type FilterFieldType = 'text' | 'select' | 'multiselect' | 'checkbox' | 'switch' | 'range';

export interface FilterOption {
  value: string | number;
  label: string;
}

export type FilterFieldValue = string | number | boolean | number[] | string[];

export interface FilterFieldProps {
  type: FilterFieldType;
  id: string;
  label: string;
  value: FilterFieldValue;
  onChange: (value: FilterFieldValue) => void;
  options?: FilterOption[];
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  minWidth?: number | string;
  adornment?: React.ReactNode;
  currencySymbol?: string;
  min?: number;
  max?: number;
  step?: number;
  hasSearch?: boolean;
  sx?: SxProps<Theme>;
}

const FilterField: React.FC<FilterFieldProps> = ({
  type,
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = '',
  fullWidth = true,
  size = 'small',
  minWidth = 200,
  adornment,
  currencySymbol = '€',
  min = 0,
  max = 100,
  step = 1,
  hasSearch = false,
  sx
}) => {
  const handleChange = (newValue: FilterFieldValue) => {
    onChange(newValue);
  };

  const handleClear = () => {
    switch (type) {
      case 'text':
        onChange('');
        break;
      case 'select':
        onChange('');
        break;
      case 'multiselect':
        onChange([] as string[]);
        break;
      case 'checkbox':
      case 'switch':
        onChange(false);
        break;
      case 'range':
        onChange([min, max] as number[]);
        break;
    }
  };

  const renderField = () => {
    switch (type) {
      case 'text':
        return (
          <TextField
            id={id}
            label={label}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            fullWidth={fullWidth}
            size={size}
            InputProps={{
              startAdornment: hasSearch ? (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" sx={{ fontSize: '0.9rem' }} />
                </InputAdornment>
              ) : adornment,
              endAdornment: value ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear} sx={{ p: '2px' }}>
                    <ClearIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{ 
              minWidth,
              '& .MuiInputBase-root': {
                height: size === 'small' ? 36 : 44
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.85rem',
                transform: 'translate(14px, 9px) scale(1)'
              },
              '& .MuiInputLabel-shrink': {
                transform: 'translate(14px, -6px) scale(0.75)',
                backgroundColor: 'white',
                padding: '0 4px',
                marginLeft: '-4px'
              },
              ...sx
            }}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth={fullWidth} size={size} sx={{ 
            minWidth,
            '& .MuiInputBase-root': {
              height: size === 'small' ? 36 : 44
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.85rem',
              transform: 'translate(14px, 9px) scale(1)'
            },
            '& .MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
              backgroundColor: 'white',
              padding: '0 4px',
              marginLeft: '-4px'
            },
            ...sx
          }}>
            <InputLabel id={`${id}-label`}>{label}</InputLabel>
            <Select
              labelId={`${id}-label`}
              id={id}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              label={label}
              displayEmpty
              endAdornment={value ? (
                <IconButton 
                  size="small" 
                  onClick={handleClear}
                  sx={{ mr: 2, p: '2px' }}
                >
                  <ClearIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              ) : null}
              sx={{
                '& .MuiSelect-select': {
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  paddingRight: value ? '32px' : '14px'
                }
              }}
            >
              <MenuItem value="">
                <Typography noWrap variant="body2">
                  {placeholder || `All ${label}`}
                </Typography>
              </MenuItem>
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Typography noWrap variant="body2">
                    {option.label}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiselect':
        const multiselectValue = Array.isArray(value) ? value as string[] : [];
        
        return (
          <FormControl fullWidth={fullWidth} size={size} sx={{ 
            minWidth,
            '& .MuiInputBase-root': {
              minHeight: size === 'small' ? 36 : 44
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.85rem',
              transform: 'translate(14px, 9px) scale(1)'
            },
            '& .MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
              backgroundColor: 'white',
              padding: '0 4px',
              marginLeft: '-4px'
            },
            ...sx
          }}>
            <InputLabel id={`${id}-label`}>{label}</InputLabel>
            <Select
              labelId={`${id}-label`}
              id={id}
              multiple
              value={multiselectValue}
              onChange={(e) => handleChange(e.target.value as string[])}
              input={<OutlinedInput label={label} />}
              renderValue={(selected) => {
                const selectedArray = selected as string[];
                if (selectedArray.length === 0) {
                  return placeholder || `All ${label}`;
                }
                if (selectedArray.length === 1) {
                  const selectedOption = options.find(
                    (option) => option.value === selectedArray[0]
                  );
                  return selectedOption ? selectedOption.label : selectedArray[0];
                }
                return `${selectedArray.length} selected`;
              }}
              endAdornment={multiselectValue.length > 0 ? (
                <IconButton 
                  size="small" 
                  onClick={handleClear}
                  sx={{ mr: 2, p: '2px' }}
                >
                  <ClearIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              ) : null}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={multiselectValue.some(val => val === option.value.toString())} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(value)}
                onChange={(e) => handleChange(e.target.checked)}
                name={id}
                size={size}
              />
            }
            label={label}
            sx={{ 
              minWidth, 
              '& .MuiFormControlLabel-label': { 
                fontSize: '0.85rem',
                marginLeft: '-2px'
              },
              '& .MuiCheckbox-root': { 
                padding: '3px' 
              },
              ...sx 
            }}
          />
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleChange(e.target.checked)}
                name={id}
                size={size}
              />
            }
            label={label}
            sx={{ 
              minWidth,
              '& .MuiFormControlLabel-label': { 
                fontSize: '0.85rem' 
              },
              ...sx
            }}
          />
        );

      case 'range':
        const rangeValue = Array.isArray(value) ? value as number[] : [min, max];
        const [rangeMin, rangeMax] = rangeValue;
        
        return (
          <Box sx={{ width: '100%', px: 1, ...(sx as object) }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
              {label}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Slider
                  value={rangeValue}
                  onChange={(_, newValue) => handleChange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={min}
                  max={max}
                  step={step}
                  size={size}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box>
                <Input
                  value={rangeMin}
                  size="small"
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? min : Number(e.target.value);
                    handleChange([newValue, rangeMax]);
                  }}
                  startAdornment={
                    <InputAdornment position="start">{currencySymbol}</InputAdornment>
                  }
                  inputProps={{
                    step,
                    min,
                    max: rangeMax,
                    type: 'number',
                    'aria-labelledby': 'range-slider',
                  }}
                  sx={{ 
                    width: 70,
                    '& .MuiInputBase-input': { 
                      p: '2px',
                      fontSize: '0.85rem'
                    }
                  }}
                />
              </Box>
              <Box sx={{ mx: -1 }}>
                <Typography variant="body2">-</Typography>
              </Box>
              <Box>
                <Input
                  value={rangeMax}
                  size="small"
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? max : Number(e.target.value);
                    handleChange([rangeMin, newValue]);
                  }}
                  startAdornment={
                    <InputAdornment position="start">{currencySymbol}</InputAdornment>
                  }
                  inputProps={{
                    step,
                    min: rangeMin,
                    max,
                    type: 'number',
                    'aria-labelledby': 'range-slider',
                  }}
                  sx={{ 
                    width: 70,
                    '& .MuiInputBase-input': { 
                      p: '2px',
                      fontSize: '0.85rem'
                    }
                  }}
                />
              </Box>
              {(rangeMin > min || rangeMax < max) && (
                <Box>
                  <IconButton size="small" onClick={handleClear} sx={{ p: '2px' }}>
                    <ClearIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Box>
              )}
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return renderField();
};

export default FilterField; 