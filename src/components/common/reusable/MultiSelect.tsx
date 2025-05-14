import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  InputAdornment,
  OutlinedInput,
  FormControl,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FilterOption } from './FilterField';

interface MultiSelectProps {
  id: string;
  label: string;
  value: string[] | (string | number)[];
  onChange: (value: string[] | (string | number)[]) => void;
  options: FilterOption[];
  placeholder?: string;
  compact?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  label,
  value = [],
  onChange,
  options,
  placeholder = 'All',
  compact = false
}) => {
  const theme = useTheme();
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const valueArray = Array.isArray(value) ? value : [];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.75rem' }}>
        {label}
      </Typography>
      
      <FormControl 
        fullWidth 
        size="small" 
        variant="outlined"
        sx={{ 
          '& .MuiInputBase-root': { 
            height: 36,
            fontSize: '0.85rem'
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dddddd'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main
          }
        }}
      >
        <Select
          id={id}
          multiple
          value={valueArray}
          onChange={(e) => onChange(e.target.value as string[])}
          input={<OutlinedInput />}
          renderValue={(selected) => {
            const selectedArray = selected as (string | number)[];
            if (selectedArray.length === 0) {
              return placeholder;
            }
            if (selectedArray.length === 1) {
              const selectedOption = options.find(
                (option) => option.value === selectedArray[0]
              );
              return selectedOption ? selectedOption.label : selectedArray[0].toString();
            }
            return `${selectedArray.length} selected`;
          }}
          endAdornment={
            valueArray.length > 0 ? (
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
          sx={{
            '& .MuiSelect-select': {
              paddingLeft: 1.5,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Checkbox 
                checked={valueArray.indexOf(option.value.toString()) > -1} 
                size="small"
              />
              <ListItemText 
                primary={
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    {option.label}
                  </Typography>
                } 
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default MultiSelect; 