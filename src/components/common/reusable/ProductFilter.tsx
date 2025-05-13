import React, { useState, useMemo } from 'react';
import {
  Box,
  InputBase,
  Chip,
  Typography,
  InputAdornment,
  Slider,
  IconButton,
  Divider,
  Stack,
  Checkbox,
  FormControlLabel,
  Paper,
  Collapse,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

import FilterSelect from './FilterSelect';
import { FilterOption } from './FilterField';

export interface ProductFilterValues {
  searchTerm?: string;
  category?: string;
  manufacturer?: string;
  supplier?: string;
  priceRange?: [number, number];
  inStockOnly?: boolean;
  availability?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  vatRate?: string | number;
  minQuantity?: number;
  expiryDateRange?: [Date | null, Date | null];
  discountFilter?: string;
}

interface ProductFilterProps {
  values: ProductFilterValues;
  onChange: (values: ProductFilterValues) => void;
  onApplyFilters: () => void;
  categories: FilterOption[];
  manufacturers: FilterOption[];
  suppliers: FilterOption[];
  vatRates: FilterOption[];
  maxPrice?: number;
  minPrice?: number;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  values,
  onChange,
  onApplyFilters,
  categories,
  manufacturers,
  suppliers,
  vatRates,
  maxPrice = 1000,
  minPrice = 0
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleFilterChange = (id: string, value: any) => {
    onChange({
      ...values,
      [id]: value
    });
  };

  const handleResetFilters = () => {
    onChange({
      searchTerm: '',
      category: '',
      manufacturer: '',
      supplier: '',
      priceRange: [minPrice, maxPrice],
      inStockOnly: false,
      availability: '',
      vatRate: '',
      minQuantity: 0,
      discountFilter: ''
    });
  };

  // Calcola quanti filtri sono attivi
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (values.searchTerm) count++;
    if (values.category) count++;
    if (values.manufacturer) count++;
    if (values.supplier) count++;
    if (values.priceRange && (values.priceRange[0] > minPrice || values.priceRange[1] < maxPrice)) count++;
    if (values.inStockOnly) count++;
    if (values.availability) count++;
    if (values.vatRate) count++;
    if (values.minQuantity && values.minQuantity > 0) count++;
    if (values.discountFilter) count++;
    return count;
  }, [values, minPrice, maxPrice]);

  // Genera le chips per i filtri attivi
  const renderActiveFilters = () => {
    if (activeFiltersCount === 0) return null;
    
    const chips = [];
    
    if (values.searchTerm) {
      chips.push(
        <Chip
          key="searchTerm"
          label={`Search: ${values.searchTerm}`}
          size="small"
          onDelete={() => handleFilterChange('searchTerm', '')}
          sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
        />
      );
    }
    
    if (values.category) {
      const categoryLabel = categories.find(c => c.value === values.category)?.label || values.category;
      chips.push(
        <Chip
          key="category"
          label={`Category: ${categoryLabel}`}
          size="small"
          onDelete={() => handleFilterChange('category', '')}
        />
      );
    }
    
    if (values.manufacturer) {
      const manufacturerLabel = manufacturers.find(m => m.value === values.manufacturer)?.label || values.manufacturer;
      chips.push(
        <Chip
          key="manufacturer"
          label={`Manufacturer: ${manufacturerLabel}`}
          size="small"
          onDelete={() => handleFilterChange('manufacturer', '')}
        />
      );
    }
    
    if (values.supplier) {
      const supplierLabel = suppliers.find(s => s.value === values.supplier)?.label || values.supplier;
      chips.push(
        <Chip
          key="supplier"
          label={`Supplier: ${supplierLabel}`}
          size="small"
          onDelete={() => handleFilterChange('supplier', '')}
        />
      );
    }
    
    if (values.priceRange && (values.priceRange[0] > minPrice || values.priceRange[1] < maxPrice)) {
      chips.push(
        <Chip
          key="priceRange"
          label={`Price: €${values.priceRange[0]} - €${values.priceRange[1]}`}
          size="small"
          onDelete={() => handleFilterChange('priceRange', [minPrice, maxPrice])}
        />
      );
    }
    
    if (values.inStockOnly) {
      chips.push(
        <Chip
          key="inStockOnly"
          label="In Stock Only"
          size="small"
          onDelete={() => handleFilterChange('inStockOnly', false)}
        />
      );
    }
    
    if (values.availability) {
      const availabilityMap: Record<string, string> = {
        'all': 'All Products',
        'in_stock': 'In Stock',
        'low_stock': 'Low Stock',
        'out_of_stock': 'Out of Stock'
      };
      
      chips.push(
        <Chip
          key="availability"
          label={`Availability: ${availabilityMap[values.availability] || values.availability}`}
          size="small"
          onDelete={() => handleFilterChange('availability', '')}
        />
      );
    }
    
    if (values.vatRate) {
      const vatLabel = vatRates.find(v => v.value === values.vatRate)?.label || `${values.vatRate}%`;
      chips.push(
        <Chip
          key="vatRate"
          label={`VAT Rate: ${vatLabel}`}
          size="small"
          onDelete={() => handleFilterChange('vatRate', '')}
        />
      );
    }
    
    if (values.minQuantity && values.minQuantity > 0) {
      chips.push(
        <Chip
          key="minQuantity"
          label={`Min Quantity: ${values.minQuantity}`}
          size="small"
          onDelete={() => handleFilterChange('minQuantity', 0)}
        />
      );
    }
    
    if (values.discountFilter) {
      const discountMap: Record<string, string> = {
        'all': 'All Products',
        'discount_5': 'Min. 5% Discount',
        'discount_10': 'Min. 10% Discount',
        'discount_15': 'Min. 15% Discount',
        'discount_20': 'Min. 20% Discount'
      };
      
      chips.push(
        <Chip
          key="discountFilter"
          label={`Discount: ${discountMap[values.discountFilter] || values.discountFilter}`}
          size="small"
          onDelete={() => handleFilterChange('discountFilter', '')}
        />
      );
    }
    
    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <Stack 
          direction="row" 
          spacing={0.5} 
          alignItems="center" 
          flexWrap="wrap" 
          useFlexGap 
          sx={{ gap: 0.5 }}
        >
          {chips}
          
          {activeFiltersCount > 1 && (
            <Chip
              icon={<RefreshIcon fontSize="small" />}
              label="Clear All"
              size="small"
              variant="outlined"
              onClick={handleResetFilters}
              color="primary"
            />
          )}
        </Stack>
      </Box>
    );
  };

  const availabilityOptions = [
    { value: 'all', label: 'All Products' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];
  
  const discountOptions = [
    { value: 'all', label: 'All Products' },
    { value: 'discount_5', label: 'Min. 5% Discount' },
    { value: 'discount_10', label: 'Min. 10% Discount' },
    { value: 'discount_15', label: 'Min. 15% Discount' },
    { value: 'discount_20', label: 'Min. 20% Discount' }
  ];

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
      {/* Header con totale e info filtri */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'background.default',
        borderBottom: '1px solid #eaeaea',
        px: 2, 
        py: 1
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Product filters">
            <FilterListIcon color="primary" fontSize="small" />
          </Tooltip>
          <Typography variant="subtitle2" fontWeight={500}>
            Products
          </Typography>
          
          {activeFiltersCount > 0 && (
            <Badge 
              badgeContent={activeFiltersCount} 
              color="primary" 
              sx={{ '.MuiBadge-badge': { fontSize: '0.7rem', height: 16, minWidth: 16 } }}
            >
              <TuneIcon fontSize="small" color="action" />
            </Badge>
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={showAdvanced ? "Hide advanced filters" : "Show advanced filters"}>
            <IconButton 
              size="small" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              color={showAdvanced ? "primary" : "default"}
            >
              <ExpandMoreIcon sx={{ 
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.3s ease'
              }} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Apply filters">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={onApplyFilters}
              disabled={activeFiltersCount === 0}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {activeFiltersCount > 0 && (
            <Tooltip title="Reset all filters">
              <IconButton size="small" onClick={handleResetFilters}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
      
      {/* Filtri primari sempre visibili */}
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Barra di ricerca */}
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                borderColor: 'primary.main'
              }
            }}
          >
            <InputBase
              placeholder="Search products by name, code, EAN..."
              fullWidth
              value={values.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              }
              endAdornment={
                values.searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small"
                      onClick={() => handleFilterChange('searchTerm', '')}
                      edge="end"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
              sx={{ fontSize: '0.9rem' }}
            />
          </Paper>
          
          {/* Filtri principali */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1.5}
            divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
          >
            <FilterSelect
              id="category"
              label="Category"
              value={values.category || ''}
              onChange={(value: string | number) => handleFilterChange('category', value)}
              options={categories}
              placeholder="All Categories"
              allowClear
              compact
            />
            
            <FilterSelect
              id="manufacturer"
              label="Manufacturer"
              value={values.manufacturer || ''}
              onChange={(value: string | number) => handleFilterChange('manufacturer', value)}
              options={manufacturers}
              placeholder="All Manufacturers"
              allowClear
              compact
            />
            
            <FilterSelect
              id="supplier"
              label="Supplier"
              value={values.supplier || ''}
              onChange={(value: string | number) => handleFilterChange('supplier', value)}
              options={suppliers}
              placeholder="All Suppliers"
              allowClear
              compact
            />
          </Stack>
          
          {/* Chips per filtri attivi */}
          {renderActiveFilters()}
        </Stack>
      </Box>
      
      {/* Filtri avanzati - collapsible */}
      <Collapse in={showAdvanced}>
        <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #eaeaea', bgcolor: 'background.default' }}>
          <Stack spacing={2}>
            {/* Price Range */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Price Range (€)
              </Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={values.priceRange || [minPrice, maxPrice]}
                  onChange={(_, newValue) => handleFilterChange('priceRange', newValue as [number, number])}
                  min={minPrice}
                  max={maxPrice}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `€${value}`}
                />
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  px: 1, 
                  py: 0.5, 
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>€</Typography>
                  <InputBase
                    value={values.priceRange?.[0] || minPrice}
                    onChange={(e) => handleFilterChange('priceRange', [
                      Number(e.target.value) || minPrice, 
                      values.priceRange?.[1] || maxPrice
                    ])}
                    sx={{ fontSize: '0.875rem', width: 60 }}
                    inputProps={{ min: minPrice, type: 'number' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">—</Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  px: 1, 
                  py: 0.5, 
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>€</Typography>
                  <InputBase
                    value={values.priceRange?.[1] || maxPrice}
                    onChange={(e) => handleFilterChange('priceRange', [
                      values.priceRange?.[0] || minPrice, 
                      Number(e.target.value) || maxPrice
                    ])}
                    sx={{ fontSize: '0.875rem', width: 60 }}
                    inputProps={{ min: minPrice, type: 'number' }}
                  />
                </Box>
              </Stack>
            </Box>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
              sx={{ pt: 1 }}
            >
              <Box sx={{ flex: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.inStockOnly || false}
                      onChange={(e) => handleFilterChange('inStockOnly', e.target.checked)}
                      size="small"
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2">In Stock Only</Typography>}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <FilterSelect
                  id="availability"
                  label="Availability"
                  value={values.availability || ''}
                  onChange={(value: string | number) => handleFilterChange('availability', value)}
                  options={availabilityOptions}
                  placeholder="All Products"
                  allowClear
                  compact
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <FilterSelect
                  id="vatRate"
                  label="VAT Rate"
                  value={values.vatRate || ''}
                  onChange={(value: string | number) => handleFilterChange('vatRate', value)}
                  options={vatRates}
                  placeholder="All VAT Rates"
                  allowClear
                  compact
                />
              </Box>
            </Stack>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Min Quantity
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  px: 1, 
                  py: 0.5 
                }}>
                  <InputBase
                    value={values.minQuantity || ''}
                    onChange={(e) => handleFilterChange('minQuantity', e.target.value ? Number(e.target.value) : '')}
                    sx={{ fontSize: '0.875rem' }}
                    placeholder="0"
                    fullWidth
                    inputProps={{ min: 0, type: 'number' }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <FilterSelect
                  id="discountFilter"
                  label="Discount"
                  value={values.discountFilter || ''}
                  onChange={(value: string | number) => handleFilterChange('discountFilter', value)}
                  options={discountOptions}
                  placeholder="All Products"
                  allowClear
                  compact
                />
              </Box>
              
              <Box sx={{ flex: 1 }}></Box>
            </Stack>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ProductFilter; 