import React from 'react';
import {
  Box,
  InputBase,
  Stack,
  IconButton,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

import { FilterOption } from './FilterField';
import MultiSelect from './MultiSelect';

export interface ProductFilterValues {
  searchTerm?: string;
  category?: string | string[];
  manufacturer?: string | string[];
  supplier?: string | string[];
}

interface ProductFilterProps {
  values: ProductFilterValues;
  onChange: (values: ProductFilterValues) => void;
  onApplyFilters: () => void;
  categories: FilterOption[];
  manufacturers: FilterOption[];
  suppliers: FilterOption[];
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  values,
  onChange,
  onApplyFilters,
  categories,
  manufacturers,
  suppliers
}) => {
  const theme = useTheme();
  
  const handleFilterChange = (id: string, value: any) => {
    onChange({
      ...values,
      [id]: value
    });
  };

  const handleResetFilters = () => {
    onChange({
      searchTerm: '',
      category: [],
      manufacturer: [],
      supplier: []
    });
    onApplyFilters();
  };

  return (
    <Stack 
      direction={{ xs: 'column', md: 'row' }} 
      spacing={{ xs: 1, md: 2 }} 
      alignItems="center"
      sx={{ width: '100%', my: 1 }}
    >
      {/* Search Box */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        width: { xs: '100%', md: '30%' },
        backgroundColor: theme.palette.action.hover,
        borderRadius: 1,
        px: 1,
        py: 0.5
      }}>
        <SearchIcon color="action" sx={{ mr: 1 }} />
        <InputBase
          placeholder="Search products by name, code, EAN..."
          fullWidth
          value={values.searchTerm || ''}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onApplyFilters()}
          sx={{ fontSize: '0.9rem' }}
        />
        {values.searchTerm && (
          <IconButton 
            size="small" 
            sx={{ p: '2px' }}
            onClick={() => handleFilterChange('searchTerm', '')}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      {/* Category Filter */}
      <Box sx={{ width: { xs: '100%', md: '20%' } }}>
        <MultiSelect
          id="category"
          label="Category"
          value={Array.isArray(values.category) ? values.category : (values.category ? [values.category] : [])}
          onChange={(value) => handleFilterChange('category', value)}
          options={categories}
          compact
        />
      </Box>
      
      {/* Manufacturer Filter */}
      <Box sx={{ width: { xs: '100%', md: '20%' } }}>
        <MultiSelect
          id="manufacturer"
          label="Manufacturer"
          value={Array.isArray(values.manufacturer) ? values.manufacturer : (values.manufacturer ? [values.manufacturer] : [])}
          onChange={(value) => handleFilterChange('manufacturer', value)}
          options={manufacturers}
          compact
        />
      </Box>
      
      {/* Supplier Filter */}
      <Box sx={{ width: { xs: '100%', md: '20%' } }}>
        <MultiSelect
          id="supplier"
          label="Supplier"
          value={Array.isArray(values.supplier) ? values.supplier : (values.supplier ? [values.supplier] : [])}
          onChange={(value) => handleFilterChange('supplier', value)}
          options={suppliers}
          compact
        />
      </Box>
      
      {/* Reset Button */}
      <Box sx={{ 
        ml: { xs: 0, md: 'auto' },
        display: 'flex',
        alignItems: 'center'
      }}>
        <IconButton 
          onClick={handleResetFilters}
          size="small"
          color="primary"
          sx={{ p: 0.75 }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
    </Stack>
  );
};

export default ProductFilter; 