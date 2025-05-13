import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Grid, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  TablePagination,
  CircularProgress,
  SelectChangeEvent,
  Alert,
  Snackbar,
  Tooltip,
  Collapse,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ShoppingCart, 
  AttachMoney, 
  Inventory, 
  LocalShipping,
  Add as AddIcon,
  Search as SearchIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Bookmark as BookmarkIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';
import debounce from 'lodash/debounce';
import StatCard from '../common/StatCard';
import { useToast } from '../../contexts/ToastContext';
import { Product } from '../../data/mockProducts';
import { fetchProducts, getFallbackProducts } from '../../utils/api';

// Interface for product with quantity
interface ProductWithQuantity extends Product {
  quantity: number;
  averagePrice: number | null;
  showAllPrices: boolean; // Track if we're showing all prices for this product
}

const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  
  // State for product data and pagination
  const [products, setProducts] = useState<ProductWithQuantity[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithQuantity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState<string | null>(null);
  
  // Calcola quante righe mostrare per pagina in base all'altezza della tabella
  const calculateRowsPerPage = (tableHeight: number): number => {
    // Stima l'altezza media di una riga (comprese le intestazioni e i margini)
    const estimatedRowHeight = 65; // in pixels
    const headerHeight = 56; // in pixels
    
    // Calcola quante righe possono entrare nella tabella
    const availableHeight = tableHeight - headerHeight;
    const estimatedRows = Math.floor(availableHeight / estimatedRowHeight);
    
    // Ritorna il valore più vicino tra le opzioni disponibili
    const options = [10, 25, 50, 100];
    return options.reduce((prev, curr) => 
      Math.abs(curr - estimatedRows) < Math.abs(prev - estimatedRows) ? curr : prev
    );
  };

  // Inizializza rowsPerPage con un valore calcolato in base all'altezza della tabella
  const [rowsPerPage, setRowsPerPage] = useState<number>(calculateRowsPerPage(600));
  
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [usingMockData, setUsingMockData] = useState(false);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Available filter options derived from product data
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  // Funzione per gestire l'apertura/chiusura della visualizzazione di tutti i prezzi
  const handleToggleAllPrices = (productId: string) => {
    setPriceDetailsOpen(priceDetailsOpen === productId ? null : productId);
  };

  // Load products
  const loadProducts = useCallback(async (useServerFiltering = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filter object for API request
      const filters = {
        searchTerm: useServerFiltering ? searchTerm : undefined,
        category: useServerFiltering ? categoryFilter : undefined,
        manufacturer: useServerFiltering ? manufacturerFilter : undefined,
        inStockOnly: useServerFiltering ? inStockOnly : undefined,
        minPrice: useServerFiltering && priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: useServerFiltering && priceRange[1] < 100 ? priceRange[1] : undefined
      };
      
      // Calculate page number for API (1-indexed vs 0-indexed)
      const apiPage = useServerFiltering ? page + 1 : 1;
      
      // Fetch data from API
      const result = await fetchProducts(apiPage, rowsPerPage, filters);
      
      // Add quantity and averagePrice properties to products
      const productsWithQuantity = result.products.map(product => ({
        ...product,
        quantity: 0,
        averagePrice: null,
        showAllPrices: false
      }));
      
      setProducts(productsWithQuantity);
      setTotalCount(result.totalCount);
      setCategories(result.categories);
      setManufacturers(result.manufacturers);
      
      // If using server filtering, filtered products = products returned
      if (useServerFiltering) {
        setFilteredProducts(productsWithQuantity);
      } else {
        // Otherwise, we need to apply client-side filtering
        applyClientFilters(productsWithQuantity);
      }
      
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to fetch products from API:', err);
      setError('Failed to load products from API. Using fallback data instead.');
      
      try {
        // Fallback to mock data
        const fallbackData = await getFallbackProducts();
        
        // Add quantity and averagePrice properties to mock products
        const productsWithQuantity = fallbackData.products.map(product => ({
          ...product,
          quantity: 0,
          averagePrice: null,
          showAllPrices: false
        }));
        
        setProducts(productsWithQuantity);
        setFilteredProducts(productsWithQuantity);
        setTotalCount(fallbackData.totalCount);
        setCategories(fallbackData.categories);
        setManufacturers(fallbackData.manufacturers);
        setUsingMockData(true);
        
        // If using mock data, we need to apply client-side filtering
        if (searchTerm || categoryFilter || manufacturerFilter || inStockOnly || 
            priceRange[0] > 0 || priceRange[1] < 100) {
          applyClientFilters(productsWithQuantity);
        }
      } catch (fallbackErr) {
        console.error('Failed to load fallback data:', fallbackErr);
        setError('Failed to load products. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, manufacturerFilter, inStockOnly, priceRange, page, rowsPerPage]);
  
  // Initial load of products
  useEffect(() => {
    loadProducts(true);
  }, [loadProducts]);
  
  // Apply client-side filters to products
  const applyClientFilters = useCallback((productsList: ProductWithQuantity[]) => {
    // Build active filters list for UI
    const newActiveFilters: string[] = [];
    if (categoryFilter) newActiveFilters.push(`Category: ${categoryFilter}`);
    if (manufacturerFilter) newActiveFilters.push(`Manufacturer: ${manufacturerFilter}`);
    if (inStockOnly) newActiveFilters.push('In Stock Only');
    if (priceRange[0] > 0 || priceRange[1] < 100) {
      newActiveFilters.push(`Price: €${priceRange[0]} - €${priceRange[1]}`);
    }
    setActiveFilters(newActiveFilters);
    
    // Filter products
    let filtered = [...productsList];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.ean.includes(term) || 
        product.minsan.includes(term) ||
        product.manufacturer.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply manufacturer filter
    if (manufacturerFilter) {
      filtered = filtered.filter(product => product.manufacturer === manufacturerFilter);
    }
    
    // Apply in-stock filter
    if (inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }
    
    // Apply price range filter
    filtered = filtered.filter(product => 
      product.publicPrice >= priceRange[0] && product.publicPrice <= priceRange[1]
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, manufacturerFilter, inStockOnly, priceRange]);
  
  // Function to calculate average price based on required quantity and available supplier stocks
  const calculateAveragePrice = (product: ProductWithQuantity, quantity: number): number | null => {
    if (quantity <= 0) return null;
    
    // Sort prices from lowest to highest (they should already be sorted, but just to be sure)
    const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
    if (sortedPrices.length === 0) return product.publicPrice;
    
    let remainingQuantity = quantity;
    let totalCost = 0;
    
    // Try to fulfill the required quantity starting from the best price
    for (const pricePoint of sortedPrices) {
      if (remainingQuantity <= 0) break;
      
      const quantityFromThisSupplier = Math.min(remainingQuantity, pricePoint.stock);
      totalCost += quantityFromThisSupplier * pricePoint.price;
      remainingQuantity -= quantityFromThisSupplier;
    }
    
    // If we still have remaining quantity, use public price
    if (remainingQuantity > 0) {
      totalCost += remainingQuantity * product.publicPrice;
    }
    
    // Calculate average price
    return totalCost / quantity;
  };
  
  // Handle quantity change for a product
  const handleQuantityChange = (id: string, quantity: number) => {
    // Update the quantity in products state
    const updatedProducts = products.map(product => {
      if (product.id === id) {
        const averagePrice = calculateAveragePrice(product, quantity);
        return { 
          ...product, 
          quantity,
          averagePrice
        };
      }
      return product;
    });
    
    setProducts(updatedProducts);
    
    // Also update filtered products
    const updatedFilteredProducts = filteredProducts.map(product => {
      if (product.id === id) {
        const averagePrice = calculateAveragePrice(product, quantity);
        return { 
          ...product, 
          quantity,
          averagePrice
        };
      }
      return product;
    });
    
    setFilteredProducts(updatedFilteredProducts);
    
    // If the product is selected, auto-select it
    if (quantity > 0 && !selected.includes(id)) {
      setSelected([...selected, id]);
    } else if (quantity === 0 && selected.includes(id)) {
      setSelected(selected.filter(itemId => itemId !== id));
    }
  };
  
  // Debounced filter application for search input
  const debouncedApplyFilters = useCallback(
    debounce(() => loadProducts(true), 500),
    [loadProducts]
  );
  
  // Apply filters whenever filter criteria change
  useEffect(() => {
    if (products.length > 0) {
      if (usingMockData) {
        // For mock data, use client-side filtering
        applyClientFilters(products);
      } else {
        // For real API data, reload from server with filters
        debouncedApplyFilters();
      }
    }
  }, [products, searchTerm, categoryFilter, manufacturerFilter, inStockOnly, priceRange, usingMockData, applyClientFilters, debouncedApplyFilters]);
  
  // Calculate total amount whenever selection changes or product quantities change
  useEffect(() => {
    if (selected.length > 0) {
      const selectedProducts = filteredProducts.filter(p => selected.includes(p.id));
      const total = selectedProducts.reduce((sum, product) => {
        if (product.quantity <= 0) return sum;
        
        if (product.averagePrice !== null) {
          return sum + (product.averagePrice * product.quantity);
        } else {
          // Use best price (first in the bestPrices array which is already sorted)
          const unitPrice = product.bestPrices.length > 0 ? product.bestPrices[0].price : product.publicPrice;
          return sum + (unitPrice * product.quantity);
        }
      }, 0);
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  }, [selected, filteredProducts]);
  
  // Handle pagination changes
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    if (!usingMockData) {
      // For real API data, reload products with new page
      loadProducts(true);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    if (!usingMockData) {
      // For real API data, reload products with new page size
      loadProducts(true);
    }
  };
  
  // Handle selection
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Only select products with quantity > 0
      const newSelected = filteredProducts
        .filter(product => product.quantity > 0)
        .map(product => product.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (event: React.MouseEvent<unknown>, id: string) => {
    const product = filteredProducts.find(p => p.id === id);
    if (!product || product.quantity <= 0) {
      showToast('Please enter a quantity before selecting this product', 'warning');
      return;
    }
    
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(itemId => itemId !== id);
    }

    setSelected(newSelected);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;
  
  // Handle filter changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };
  
  const handleManufacturerChange = (event: SelectChangeEvent) => {
    setManufacturerFilter(event.target.value);
  };
  
  const handleFilterClear = (filterToRemove: string) => {
    if (filterToRemove.startsWith('Category:')) {
      setCategoryFilter('');
    } else if (filterToRemove.startsWith('Manufacturer:')) {
      setManufacturerFilter('');
    } else if (filterToRemove === 'In Stock Only') {
      setInStockOnly(false);
    } else if (filterToRemove.startsWith('Price:')) {
      setPriceRange([0, 100]);
    }
  };
  
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setManufacturerFilter('');
    setInStockOnly(false);
    setPriceRange([0, 100]);
  };
  
  const handleCreateOda = () => {
    const productsWithQuantity = selected.filter(id => {
      const product = filteredProducts.find(p => p.id === id);
      return product && product.quantity > 0;
    });
    
    if (productsWithQuantity.length === 0) {
      showToast('Please select at least one product with quantity', 'warning');
      return;
    }
    
    const totalQuantity = filteredProducts
      .filter(p => selected.includes(p.id))
      .reduce((sum, p) => sum + p.quantity, 0);
    
    showToast(`ODA created with ${productsWithQuantity.length} products (${totalQuantity} items) totaling €${totalAmount.toFixed(2)}`, 'success');
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleRefresh = () => {
    loadProducts(true);
  };

  // Get the total quantity of selected products
  const getTotalQuantity = () => {
    return filteredProducts
      .filter(p => selected.includes(p.id))
      .reduce((sum, p) => sum + p.quantity, 0);
  };

  // Render price details dialog
  const renderPriceDetailsDialog = () => {
    if (!priceDetailsOpen) return null;
    
    const product = filteredProducts.find(p => p.id === priceDetailsOpen);
    if (!product) return null;
    
    return (
      <Dialog 
        open={!!priceDetailsOpen} 
        onClose={() => setPriceDetailsOpen(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Additional Price Details - {product.name}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Savings vs. Public Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {product.bestPrices.map((priceInfo, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      bgcolor: 
                        index === 0 ? '#e8f5e9' : 
                        index === 1 ? '#e3f2fd' : 
                        index === 2 ? '#f3e5f5' : 
                        'inherit'
                    }}
                  >
                    <TableCell>{priceInfo.supplier}</TableCell>
                    <TableCell align="right">€{priceInfo.price.toFixed(2)}</TableCell>
                    <TableCell align="right">{priceInfo.stock}</TableCell>
                    <TableCell align="right">-€{(product.publicPrice - priceInfo.price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceDetailsOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
          <Alert onClose={handleCloseError} severity="warning" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
      
      {renderPriceDetailsDialog()}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your pharmacy business today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
            onClick={() => showToast('New order functionality coming soon!', 'info')}
        >
            Create ODA
        </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stat Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Orders"
            value="2,458"
            icon={<ShoppingCart />}
            color="#1976d2"
            trend={{ value: 12, isPositive: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Revenue"
            value="€187,459"
            icon={<AttachMoney />}
            color="#4caf50"
            trend={{ value: 8, isPositive: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Products"
            value={totalCount.toString()}
            icon={<Inventory />}
            color="#ff9800"
            trend={{ value: 3, isPositive: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard 
            title="Deliveries"
            value="116"
            icon={<LocalShipping />}
            color="#f44336"
            trend={{ value: 2, isPositive: false }}
          />
        </Grid>

        {/* Product Catalog */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader 
              title="Product Catalog" 
              titleTypographyProps={{ variant: 'h6' }}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {usingMockData && (
                    <Chip 
                      label="Using Mock Data" 
                      color="warning" 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateOda}
                    disabled={selected.length === 0}
                  >
                    Create ODA
                  </Button>
              </Box>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ mb: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <TextField
                    placeholder="Search by name, code, EAN or manufacturer..."
                              size="small" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: searchTerm ? (
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <ClearIcon fontSize="small" />
                            </IconButton>
                      ) : null,
                    }}
                    sx={{ width: 300 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>All Categories</InputLabel>
                    <Select 
                      label="All Categories"
                      value={categoryFilter}
                      onChange={handleCategoryChange}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>All Manufacturers</InputLabel>
                    <Select
                      label="All Manufacturers"
                      value={manufacturerFilter}
                      onChange={handleManufacturerChange}
                    >
                      <MenuItem value="">All Manufacturers</MenuItem>
                      {manufacturers.map(manufacturer => (
                        <MenuItem key={manufacturer} value={manufacturer}>{manufacturer}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox 
                        checked={inStockOnly} 
                        onChange={(e) => setInStockOnly(e.target.checked)}
                      />
                      <Typography variant="body2">In Stock Only</Typography>
                    </Box>
                  </FormControl>
                </Box>
                <Button 
                  variant="contained" 
                  sx={{ bgcolor: '#3f51b5' }}
                  startIcon={<FilterListIcon />}
                  onClick={() => loadProducts(true)}
                  disabled={loading}
                >
                  Apply Filters
                </Button>
              </Box>
              
              {activeFilters.length > 0 && (
                <Box sx={{ p: 1, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {activeFilters.map((filter) => (
                    <Chip 
                      key={filter}
                      label={filter} 
                      variant="outlined" 
                      onDelete={() => handleFilterClear(filter)} 
                      sx={{ m: 0.5 }} 
                    />
                  ))}
                  <Box sx={{ flexGrow: 1 }}></Box>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={handleClearAllFilters}
                  >
                    Clear All Filters
                  </Button>
                </Box>
              )}
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer 
                    ref={tableRef}
                    sx={{ 
                      height: 600, 
                      maxHeight: 600, 
                      overflow: 'auto',
                      '& .MuiTableCell-root': {
                        whiteSpace: 'nowrap',
                        padding: '6px 16px',
                        fontSize: '0.875rem'
                      },
                      '& .MuiTableRow-root': {
                        height: 'auto'
                      },
                      '& .MuiInputBase-root': {
                        fontSize: '0.875rem'
                      },
                      '& .MuiCheckbox-root': {
                        padding: '3px'
                      },
                      position: 'relative',
                      width: '100%'
                    }}
                  >
                    <Table aria-label="product catalog table" stickyHeader size="small">
                      <TableHead>
                        <TableRow sx={{ 
                          '& th': { 
                            fontWeight: 'bold', 
                            bgcolor: '#f9f9f9', 
                            position: 'sticky',
                            top: 0
                          } 
                        }}>
                          <TableCell padding="checkbox" sx={{ 
                            position: 'sticky', 
                            left: 0, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 50,
                            zIndex: 3
                          }}>
                            <Checkbox
                              indeterminate={selected.length > 0 && selected.length < filteredProducts.filter(p => p.quantity > 0).length}
                              checked={filteredProducts.filter(p => p.quantity > 0).length > 0 && selected.length === filteredProducts.filter(p => p.quantity > 0).length}
                              onChange={handleSelectAllClick}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 50, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 40, 
                            zIndex: 2
                          }}>#</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 90, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 120, 
                            zIndex: 2
                          }}>EAN</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 210, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 100, 
                            zIndex: 2
                          }}>Minsan</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 310, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 200, 
                            zIndex: 2
                          }}>Product Name</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 510, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 100, 
                            zIndex: 2
                          }}>Public Price</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 610, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 90, 
                            zIndex: 2
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              Quantity
                              <Tooltip title="Enter the quantity you want to order. The system will calculate the best price from available suppliers.">
                                <IconButton size="small" sx={{ padding: '2px' }}>
                                  <InfoIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 700, 
                            top: 0,
                            bgcolor: '#f9f9f9', 
                            minWidth: 110, 
                            zIndex: 2
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              Avg. Price
                              <Tooltip title="Average price based on the ordered quantity and available supplier prices. If the quantity exceeds the stock of the best supplier, prices from the next best suppliers will be used.">
                                <IconButton size="small" sx={{ padding: '2px' }}>
                                  <InfoIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ bgcolor: '#e8f5e9', minWidth: 120 }}>Best Price</TableCell>
                          <TableCell sx={{ bgcolor: '#e3f2fd', minWidth: 120 }}>2nd Best</TableCell>
                          <TableCell sx={{ bgcolor: '#f3e5f5', minWidth: 120 }}>3rd Best</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>Other prices</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                              <Typography variant="h6" color="text.secondary">
                                No products found
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 1 }}>
                                Try adjusting your search or filter criteria to find products.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProducts
                            .slice(usingMockData ? page * rowsPerPage : 0, usingMockData ? page * rowsPerPage + rowsPerPage : rowsPerPage)
                            .map((product, index) => {
                              const isItemSelected = isSelected(product.id);
                              const isExpanded = priceDetailsOpen === product.id;
                              
                              return (
                                <TableRow 
                                  hover
                                  onClick={(event) => {
                                    // Click handling only for selection checkbox
                                    if ((event.target as HTMLElement).closest('button') === null &&
                                        !(event.target as HTMLElement).closest('input[type="number"]')) {
                                      handleSelectClick(event, product.id);
                                    }
                                  }}
                                  role="checkbox"
                                  aria-checked={isItemSelected}
                                  tabIndex={-1}
                                  key={product.id}
                                  selected={isItemSelected}
                                  sx={{ height: 'auto' }}
                                >
                                  <TableCell 
                                    padding="checkbox" 
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 0, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1
                                    }}
                                  >
                                    <Checkbox checked={isItemSelected} size="small" />
                                  </TableCell>
                                  <TableCell 
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 50, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                  >
                                    {usingMockData ? page * rowsPerPage + index + 1 : index + 1}
                                  </TableCell>
                                  <TableCell
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 90, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                  >
                                    {product.ean}
                                  </TableCell>
                                  <TableCell
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 210, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                  >
                                    {product.minsan}
                                  </TableCell>
                                  <TableCell
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 310, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                        {product.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        {product.manufacturer} • {product.inStock ? 'In Stock' : 'Out of Stock'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell
                            sx={{ 
                                      position: 'sticky', 
                                      left: 510, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                      €{product.publicPrice.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                      VAT {product.vat}%
                                    </Typography>
                        </TableCell>
                                  
                                  {/* Quantity input column */}
                                  <TableCell
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 610, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <TextField
                                      type="number"
                            size="small" 
                                      InputProps={{ 
                                        inputProps: { min: 0, step: 1 },
                                        sx: { height: '30px', fontSize: '0.875rem' }
                                      }}
                                      value={product.quantity || ''}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        handleQuantityChange(product.id, isNaN(value) ? 0 : value);
                                      }}
                                      sx={{ width: 70 }}
                                      onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                                  
                                  {/* Average price column */}
                                  <TableCell
                                    sx={{ 
                                      position: 'sticky', 
                                      left: 700, 
                                      bgcolor: isItemSelected ? 'rgba(25, 118, 210, 0.08)' : 'white', 
                                      zIndex: 1 
                                    }}
                                  >
                                    {product.quantity > 0 && product.averagePrice !== null ? (
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                          €{product.averagePrice.toFixed(2)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                          Total: €{(product.averagePrice * product.quantity).toFixed(2)}
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        --
                                      </Typography>
                                    )}
                                  </TableCell>
                                  
                                  {/* Best price 1 */}
                                  {product.bestPrices.length > 0 ? (
                                    <TableCell sx={{ bgcolor: '#e8f5e9' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                        €{product.bestPrices[0].price.toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>
                                        -€{(product.publicPrice - product.bestPrices[0].price).toFixed(2)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                        Stock: {product.bestPrices[0].stock}
                                      </Typography>
                                    </TableCell>
                                  ) : (
                                    <TableCell sx={{ bgcolor: '#e8f5e9' }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        No supplier
                                      </Typography>
                                    </TableCell>
                                  )}
                                  
                                  {/* Best price 2 */}
                                  {product.bestPrices.length > 1 ? (
                                    <TableCell sx={{ bgcolor: '#e3f2fd' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                        €{product.bestPrices[1].price.toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>
                                        -€{(product.publicPrice - product.bestPrices[1].price).toFixed(2)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                        Stock: {product.bestPrices[1].stock}
                                      </Typography>
                                    </TableCell>
                                  ) : (
                                    <TableCell sx={{ bgcolor: '#e3f2fd' }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        No supplier
                                      </Typography>
                                    </TableCell>
                                  )}
                                  
                                  {/* Best price 3 */}
                                  {product.bestPrices.length > 2 ? (
                                    <TableCell sx={{ bgcolor: '#f3e5f5' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
                                        €{product.bestPrices[2].price.toFixed(2)}
                                      </Typography>
                                      <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem' }}>
                                        -€{(product.publicPrice - product.bestPrices[2].price).toFixed(2)}
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                        Stock: {product.bestPrices[2].stock}
                                      </Typography>
                                    </TableCell>
                                  ) : (
                                    <TableCell sx={{ bgcolor: '#f3e5f5' }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        No supplier
                                      </Typography>
                                    </TableCell>
                                  )}
                                  
                                  {/* Other prices */}
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    {product.bestPrices.length > 3 ? (
                          <Button 
                                        variant="text"
                                        color="primary"
                            size="small" 
                                        startIcon={<KeyboardArrowRightIcon />}
                                        onClick={() => handleToggleAllPrices(product.id)}
                                        sx={{ fontSize: '0.8rem', padding: '4px 8px' }}
                          >
                                        Show {product.bestPrices.length - 3} more
                          </Button>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        None
                                      </Typography>
                                    )}
                        </TableCell>
                      </TableRow>
                              );
                            })
                        )}
                  </TableBody>
                </Table>
              </TableContainer>
                  
                  <Box sx={{ borderTop: '1px solid #eee' }}>
                    <TablePagination
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      component="div"
                      count={usingMockData ? filteredProducts.length : totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </Box>
                </>
              )}
              
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', bgcolor: '#f9f9f9' }}>
                <Typography variant="body2">
                  Selected Products: {selected.length} products ({getTotalQuantity()} items)
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                  Total Amount: €{totalAmount.toFixed(2)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<BookmarkIcon />}
                    disabled={selected.length === 0}
                    onClick={() => showToast('List saved for later', 'success')}
                  >
                    Save for Later
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<SaveIcon />}
                    disabled={selected.length === 0}
                    onClick={() => showToast('Draft saved successfully', 'success')}
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<CheckIcon />}
                    disabled={selected.length === 0}
                    onClick={handleCreateOda}
                  >
                    Create ODA
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 