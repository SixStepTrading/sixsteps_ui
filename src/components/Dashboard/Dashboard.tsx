/// <reference path="../../types/xlsx.d.ts" />
import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
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
  Paper
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
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import debounce from 'lodash/debounce';
import StatCard from '../common/StatCard';
import { useToast } from '../../contexts/ToastContext';
import { Product } from '../../data/mockProducts';
import { fetchProducts, getFallbackProducts } from '../../utils/api';
import { ProductRow } from '../common/reusable';
import { calculateAveragePrice } from '../common/utils';
import SortableColumnHeader from '../common/reusable/SortableColumnHeader';
import ProductFilter from '../common/reusable/ProductFilter';
import { SortDirection } from '../common/reusable/SortableColumnHeader';
import PriceDisplay from '../common/reusable/PriceDisplay';
import StockAvailability from '../common/reusable/StockAvailability';
import { isStockExceeded } from '../common/utils/priceCalculations';
import * as XLSX from 'xlsx';
import FileUploadModal from '../common/reusable/FileUploadModal';

// Interface for product with quantity
interface ProductWithQuantity extends Product {
  quantity: number;
  averagePrice: number | null;
  showAllPrices: boolean; // Track if we're showing all prices for this product
  targetPrice: number | null; // Target price impostabile dall'utente
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
  
  // State for sorting
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
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
  
  // State for ProductFilter component
  const [filterValues, setFilterValues] = useState({
    searchTerm: '',
    category: '',
    manufacturer: '',
    supplier: '',
    priceRange: [0, 100] as [number, number],
    inStockOnly: false,
    vatRate: '',
  });
  
