/// <reference path="../../types/xlsx.d.ts" />
import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import debounce from 'lodash/debounce';
import StatCard from '../common/StatCard';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { Product } from '../../data/mockProducts';
import { fetchProducts, getFallbackProducts } from '../../utils/api';
import { ProductRow, ActionBar } from '../common/reusable';
import { calculateAveragePrice } from '../common/utils';
import SortableColumnHeader from '../common/reusable/SortableColumnHeader';
import ProductFilter from '../common/reusable/ProductFilter';
import { SortDirection } from '../common/reusable/SortableColumnHeader';
import PriceDisplay from '../common/reusable/PriceDisplay';
import StockAvailability from '../common/reusable/StockAvailability';
import { isStockExceeded } from '../common/utils/priceCalculations';
import * as XLSX from 'xlsx';
import FileUploadModal from '../common/reusable/FileUploadModal';
import OrderConfirmationModal, { ProductItem, OrderData } from '../common/molecules/OrderConfirmationModal';
import AddProductModal, { ProductFormData } from '../common/molecules/AddProductModal';
import { v4 as uuid } from 'uuid';
import ProductTable from './ProductTable';

// Icons (we'll use SVG or Heroicons)
const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const MoneyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InventoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const ShippingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const AddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

// Interface for product with quantity
interface ProductWithQuantity extends Product {
  quantity: number;
  averagePrice: number | null;
  showAllPrices: boolean; // Track if we're showing all prices for this product
  targetPrice: number | null; // Target price impostabile dall'utente
}

