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
  useMediaQuery,
  Select,
  MenuItem,
  OutlinedInput,
  ListItemText,
  FormControl,
  InputLabel
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
  category?: string | string[];
  manufacturer?: string | string[];
  supplier?: string | string[];
  priceRange?: [number, number];
  inStockOnly?: boolean;
  availability?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  vatRate?: string | number | (string | number)[];
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
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const valueArray = Array.isArray(value) ? value : [];

  return (
    <Box sx={{ width: '100%' }}>
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
          <InputLabel id={`${id}-label`}>
            {label}
          </InputLabel>
        )}
        
        <Select
          labelId={`${id}-label`}
          id={id}
          multiple
          value={valueArray}
          onChange={(e) => onChange(e.target.value as string[])}
          input={<OutlinedInput label={compact ? undefined : label} />}
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
              paddingTop: compact ? 0.5 : undefined,
              paddingBottom: compact ? 0.5 : undefined,
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
                  <Typography sx={{ fontSize: compact ? '0.8rem' : '0.875rem' }}>
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
      category: [],
      manufacturer: [],
      supplier: [],
      priceRange: [minPrice, maxPrice],
      inStockOnly: false,
      availability: '',
      vatRate: [],
      minQuantity: 0,
      discountFilter: ''
    });
  };

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

  const renderActiveFilters = () => {
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
      if (Array.isArray(values.category) && values.category.length > 0) {
        if (values.category.length === 1) {
          const categoryValue = values.category[0]!;
          const categoryLabel = categories.find(c => c.value === categoryValue)?.label || categoryValue;
          chips.push(
            <Chip
              key="category"
              label={`Category: ${categoryLabel}`}
              size="small"
              onDelete={() => handleFilterChange('category', [])}
            />
          );
        } else {
          chips.push(
            <Chip
              key="category"
              label={`Categories: ${values.category.length} selected`}
              size="small"
              onDelete={() => handleFilterChange('category', [])}
            />
          );
        }
      } else if (typeof values.category === 'string' && values.category !== '') {
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
    }
    
    if (values.manufacturer) {
      if (Array.isArray(values.manufacturer) && values.manufacturer.length > 0) {
        if (values.manufacturer.length === 1) {
          const manufacturerValue = values.manufacturer[0]!;
          const manufacturerLabel = manufacturers.find(m => m.value === manufacturerValue)?.label || manufacturerValue;
          chips.push(
            <Chip
              key="manufacturer"
              label={`Manufacturer: ${manufacturerLabel}`}
              size="small"
              onDelete={() => handleFilterChange('manufacturer', [])}
            />
          );
        } else {
          chips.push(
            <Chip
              key="manufacturer"
              label={`Manufacturers: ${values.manufacturer.length} selected`}
              size="small"
              onDelete={() => handleFilterChange('manufacturer', [])}
            />
          );
        }
      } else if (typeof values.manufacturer === 'string' && values.manufacturer !== '') {
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
    }
    
    if (values.supplier) {
      if (Array.isArray(values.supplier) && values.supplier.length > 0) {
        if (values.supplier.length === 1) {
          const supplierValue = values.supplier[0]!;
          const supplierLabel = suppliers.find(s => s.value === supplierValue)?.label || supplierValue;
          chips.push(
            <Chip
              key="supplier"
              label={`Supplier: ${supplierLabel}`}
              size="small"
              onDelete={() => handleFilterChange('supplier', [])}
            />
          );
        } else {
          chips.push(
            <Chip
              key="supplier"
              label={`Suppliers: ${values.supplier.length} selected`}
              size="small"
              onDelete={() => handleFilterChange('supplier', [])}
            />
          );
        }
      } else if (typeof values.supplier === 'string' && values.supplier !== '') {
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
      if (Array.isArray(values.vatRate)) {
        if (values.vatRate.length > 0) {
          if (values.vatRate.length === 1) {
            const vatValue = values.vatRate[0];
            const vatLabel = vatRates.find(v => v.value === vatValue)?.label || `${vatValue}%`;
            chips.push(
              <Chip
                key="vatRate"
                label={`VAT Rate: ${vatLabel}`}
                size="small"
                onDelete={() => handleFilterChange('vatRate', [])}
              />
            );
          } else {
            chips.push(
              <Chip
                key="vatRate"
                label={`VAT Rates: ${values.vatRate.length} selected`}
                size="small"
                onDelete={() => handleFilterChange('vatRate', [])}
              />
            );
          }
        }
      } else {
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
      
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
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
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1.5}
            divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem />}
          >
            <MultiSelect
              id="category"
              label="Category"
              value={Array.isArray(values.category) ? values.category : (values.category ? [values.category] : [])}
              onChange={(value) => handleFilterChange('category', value)}
              options={categories}
              placeholder="All Categories"
              compact
            />
            
            <MultiSelect
              id="manufacturer"
              label="Manufacturer"
              value={Array.isArray(values.manufacturer) ? values.manufacturer : (values.manufacturer ? [values.manufacturer] : [])}
              onChange={(value) => handleFilterChange('manufacturer', value)}
              options={manufacturers}
              placeholder="All Manufacturers"
              compact
            />
            
            <MultiSelect
              id="supplier"
              label="Supplier"
              value={Array.isArray(values.supplier) ? values.supplier : (values.supplier ? [values.supplier] : [])}
              onChange={(value) => handleFilterChange('supplier', value)}
              options={suppliers}
              placeholder="All Suppliers"
              compact
            />
          </Stack>
          
          {renderActiveFilters()}
        </Stack>
      </Box>
      
      <Collapse in={showAdvanced}>
        <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #eaeaea', bgcolor: 'background.default' }}>
          <Stack spacing={2}>
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
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mt: 1,
                px: 1
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  €{values.priceRange ? values.priceRange[0] : minPrice}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  €{values.priceRange ? values.priceRange[1] : maxPrice}
                </Typography>
              </Box>
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
                <MultiSelect
                  id="vatRate"
                  label="VAT Rate"
                  value={Array.isArray(values.vatRate) ? values.vatRate : (values.vatRate ? [values.vatRate] : [])}
                  onChange={(value) => handleFilterChange('vatRate', value)}
                  options={vatRates}
                  placeholder="All VAT Rates"
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