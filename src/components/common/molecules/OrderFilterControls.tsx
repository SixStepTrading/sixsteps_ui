import React from 'react';
import { 
  Box, 
  TextField, 
  Button,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface OrderFilterControlsProps {
  searchValue: string;
  statusValue: string;
  dateValue: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  dateRangeOptions: { value: string; label: string }[];
}

const OrderFilterControls: React.FC<OrderFilterControlsProps> = ({
  searchValue,
  statusValue,
  dateValue,
  onSearchChange,
  onStatusChange,
  onDateChange,
  statusOptions,
  dateRangeOptions
}) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="Search orders by ID..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flexGrow: 1, minWidth: '220px' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      
      <FormControl size="small" sx={{ minWidth: '150px' }}>
        <InputLabel id="status-filter-label">All Statuses</InputLabel>
        <Select
          labelId="status-filter-label"
          id="status-filter"
          value={statusValue}
          label="All Statuses"
          onChange={(e: SelectChangeEvent) => onStatusChange(e.target.value)}
        >
          {statusOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl size="small" sx={{ minWidth: '180px' }}>
        <InputLabel id="date-filter-label">Date</InputLabel>
        <Select
          labelId="date-filter-label"
          id="date-filter"
          value={dateValue}
          label="Date"
          onChange={(e: SelectChangeEvent) => onDateChange(e.target.value)}
        >
          {dateRangeOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <IconButton 
        color="default"
        aria-label="refresh"
        onClick={() => {
          onSearchChange('');
          onStatusChange('');
          onDateChange('last30days');
        }}
      >
        <RefreshIcon />
      </IconButton>
    </Box>
  );
};

// Add IconButton type for the refresh button
interface IconButtonProps {
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  'aria-label': string;
  onClick: () => void;
  children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ color, 'aria-label': ariaLabel, onClick, children }) => {
  return (
    <Button
      variant="outlined"
      color={color === 'default' ? 'inherit' : color}
      aria-label={ariaLabel}
      onClick={onClick}
      sx={{ minWidth: 'auto', p: 1 }}
    >
      {children}
    </Button>
  );
};

export default OrderFilterControls; 