const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const { userRole } = useUser();
  const isAdmin = userRole === 'Admin';
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
    supplier: ''
  });
  
  // Available filter options derived from product data
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ value: string; label: string }[]>([]);

  // State for file upload
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // State per il modal di conferma ordine
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedProductsForOrder, setSelectedProductsForOrder] = useState<ProductItem[]>([]);

  // State per la modale di aggiunta prodotto
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // New state for selection problems
  const [selectionWithProblems, setSelectionWithProblems] = useState(false);

  // State for triggering filter reset in ProductTable
  const [resetFilters, setResetFilters] = useState(0);

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
        supplier: useServerFiltering ? filterValues.supplier : undefined
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
      
      result.products.forEach(product => {
        product.bestPrices.forEach(price => {
          uniqueSuppliers.add(price.supplier);
        });
      });
      
      setSuppliers(Array.from(uniqueSuppliers).map(supplier => ({ value: supplier, label: supplier })));
      
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
        
        // Extract unique suppliers from products
        const uniqueSuppliers = new Set<string>();
        
        fallbackData.products.forEach(product => {
          product.bestPrices.forEach(price => {
            uniqueSuppliers.add(price.supplier);
          });
        });
        
        setSuppliers(Array.from(uniqueSuppliers).map(supplier => ({ value: supplier, label: supplier })));
        
        setUsingMockData(true);
        
        // If using mock data, we need to apply client-side filtering
        if (filterValues.searchTerm || filterValues.category || filterValues.manufacturer || filterValues.supplier) {
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
    
    // Remove the condition that prevents selection if quantity <= 0
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
    
    // Format products for modal with detailed price information
    const productsForModal: ProductItem[] = productsWithQuantity.map(id => {
      const product = filteredProducts.find(p => p.id === id)!;
      
      // Sort prices from lowest to highest
      const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
      
      // Create optimized price breakdowns from bestPrices
      const priceBreakdowns = [];
      let remainingQuantity = product.quantity;
      
      // Allocate quantities to suppliers starting from the cheapest
      for (const price of sortedPrices) {
        if (remainingQuantity <= 0) break;
        
        const allocatedQuantity = Math.min(remainingQuantity, price.stock);
        if (allocatedQuantity > 0) {
          priceBreakdowns.push({
            quantity: allocatedQuantity,
            unitPrice: price.price,
            supplier: price.supplier,
            stock: price.stock
          });
          
          remainingQuantity -= allocatedQuantity;
        }
      }
      
      return {
        id: product.id,
        name: product.name,
        code: product.ean || product.minsan,
        supplier: product.bestPrices[0]?.supplier || 'Various suppliers',
        quantity: product.quantity,
        unitPrice: product.averagePrice || product.bestPrices[0]?.price || product.publicPrice,
        averagePrice: product.averagePrice || undefined,
        priceBreakdowns: priceBreakdowns,
        publicPrice: product.publicPrice,
        vat: product.vat
      };
    });
    
    // Save selected products and open confirmation modal
    setSelectedProductsForOrder(productsForModal);
    setConfirmationModalOpen(true);
  };
  
  // Handle order submission from the modal
  const handleSubmitOrder = (orderData: OrderData) => {
    // In a real app, you would submit this to your backend
    const order = {
      ...orderData,
      items: selectedProductsForOrder,
      totalAmount,
      timestamp: new Date().toISOString()
    };
    
    console.log('Submitting order:', order);
    showToast('Order submitted successfully', 'success');
    
    // Clear the selection and reset quantities
    setSelected([]);
    handleCloseError();
    loadProducts(true);
  };
  
  // Handle saving order as draft
  const handleSaveOrderAsDraft = () => {
    showToast('Order saved as draft', 'success');
    
    // Clear the selection and reset quantities
    setSelected([]);
    handleCloseError();
    loadProducts(true);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleRefresh = () => {
    // Reset filter values to default state
    setFilterValues({
      searchTerm: '',
      category: '',
      manufacturer: '',
      supplier: ''
    });
    
    // Clear selected products
    setSelected([]);
    
    // Reset pagination
    setPage(0);
    
    // Reset products quantities
    setProducts(prev => prev.map(product => ({
      ...product,
      quantity: 0,
      averagePrice: null,
      targetPrice: null,
      showAllPrices: false
    })));
    
    // Trigger ProductTable filter reset
    setResetFilters(prev => prev + 1);
    
    // Load fresh data
    loadProducts(true);
    
    // Show confirmation toast
    showToast('Filtri e selezioni resettati', 'info');
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

  // Funzione per aprire la modale di aggiunta prodotto
  const handleOpenAddProductModal = () => {
    setIsAddProductModalOpen(true);
  };

  // Funzione per chiudere la modale di aggiunta prodotto
  const handleCloseAddProductModal = () => {
    setIsAddProductModalOpen(false);
  };

  // Funzione per aggiungere un nuovo prodotto
  const handleAddProduct = (productData: ProductFormData) => {
    // Crea un nuovo prodotto con i dati del form
    const newProduct: ProductWithQuantity = {
      id: uuid(),
      ean: productData.productCode,  // Utilizziamo productCode come EAN
      minsan: '',  // Campo opzionale
      name: productData.productName,
      publicPrice: productData.publicPrice,
      vat: productData.vat,  // Use the VAT from form data
      category: 'Manually added',
      manufacturer: productData.manufacturer,  // Use the manufacturer from form data
      description: 'Product added manually',
      bestPrices: [
        {
          supplier: 'Internal Stock',
          price: productData.stockPrice,
          stock: productData.stockQuantity  // Usiamo stock invece di quantity
        }
      ],
      inStock: productData.stockQuantity > 0,
      quantity: 0,  // Campo per ProductWithQuantity
      averagePrice: null,  // Campo per ProductWithQuantity
      showAllPrices: false,  // Campo per ProductWithQuantity
      targetPrice: null  // Campo per ProductWithQuantity
    };

    // Aggiungi il prodotto all'array esistente
    setProducts(prevProducts => [newProduct, ...prevProducts]);
    setFilteredProducts(prevFiltered => [newProduct, ...prevFiltered]);
    
    // Aumenta il conteggio totale
    setTotalCount(prev => prev + 1);
    
    // Notifica l'utente
    showToast(
      `Product "${productData.productName}" successfully added!`,
      'success'
    );
  };

  // Add handler for selection problems
  const handleSelectionWithProblemsChange = (hasProblems: boolean) => {
    setSelectionWithProblems(hasProblems);
  };

  // Calcolo contatori per la summary bar
  const selectedProducts = filteredProducts.filter(p => selected.includes(p.id));
  const belowTargetCount = selectedProducts.filter(p => p.targetPrice !== null && p.averagePrice !== null && p.averagePrice <= p.targetPrice).length;
  const aboveTargetCount = selectedProducts.filter(p => p.targetPrice !== null && p.averagePrice !== null && p.averagePrice > p.targetPrice).length;
  const stockIssuesCount = selectedProducts.filter(p => {
    const totalStock = p.bestPrices.reduce((sum, price) => sum + price.stock, 0);
    return p.quantity > totalStock;
  }).length;

  return (
    <div className="flex-grow p-3 pb-20">
      {/* Error notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-[10100] w-96 shadow-lg">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md flex items-start">
            <div className="flex-grow">
              <div className="text-yellow-800 font-medium">{error}</div>
            </div>
            <button 
              className="ml-2 text-yellow-400 hover:text-yellow-600"
              onClick={handleCloseError}
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )}
      
      {uploadError && (
        <div className="fixed top-4 right-4 z-[10100] w-96 shadow-lg">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
            <div className="flex-grow">
              <div className="text-red-800 font-medium">{uploadError}</div>
            </div>
            <button 
              className="ml-2 text-red-400 hover:text-red-600"
              onClick={() => setUploadError(null)}
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="fixed top-4 right-4 z-[10100] w-96 shadow-lg">
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
            <div className="flex-grow">
              <div className="text-green-800 font-medium">File processed successfully</div>
            </div>
            <button 
              className="ml-2 text-green-400 hover:text-green-600"
              onClick={() => setUploadSuccess(false)}
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileFromModal}
        acceptedFileTypes=".xlsx,.xls,.csv"
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium">Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Welcome back! Here's what's happening with your pharmacy business today.
          </p>
        </div>

        {/* Buttons moved here from below */}
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <button
              className="flex items-center gap-1 bg-blue-600 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 transition-colors"
              onClick={handleOpenAddProductModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Product
            </button>
                  )}
                  
                  {/* File Upload Button */}
          <button
            className={`flex items-center gap-1 border text-sm py-1 px-3 rounded 
              ${loading || fileUploading 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors'}
            `}
                    onClick={handleUploadButtonClick}
                    disabled={loading || fileUploading}
                  >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
                    {fileUploading ? 'Processing...' : 'Upload Products'}
          </button>
                  
          <button 
            className={`flex items-center gap-1 border text-sm py-1 px-3 rounded 
              ${loading || fileUploading 
                ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                : 'border-gray-500 text-gray-700 hover:bg-gray-50 transition-colors'}
            `}
                    onClick={handleRefresh}
                    disabled={loading || fileUploading}
                  >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
                    Refresh
          </button>
        </div>
      </div>

      {/* Search and filter controls converted to Tailwind */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search products by name, code, EAN..." 
              className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filterValues.searchTerm || ''}
              onChange={(e) => handleFilterChange({...filterValues, searchTerm: e.target.value})}
            />
          </div>

          <div>
            <select
              className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filterValues.category || ''}
              onChange={(e) => handleFilterChange({...filterValues, category: e.target.value})}
            >
              <option value="">Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={filterValues.manufacturer || ''}
              onChange={(e) => handleFilterChange({...filterValues, manufacturer: e.target.value})}
            >
              <option value="">Manufacturer</option>
              {manufacturers.map(manufacturer => (
                <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div>
              <select
                className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filterValues.supplier || ''}
                onChange={(e) => handleFilterChange({...filterValues, supplier: e.target.value})}
              >
                <option value="">Supplier</option>
                {suppliers.map(sup => (
                  <option key={sup.value} value={sup.value}>{sup.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ProductTable component (nuova tabella) */}
      <ProductTable
        products={filteredProducts}
        selected={selected}
        onSelect={(id) => handleSelectClick({} as any, id)}
        onQuantityChange={handleQuantityChange}
        onTargetPriceChange={handleTargetPriceChange}
        isSelected={isSelected}
        onToggleAllPrices={handleToggleAllPrices}
        onSelectionWithProblemsChange={handleSelectionWithProblemsChange}
        userRole={userRole}
        resetFilters={resetFilters}
      />
      
      {/* Add the ActionBar component outside the Card */}
      <ActionBar 
        selectedCount={selected.length}
        totalItems={getTotalQuantity()}
        totalAmount={totalAmount}
        onSaveAsDraft={() => showToast('Draft saved successfully', 'success')}
        onCreateOda={handleCreateOda}
        hasSelectionProblems={selectionWithProblems}
        belowTargetCount={belowTargetCount}
        aboveTargetCount={aboveTargetCount}
        stockIssuesCount={stockIssuesCount}
        selectedProducts={selectedProducts}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        open={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        onSaveAsDraft={handleSaveOrderAsDraft}
        onSubmitOrder={handleSubmitOrder}
        products={selectedProductsForOrder}
        totalAmount={totalAmount}
        userRole={userRole}
      />

      {/* Add Product Modal */}
      <AddProductModal
        open={isAddProductModalOpen}
        onClose={handleCloseAddProductModal}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
};

export default Dashboard; 