  // Available filter options derived from product data
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ value: string; label: string }[]>([]);
  const [vatRates, setVatRates] = useState<{ value: string | number; label: string }[]>([]);

  // State for file upload
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Funzione per gestire l'apertura/chiusura della visualizzazione di tutti i prezzi
  const handleToggleAllPrices = (productId: string) => {
    // Find product and toggle showAllPrices property
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, showAllPrices: !product.showAllPrices } 
          : product
      )
    );
    
    // Also update in filtered products
    setFilteredProducts(prevFiltered => 
      prevFiltered.map(product => 
        product.id === productId 
          ? { ...product, showAllPrices: !product.showAllPrices } 
          : product
      )
    );
    
    // Keep track of which product details are open
    setPriceDetailsOpen(priceDetailsOpen === productId ? null : productId);
  };

  // Load products
  const loadProducts = useCallback(async (useServerFiltering = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filter object for API request
      const filters = {
        searchTerm: useServerFiltering ? filterValues.searchTerm : undefined,
        category: useServerFiltering ? filterValues.category : undefined,
        manufacturer: useServerFiltering ? filterValues.manufacturer : undefined,
        supplier: useServerFiltering ? filterValues.supplier : undefined,
        inStockOnly: useServerFiltering ? filterValues.inStockOnly : undefined,
        minPrice: useServerFiltering && filterValues.priceRange[0] > 0 ? filterValues.priceRange[0] : undefined,
        maxPrice: useServerFiltering && filterValues.priceRange[1] < 100 ? filterValues.priceRange[1] : undefined,
        vatRate: useServerFiltering ? filterValues.vatRate : undefined,
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
        showAllPrices: false,
        targetPrice: null
      }));
      
      setProducts(productsWithQuantity);
      setTotalCount(result.totalCount);
      setCategories(result.categories || []);
      setManufacturers(result.manufacturers || []);
      
      // Extract unique suppliers and VAT rates from products
      const uniqueSuppliers = new Set<string>();
      const uniqueVatRates = new Set<number>();
      
      result.products.forEach(product => {
        uniqueVatRates.add(product.vat);
        product.bestPrices.forEach(price => {
          uniqueSuppliers.add(price.supplier);
        });
      });
      
      setSuppliers(Array.from(uniqueSuppliers).map(supplier => ({ value: supplier, label: supplier })));
      setVatRates(Array.from(uniqueVatRates).map(vat => ({ value: vat, label: `${vat}%` })));
      
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
          showAllPrices: false,
          targetPrice: null
        }));
        
        setProducts(productsWithQuantity);
        setFilteredProducts(productsWithQuantity);
        setTotalCount(fallbackData.totalCount);
        setCategories(fallbackData.categories || []);
        setManufacturers(fallbackData.manufacturers || []);
        
        // Extract unique suppliers and VAT rates from products
        const uniqueSuppliers = new Set<string>();
        const uniqueVatRates = new Set<number>();
        
        fallbackData.products.forEach(product => {
          uniqueVatRates.add(product.vat);
          product.bestPrices.forEach(price => {
            uniqueSuppliers.add(price.supplier);
          });
        });
        
        setSuppliers(Array.from(uniqueSuppliers).map(supplier => ({ value: supplier, label: supplier })));
        setVatRates(Array.from(uniqueVatRates).map(vat => ({ value: vat, label: `${vat}%` })));
        
        setUsingMockData(true);
        
        // If using mock data, we need to apply client-side filtering
        if (filterValues.searchTerm || filterValues.category || filterValues.manufacturer || 
            filterValues.inStockOnly || filterValues.priceRange[0] > 0 || filterValues.priceRange[1] < 100) {
          applyClientFilters(productsWithQuantity);
        }
      } catch (fallbackErr) {
        console.error('Failed to load fallback data:', fallbackErr);
        setError('Failed to load products. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterValues, page, rowsPerPage]);
  
  // Initial load of products
  useEffect(() => {
    loadProducts(true);
  }, [loadProducts]);
  
  // Apply client-side filters to products
  const applyClientFilters = useCallback((productsList: ProductWithQuantity[]) => {
    // Filter products
    let filtered = [...productsList];

    // Apply search filter
    if (filterValues.searchTerm) {
      const term = filterValues.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.ean.includes(term) || 
        product.minsan.includes(term) ||
        product.manufacturer.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter - now supporting multi-selection
    if (filterValues.category) {
      if (Array.isArray(filterValues.category) && filterValues.category.length > 0) {
        filtered = filtered.filter(product => 
          filterValues.category.includes(product.category)
      );
      } else if (typeof filterValues.category === 'string' && filterValues.category !== '') {
        // Backward compatibility for single selection
        filtered = filtered.filter(product => product.category === filterValues.category);
      }
    }
    
    // Apply manufacturer filter - now supporting multi-selection
    if (filterValues.manufacturer) {
      if (Array.isArray(filterValues.manufacturer) && filterValues.manufacturer.length > 0) {
        filtered = filtered.filter(product => 
          filterValues.manufacturer.includes(product.manufacturer)
        );
      } else if (typeof filterValues.manufacturer === 'string' && filterValues.manufacturer !== '') {
        // Backward compatibility for single selection
        filtered = filtered.filter(product => product.manufacturer === filterValues.manufacturer);
      }
    }
    
    // Apply supplier filter - now supporting multi-selection
    if (filterValues.supplier) {
      if (Array.isArray(filterValues.supplier) && filterValues.supplier.length > 0) {
        filtered = filtered.filter(product => 
          product.bestPrices.some(price => 
            filterValues.supplier.includes(price.supplier)
          )
        );
      } else if (typeof filterValues.supplier === 'string' && filterValues.supplier !== '') {
        // Backward compatibility for single selection
        filtered = filtered.filter(product => 
          product.bestPrices.some(price => price.supplier === filterValues.supplier)
        );
      }
    }
    
    // Apply in-stock filter
    if (filterValues.inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }
    
    // Apply VAT rate filter - now supporting multi-selection
    if (filterValues.vatRate) {
      if (Array.isArray(filterValues.vatRate) && filterValues.vatRate.length > 0) {
        const vatRateArray = filterValues.vatRate;
        filtered = filtered.filter(product => {
          // Convert product vat to string for comparison
          const productVatStr = product.vat.toString();
          
          // Check if any of the selected VAT rates match
          return vatRateArray.some(rate => {
            const rateStr = rate.toString();
            return productVatStr === rateStr;
          });
        });
      } else if ((typeof filterValues.vatRate === 'string' || typeof filterValues.vatRate === 'number') && filterValues.vatRate.toString() !== '') {
        // Backward compatibility for single selection
        filtered = filtered.filter(product => product.vat.toString() === filterValues.vatRate.toString());
      }
    }
    
    // Apply price range filter
    filtered = filtered.filter(product => {
      const lowestPrice = product.bestPrices.length > 0 ? product.bestPrices[0].price : 0;
      return lowestPrice >= filterValues.priceRange[0] && lowestPrice <= filterValues.priceRange[1];
    });
    
    // Apply sorting if needed
    if (sortBy && sortDirection) {
      filtered = applySorting(filtered, sortBy, sortDirection);
    }
    
    setFilteredProducts(filtered);
  }, [filterValues, sortBy, sortDirection]);
  
  // Function to handle sorting
  const applySorting = (products: ProductWithQuantity[], sortBy: string, direction: SortDirection) => {
    if (!direction) return products;
    
    return [...products].sort((a, b) => {
      let compareA: string | number;
      let compareB: string | number;
      
      // Determine what to sort by
      switch (sortBy) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'manufacturer':
          compareA = a.manufacturer.toLowerCase();
          compareB = b.manufacturer.toLowerCase();
          break;
        case 'category':
          compareA = a.category.toLowerCase();
          compareB = b.category.toLowerCase();
          break;
        case 'publicPrice':
          compareA = a.publicPrice;
          compareB = b.publicPrice;
          break;
        case 'bestPrice':
          compareA = a.bestPrices.length > 0 ? a.bestPrices[0].price : Infinity;
          compareB = b.bestPrices.length > 0 ? b.bestPrices[0].price : Infinity;
          break;
        case 'stock':
          compareA = a.bestPrices.reduce((sum, price) => sum + price.stock, 0);
          compareB = b.bestPrices.reduce((sum, price) => sum + price.stock, 0);
          break;
        case 'code':
          compareA = a.ean;
          compareB = b.ean;
          break;
        default:
          return 0;
      }
      
      // Direction of sort
      const factor = direction === 'asc' ? 1 : -1;
      
      // Compare values
      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return compareA.localeCompare(compareB) * factor;
      } else if (typeof compareA === 'number' && typeof compareB === 'number') {
        return (compareA - compareB) * factor;
    }
      return 0;
    });
  };
  
  // Handle sorting column click
  const handleSort = (column: string, direction: SortDirection) => {
    setSortBy(column);
    setSortDirection(direction);
    
    // Re-apply sorting to filtered products
    if (direction) {
      const sorted = applySorting(filteredProducts, column, direction);
      setFilteredProducts(sorted);
    }
  };
  
  // Handle quantity change for a product
  const handleQuantityChange = (id: string, quantity: number) => {
    // Update quantity
    const updatedProducts = products.map(product => {
      if (product.id === id) {
        // Calculate average price if quantity > 0
        let averagePrice = null;
        if (quantity > 0) {
          averagePrice = calculateAveragePrice(product.bestPrices, quantity, product.publicPrice);
        }
        
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
        // Calculate average price if quantity > 0
        let averagePrice = null;
        if (quantity > 0) {
          averagePrice = calculateAveragePrice(product.bestPrices, quantity, product.publicPrice);
        }
        
        return { 
          ...product, 
          quantity,
          averagePrice
        };
      }
      return product;
    });
    
    setFilteredProducts(updatedFilteredProducts);
    
    // If quantity is set to 0, unselect the product
    if (quantity === 0) {
      setSelected(prev => prev.filter(selectedId => selectedId !== id));
    }
  };
  
  // React to filter changes with debounce
  const debouncedApplyFilters = useCallback(
    debounce(() => loadProducts(true), 500),
    [loadProducts]
  );
  
  // Re-filter when filters change
  useEffect(() => {
    if (products.length > 0) {
      // If using real API, let the server filter data
      if (!usingMockData) {
        debouncedApplyFilters();
      } else {
        applyClientFilters(products);
      }
    }
  }, [products, filterValues, usingMockData, applyClientFilters, debouncedApplyFilters]);
  
  // Calculate total amount whenever selection changes or product quantities change
  useEffect(() => {
      const selectedProducts = filteredProducts.filter(p => selected.includes(p.id));
      const total = selectedProducts.reduce((sum, product) => {
      if (product.quantity > 0 && product.averagePrice !== null) {
        return sum + (product.quantity * product.averagePrice);
      }
      return sum;
      }, 0);
    
      setTotalAmount(total);
  }, [selected, filteredProducts]);
  
  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    
      // For real API data, reload products with new page
    if (!usingMockData) {
      loadProducts(true);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    
      // For real API data, reload products with new page size
    if (!usingMockData) {
      loadProducts(true);
    }
  };
  
  // Select/deselect handlers
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
      // Only select products with quantity > 0
    if (event.target.checked) {
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
    
    // Only allow selection if quantity > 0
    if (!product || product.quantity <= 0) {
      return;
    }
    
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      // Add to selection
      newSelected = [...selected, id];
    } else {
      // Remove from selection
      newSelected = selected.filter(selectedId => selectedId !== id);
    }

    setSelected(newSelected);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;
  
  // Handle filter changes from ProductFilter component
  const handleFilterChange = (newValues: any) => {
    setFilterValues(newValues);
  };
  
  // Apply filters when the Apply button is clicked
  const handleApplyFilters = () => {
    loadProducts(true);
  };
  
  // Create ODA
  const handleCreateOda = () => {
    // Only include products with quantity > 0
    const productsWithQuantity = selected.filter(id => {
      const product = filteredProducts.find(p => p.id === id);
      return product && product.quantity > 0;
    });
    
    if (productsWithQuantity.length === 0) {
      showToast('No products selected or quantities specified', 'error');
      return;
    }
    
    const totalQuantity = filteredProducts
      .filter(p => selected.includes(p.id))
      .reduce((sum, p) => sum + p.quantity, 0);
    
    showToast(`ODA created with ${productsWithQuantity.length} products (${totalQuantity} items) totaling €${totalAmount.toFixed(2)}`, 'success');
    
    // Clear selection and reset quantities
    setSelected([]);
    handleCloseError();
    loadProducts(true);
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

  // Handle target price change
  const handleTargetPriceChange = (id: string, newValue: string) => {
    const targetPrice = newValue === '' ? null : parseFloat(newValue);
    
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, targetPrice } : product
    ));
    
    setFilteredProducts(prev => prev.map(product => 
      product.id === id ? { ...product, targetPrice } : product
    ));
  };

  // Handle file upload button click - Modified to open modal
  const handleUploadButtonClick = () => {
    setIsUploadModalOpen(true);
  };

  // Handle file from modal
  const handleFileFromModal = (file: File) => {
    handleProcessFile(file);
  };
  
  // Handle file upload processing
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    
    try {
      setFileUploading(true);
      setUploadError(null);
      
      const data = await readExcelOrCSV(file);
      applyFileDataToProducts(data);
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadError(error instanceof Error ? error.message : 'Unknown error processing file');
    } finally {
      setFileUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Read Excel or CSV file
  const readExcelOrCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No data found in file'));
            return;
          }
          
          let parsedData: any[] = [];
          
          // Handle Excel file
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
          } 
          // Handle CSV file
          else if (file.name.endsWith('.csv')) {
            const csvData = data.toString();
            const workbook = XLSX.read(csvData, { type: 'string' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
          }
          else {
            reject(new Error('Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.'));
            return;
          }
          
          resolve(parsedData);
        } catch (error) {
          reject(new Error('Error parsing file. Please check the file format.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  };
  
  // Apply file data to products
  const applyFileDataToProducts = (data: any[]) => {
    if (!data || data.length === 0) {
      throw new Error('No data found in the file or the file is empty');
    }
    
    // Get column names from the first row of data
    const firstRow = data[0];
    const columnNames = Object.keys(firstRow).map(key => key.toLowerCase());
    
    // Check if required columns exist (using fuzzy matching for flexibility)
    const hasProductIdentifier = columnNames.some(col => 
      col.includes('code') || col.includes('ean') || col.includes('minsan') || 
      col.includes('product') || col.includes('name') || col.includes('prodotto')
    );
    
    const hasQuantity = columnNames.some(col => 
      col.includes('quantity') || col.includes('qty') || col.includes('amount') || 
      col.includes('quantità') || col.includes('qta')
    );
    
    const hasTargetPrice = columnNames.some(col => 
      col.includes('target') || col.includes('price') || col.includes('prezzo') || 
      col.includes('target price') || col.includes('prezzo target')
    );
    
    if (!hasProductIdentifier) {
      throw new Error('The file must contain a column for Product Code, EAN, MINSAN, or Product Name');
    }
    
    if (!hasQuantity && !hasTargetPrice) {
      throw new Error('The file must contain at least one column for Quantity or Target Price');
    }
    
    // Find best match columns
    const getColumnByPattern = (patterns: string[]): string | null => {
      return columnNames.find(col => 
        patterns.some(pattern => col.includes(pattern.toLowerCase()))
      ) || null;
    };
    
    const codeColumn = getColumnByPattern(['code', 'ean', 'minsan', 'prodotto']);
    const nameColumn = getColumnByPattern(['name', 'product', 'prodotto', 'nome']);
    const quantityColumn = getColumnByPattern(['quantity', 'qty', 'amount', 'quantità', 'qta']);
    const targetPriceColumn = getColumnByPattern(['target', 'price', 'prezzo']);
    
    // Filter and update products
    const matchedProductIds = new Set<string>();
    const updatedProducts = products.map(product => {
      // Try to find a match in the uploaded data
      const matchedRow = data.find(row => {
        if (codeColumn && row[codeColumn]) {
          const value = String(row[codeColumn]).toLowerCase();
          if (product.ean.toLowerCase().includes(value) || 
              product.minsan.toLowerCase().includes(value)) {
            return true;
          }
        }
        
        if (nameColumn && row[nameColumn]) {
          const value = String(row[nameColumn]).toLowerCase();
          if (product.name.toLowerCase().includes(value)) {
            return true;
          }
        }
        
        return false;
      });
      
      if (matchedRow) {
        matchedProductIds.add(product.id);
        let updatedProduct = { ...product };
        
        // Update quantity if available
        if (quantityColumn && matchedRow[quantityColumn] !== undefined) {
          const quantity = parseInt(matchedRow[quantityColumn], 10);
          if (!isNaN(quantity) && quantity >= 0) {
            updatedProduct.quantity = quantity;
            
            // Calculate average price if quantity > 0
            if (quantity > 0) {
              updatedProduct.averagePrice = calculateAveragePrice(
                updatedProduct.bestPrices, 
                quantity, 
                updatedProduct.publicPrice
              );
            }
          }
        }
        
        // Update target price if available
        if (targetPriceColumn && matchedRow[targetPriceColumn] !== undefined) {
          const targetPrice = parseFloat(matchedRow[targetPriceColumn]);
          if (!isNaN(targetPrice) && targetPrice >= 0) {
            updatedProduct.targetPrice = targetPrice;
          }
        }
        
        return updatedProduct;
      }
      
      return product;
    });
    
    // Apply the updates
    setProducts(updatedProducts);
    
    // Filter the table to show only matched products
    if (matchedProductIds.size > 0) {
      const filtered = updatedProducts.filter(p => matchedProductIds.has(p.id));
      setFilteredProducts(filtered);
      showToast(`Found and updated ${matchedProductIds.size} products from your file`, 'success');
    } else {
      throw new Error('No matching products found in the file');
    }
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
      
      {uploadError && (
        <Snackbar open={!!uploadError} autoHideDuration={6000} onClose={() => setUploadError(null)}>
          <Alert onClose={() => setUploadError(null)} severity="error" sx={{ width: '100%' }}>
            {uploadError}
          </Alert>
        </Snackbar>
      )}
      
      {uploadSuccess && (
        <Snackbar open={uploadSuccess} autoHideDuration={3000} onClose={() => setUploadSuccess(false)}>
          <Alert onClose={() => setUploadSuccess(false)} severity="success" sx={{ width: '100%' }}>
            File processed successfully
          </Alert>
        </Snackbar>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileFromModal}
        acceptedFileTypes=".xlsx,.xls,.csv"
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your pharmacy business today.
          </Typography>
        </Box>

      </Box>

      <Grid container spacing={3}>
        {/* Product Catalog */}
        <Grid size={{ xs: 12 }}>
          {/* Filters Card - Separated from the table */}
          <Card sx={{ mb: 2 }}>
            <CardHeader 
              title="Product Filters" 
              titleTypographyProps={{ variant: 'h6' }}
          />
            <Divider />
            <Box sx={{ p: 2 }}>
              <ProductFilter
                values={filterValues}
                onChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                categories={categories.map(cat => ({ value: cat, label: cat }))}
                manufacturers={manufacturers.map(mfr => ({ value: mfr, label: mfr }))}
                suppliers={suppliers}
                vatRates={vatRates}
                maxPrice={100}
                minPrice={0}
          />
            </Box>
          </Card>

          {/* Table Card - Separate from filters */}
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
                  
                  {/* File Upload Button - No longer needs the hidden input */}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={handleUploadButtonClick}
                    disabled={loading || fileUploading}
                    color="primary"
                  >
                    {fileUploading ? 'Processing...' : 'Upload Products'}
                  </Button>
                  
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading || fileUploading}
                  >
                    Refresh
                  </Button>
              </Box>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
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
                      position: 'relative',
                      width: '100%',
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
                      '&::-webkit-scrollbar': {
                        width: '10px',
                        height: '10px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '10px'
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" sx={{ 
                            position: 'sticky', 
                            left: 0, 
                            top: 0,
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
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
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>#</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 90, 
                            top: 0,
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            minWidth: 160,
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>Codici Prodotto</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 250, 
                            top: 0,
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            minWidth: 200, 
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>Product Name</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 450, 
                            top: 0,
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            minWidth: 100, 
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>Public Price</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky', 
                            left: 550, 
                            top: 0,
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            minWidth: 120,
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
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
                            left: 670, 
                            top: 0,
                            zIndex: 20,
                            bgcolor: '#f5f5f5',
                            borderRight: '1px solid rgba(224, 224, 224, 0.7)',
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            minWidth: 150,
                            boxShadow: '3px 0 5px -1px rgba(0,0,0,0.15), 0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                Target Price
                                <Tooltip title="Set your desired target price. This helps identify if current supplier prices match your expectations.">
                                <IconButton size="small" sx={{ padding: '2px' }}>
                                  <InfoIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                (Avg. Price)
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            position: 'sticky',
                            top: 0,
                            zIndex: 15,
                            bgcolor: '#e8f5e9', 
                            minWidth: 120,
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>Best Price</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky',
                            top: 0,
                            zIndex: 15,
                            bgcolor: '#e3f2fd', 
                            minWidth: 120,
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>2nd Best</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky',
                            top: 0,
                            zIndex: 15,
                            bgcolor: '#f3e5f5', 
                            minWidth: 120,
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>3rd Best</TableCell>
                          <TableCell sx={{ 
                            position: 'sticky',
                            top: 0,
                            zIndex: 15,
                            bgcolor: '#f5f5f5',
                            minWidth: 120,
                            borderBottom: '2px solid rgba(224, 224, 224, 1)',
                            boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                          }}>Other prices</TableCell>
                          
                          {/* Dynamic additional price columns in header */}
                          {filteredProducts.some(p => p.showAllPrices && p.bestPrices.length > 3) && 
                            Array.from({ length: Math.max(...filteredProducts
                              .filter(p => p.showAllPrices)
                              .map(p => p.bestPrices.length > 3 ? p.bestPrices.length - 3 : 0)) }, (_, i) => (
                              <TableCell key={i} sx={{ 
                                position: 'sticky',
                                top: 0,
                                zIndex: 15,
                                bgcolor: '#f8f8f8', 
                                minWidth: 120,
                                borderBottom: '2px solid rgba(224, 224, 224, 1)',
                                boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)'
                              }}>
                                Price {i + 4}
                              </TableCell>
                            ))
                          }
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
                              return (
                                <ProductRow
                                  key={product.id}
                                  product={product}
                                  index={index}
                                  isSelected={isItemSelected}
                                  page={page}
                                  rowsPerPage={rowsPerPage}
                                  onSelectClick={handleSelectClick}
                                  onQuantityChange={handleQuantityChange}
                                  onTargetPriceChange={handleTargetPriceChange}
                                  onToggleAllPrices={handleToggleAllPrices}
                                  usingMockData={usingMockData}
                                />
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