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
            console.log("Raw CSV data:", csvData);
            
            try {
              const workbook = XLSX.read(csvData, { type: 'string' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              parsedData = XLSX.utils.sheet_to_json(worksheet);
              console.log("Parsed CSV using XLSX:", parsedData);
            } catch(xlsxError) {
              console.error("XLSX parsing failed:", xlsxError);
              
              // Fallback to manual CSV parsing
              try {
                const lines = csvData.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                parsedData = [];
                
                for(let i = 1; i < lines.length; i++) {
                  if(lines[i].trim() === '') continue;
                  
                  const values = lines[i].split(',');
                  const row: Record<string, string> = {};
                  
                  for(let j = 0; j < headers.length; j++) {
                    row[headers[j]] = values[j]?.trim() || '';
                  }
                  
                  parsedData.push(row);
                }
                console.log("Fallback CSV parsing result:", parsedData);
              } catch(fallbackError) {
                console.error("Fallback CSV parsing failed:", fallbackError);
                reject(new Error('Failed to parse CSV file'));
                return;
              }
            }
          }
          else {
            reject(new Error('Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.'));
            return;
          }
          
          if (parsedData.length === 0) {
            reject(new Error('No data found in file after parsing'));
            return;
          }
          
          resolve(parsedData);
        } catch (error) {
          console.error("File parsing error:", error);
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
    
    // Debug all our static products for comparison
    console.log("All available products:", products.map(p => ({
      id: p.id,
      name: p.name,
      ean: p.ean,
      minsan: p.minsan
    })));
    
    // Log the uploaded data for debugging
    console.log('Uploaded file data:', data);
    
    // The matching logic starts here
    const matchedProductIds = new Set<string>();
    
    // Try to match each row from the uploaded file
    data.forEach((row, index) => {
      console.log(`Checking row ${index}:`, row);
      
      // Helper function to extract text safely from any field in the row
      const extractText = (row: any, possibleFieldNames: string[]): string | null => {
        for (let field of possibleFieldNames) {
          // Try with direct field access
          if (row[field] !== undefined && row[field] !== null) {
            return String(row[field]).trim();
          }
          
          // Try case-insensitive matching
          const lowercaseField = field.toLowerCase();
          for (let key of Object.keys(row)) {
            if (key.toLowerCase() === lowercaseField && row[key] !== undefined && row[key] !== null) {
              return String(row[key]).trim();
            }
          }
        }
        return null;
      };
      
      // Extract product identifiers
      const ean = extractText(row, ['EAN', 'ean', 'Ean', 'Codice', 'codice', 'Code', 'code']);
      const minsan = extractText(row, ['MINSAN', 'minsan', 'Minsan', 'AIC', 'aic']);
      const name = extractText(row, ['Product Name', 'name', 'Nome', 'nome', 'Prodotto', 'prodotto', 'Descrizione', 'descrizione', 'Name', 'Product', 'product']);
      const quantity = extractText(row, ['Quantity', 'quantity', 'Quantità', 'quantità', 'Qta', 'qta', 'Q.tà', 'q.tà']);
      const targetPrice = extractText(row, ['Target Price', 'target price', 'Target', 'target', 'Price', 'price', 'Prezzo', 'prezzo']);
      
      console.log(`Extracted from row: EAN=${ean}, MINSAN=${minsan}, Name=${name}, Qty=${quantity}, Price=${targetPrice}`);
      
      // First attempt exact code matches
      let matchedProduct: ProductWithQuantity | null = null;
      if (ean) {
        matchedProduct = products.find(p => p.ean.trim() === ean) || null;
        if (matchedProduct) {
          console.log(`Found exact EAN match for ${ean}: ${matchedProduct.name}`);
        }
      }
      
      if (!matchedProduct && minsan) {
        matchedProduct = products.find(p => p.minsan.trim() === minsan) || null;
        if (matchedProduct) {
          console.log(`Found exact MINSAN match for ${minsan}: ${matchedProduct.name}`);
        }
      }
      
      // Try partial code matches if exact match failed
      if (!matchedProduct && ean) {
        matchedProduct = products.find(p => 
          p.ean.includes(ean) || ean.includes(p.ean)
        ) || null;
        if (matchedProduct) {
          console.log(`Found partial EAN match: ${ean} with ${matchedProduct.ean} for ${matchedProduct.name}`);
        }
      }
      
      if (!matchedProduct && minsan) {
        matchedProduct = products.find(p => 
          p.minsan.includes(minsan) || minsan.includes(p.minsan)
        ) || null;
        if (matchedProduct) {
          console.log(`Found partial MINSAN match: ${minsan} with ${matchedProduct.minsan} for ${matchedProduct.name}`);
        }
      }
      
      // Try exact name match
      if (!matchedProduct && name) {
        const normalizedName = name.toLowerCase();
        matchedProduct = products.find(p => p.name.toLowerCase() === normalizedName) || null;
        if (matchedProduct) {
          console.log(`Found exact name match for "${name}": ${matchedProduct.name}`);
        }
      }
      
      // Try partial name match
      if (!matchedProduct && name) {
        const normalizedName = name.toLowerCase();
        matchedProduct = products.find(p => 
          p.name.toLowerCase().includes(normalizedName) || normalizedName.includes(p.name.toLowerCase())
        ) || null;
        if (matchedProduct) {
          console.log(`Found partial name match: "${name}" with "${matchedProduct.name}"`);
        }
      }
      
      // Try word-by-word matching as last resort
      if (!matchedProduct && name && name.split(/\s+/).length > 1) {
        const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        console.log(`Trying word-by-word match with words:`, words);
        
        // Find product with highest word match percentage
        let bestMatchPercentage = 0;
        let bestMatchId: string | null = null;
        
        for (const product of products) {
          const productWords = product.name.toLowerCase().split(/\s+/);
          let matchCount = 0;
          
          for (const word of words) {
            if (productWords.some(prodWord => prodWord.includes(word) || word.includes(prodWord))) {
              matchCount++;
            }
          }
          
          const matchPercentage = words.length > 0 ? matchCount / words.length : 0;
          
          if (matchPercentage > bestMatchPercentage && matchPercentage >= 0.5) {
            bestMatchPercentage = matchPercentage;
            bestMatchId = product.id;
          }
        }
        
        if (bestMatchId) {
          const foundProduct = products.find(p => p.id === bestMatchId);
          if (foundProduct) {
            console.log(`Found word match with ${bestMatchPercentage*100}% similarity: "${name}" with "${foundProduct.name}"`);
            matchedProduct = foundProduct;
          }
        }
      }
      
      // If product is matched, update it
      if (matchedProduct) {
        console.log(`Successfully matched product ${matchedProduct.name}`);
        matchedProductIds.add(matchedProduct.id);
        
        // Update quantity if provided
        let parsedQuantity = 1; // Default to 1
        if (quantity) {
          const cleanQuantity = quantity.replace(',', '.');
          const qtyNumber = parseInt(cleanQuantity, 10);
          if (!isNaN(qtyNumber) && qtyNumber >= 0) {
            parsedQuantity = qtyNumber;
          }
        }
        
        // Update target price if provided
        let parsedPrice = null;
        if (targetPrice) {
          const cleanPrice = targetPrice.replace(',', '.');
          const priceNumber = parseFloat(cleanPrice);
          if (!isNaN(priceNumber) && priceNumber >= 0) {
            parsedPrice = priceNumber;
          }
        }
        
        // Update product in the products array
        const productIndex = products.findIndex(p => p.id === matchedProduct!.id);
        if (productIndex !== -1) {
          const updatedProduct = { ...products[productIndex] };
          updatedProduct.quantity = parsedQuantity;
          
          if (parsedQuantity > 0) {
            updatedProduct.averagePrice = calculateAveragePrice(
              updatedProduct.bestPrices,
              parsedQuantity,
              updatedProduct.publicPrice
            );
          }
          
          if (parsedPrice !== null) {
            updatedProduct.targetPrice = parsedPrice;
          }
          
          products[productIndex] = updatedProduct;
        }
      } else {
        console.log(`No match found for row ${index}`);
      }
    });
    
    // Update the products state
    setProducts([...products]);
    
    // Filter the table to show only matched products and select them
    if (matchedProductIds.size > 0) {
      const matchedProducts = products.filter(p => matchedProductIds.has(p.id));
      setFilteredProducts(matchedProducts);
      
      // Select all matched products with quantity > 0
      const productsToSelect = matchedProducts
        .filter(p => p.quantity > 0)
        .map(p => p.id);
      
      setSelected(productsToSelect);
      
      // Reset pagination to show all matched products
      setPage(0);
      
      showToast(`Found and updated ${matchedProductIds.size} products from your file`, 'success');
    } else {
      console.error("No matching products found in uploaded file");
      throw new Error('No matching products found. Please check product codes or names. Our system has 4 products: ALVITA GINOCCHIERA, BIODERMA ATODERM, ZERODOL, and ENTEROGERMINA.');
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