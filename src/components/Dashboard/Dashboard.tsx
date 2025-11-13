/// <reference path="../../types/xlsx.d.ts" />
import React, { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { Product } from '../../data/mockProducts';
import { fetchProducts } from '../../utils/api';
import { ActionBar } from '../common/reusable';
import { calculateAveragePrice } from '../common/utils';
import { SortDirection } from '../common/reusable/SortableColumnHeader';
import * as XLSX from 'xlsx';
import FileUploadModal from '../common/reusable/FileUploadModal';
import OrderConfirmationModal, { ProductItem, OrderData } from '../common/molecules/OrderConfirmationModal';
import AddProductModal, { ProductFormData } from '../common/molecules/AddProductModal';
import SupplierStockUploadModal from '../common/molecules/SupplierStockUploadModal';
import AdminStockManagementModal from '../common/molecules/AdminStockManagementModal';
import ActiveUploadsModal from '../common/molecules/ActiveUploadsModal';
import { v4 as uuid } from 'uuid';
import ProductTable from './ProductTable';
import ApiErrorMessage from '../common/atoms/ApiErrorMessage';
import { getAvailableCategoriesFromProducts, getDigitFromCategoryName } from '../../utils/minsanCategories';
import MultiSelectDropdown from '../common/atoms/MultiSelectDropdown';

// Icon component used in error notifications
const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
  const { userRole, logout } = useUser();
  const isAdmin = userRole === 'Admin';
  
  // State for product data and pagination
  const [products, setProducts] = useState<ProductWithQuantity[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithQuantity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Loading states for operations
  const [filteringLoading, setFilteringLoading] = useState(false);
  const [sortingLoading, setSortingLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [priceDetailsOpen, setPriceDetailsOpen] = useState<string | null>(null);
  
  // State for sorting
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [usingMockData, setUsingMockData] = useState(false);
  
  // State for ProductFilter component
  const [filterValues, setFilterValues] = useState<{
    searchTerm: string;
    category: string | string[];
    manufacturer: string | string[];
    supplier: string | string[];
    onlyAvailableStock: boolean;
  }>({
    searchTerm: '',
    category: [], // Empty array means "All Categories" by default
    manufacturer: [], // Empty array means "All Manufacturers" by default
    supplier: [], // Empty array means "All Warehouses" by default
    onlyAvailableStock: true // ON BY DEFAULT - show only products with stock
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

  // New state for stock upload modals
  const [isSupplierStockModalOpen, setIsSupplierStockModalOpen] = useState(false);
  const [isAdminStockModalOpen, setIsAdminStockModalOpen] = useState(false);

  // State for Active Uploads modal
  const [isActiveUploadsModalOpen, setIsActiveUploadsModalOpen] = useState(false);

  // New state for selection problems
  const [selectionWithProblems, setSelectionWithProblems] = useState(false);

  // State for triggering filter reset in ProductTable
  const [resetFilters, setResetFilters] = useState(0);
  
  // State for controlling "Selected Only" filter
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

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

  // Track if a load is already in progress to prevent duplicate API calls
  const loadingInProgressRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  
  // Load products with two-phase approach for better performance
  const loadProducts = useCallback(async (useServerFiltering = false, forceReload = false) => {
    // Prevent duplicate loads (skip if already loaded and not forcing reload)
    if (!forceReload && hasLoadedOnceRef.current) {
      return;
    }
    
    // Prevent concurrent loads
    if (loadingInProgressRef.current) {
      return;
    }
    
    loadingInProgressRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // SINGLE API CALL: Load products with integrated supplies
      const filters = {
        searchTerm: filterValues.searchTerm
      };
      
      const result = await fetchProducts(1, 999999, filters, isAdmin); // Get all products
      
      // Add quantity and averagePrice properties to products
      const productsWithQuantity = result.products.map((product: Product) => ({
        ...product,
        quantity: 0,
        averagePrice: null,
        showAllPrices: false,
        targetPrice: null
      }));
      
      // Set all data (products with integrated supplies)
      setProducts(productsWithQuantity);
      setTotalCount(result.totalCount);
      
      // Generate categories based on MINSAN codes instead of using API categories
      const minsanCategories = getAvailableCategoriesFromProducts(productsWithQuantity);
      setCategories(minsanCategories);
      
      setManufacturers(result.manufacturers || []);
      setSuppliers((result.suppliers || []).map(supplier => ({ value: supplier, label: supplier }))); // Now populated from integrated supplies
      
      // Apply initial filtering immediately to avoid flash/double render
      const initialFiltered = await applyInitialFiltering(productsWithQuantity);
      setFilteredProducts(initialFiltered);
      
      hasLoadedOnceRef.current = true; // Mark that we've loaded at least once
      setUsingMockData(false);
      setLoading(false);
      
    } catch (err: any) {
      console.error('Failed to fetch products from API:', err);
      
      // Handle different types of errors
      if (err.response?.status === 401) {
        // Session expired - logout user to redirect to login page
        await logout();
        return; // Early return to prevent setting error state
      } else {
        setError('API_ERROR'); // Set generic error for other issues
      }
      
      setProducts([]);
      setFilteredProducts([]);
      setTotalCount(0);
      setCategories([]);
      setManufacturers([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
      loadingInProgressRef.current = false;
      // Don't set hasLoadedOnceRef to false on error - we still attempted the load
    }
  }, [filterValues.searchTerm, isAdmin]); // Keep minimal dependencies to avoid loops
  
  // Initial load of products (only on mount)
  useEffect(() => {
    loadProducts(true);
  }, []); // Empty dependency array to run only on mount
  
  // Apply initial filtering (SYNCHRONOUS - returns filtered products)
  const applyInitialFiltering = async (productsList: ProductWithQuantity[]): Promise<ProductWithQuantity[]> => {
    return new Promise<ProductWithQuantity[]>((resolve) => {
      setTimeout(() => {
        try {
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
          
          // Apply category filter (empty array means "All Categories" - no filtering)
          if (filterValues.category) {
            if (Array.isArray(filterValues.category) && filterValues.category.length > 0) {
              const categories = filterValues.category as string[];
              filtered = filtered.filter(product => {
                const firstDigit = product.minsan.charAt(0);
                return categories.some((cat: string) => {
                  const expectedDigit = getDigitFromCategoryName(cat);
                  return firstDigit === expectedDigit;
                });
              });
            } else if (typeof filterValues.category === 'string' && filterValues.category !== '') {
              const expectedDigit = getDigitFromCategoryName(filterValues.category);
              filtered = filtered.filter(product => {
                const firstDigit = product.minsan.charAt(0);
                return firstDigit === expectedDigit;
              });
            }
            // If category is an empty array, don't filter (show all)
          }
          
          // Apply manufacturer filter (empty array means "All Manufacturers" - no filtering)
          if (filterValues.manufacturer) {
            if (Array.isArray(filterValues.manufacturer) && filterValues.manufacturer.length > 0) {
              filtered = filtered.filter(product => 
                filterValues.manufacturer.includes(product.manufacturer)
              );
            } else if (typeof filterValues.manufacturer === 'string' && filterValues.manufacturer !== '') {
              filtered = filtered.filter(product => product.manufacturer === filterValues.manufacturer);
            }
            // If manufacturer is an empty array, don't filter (show all)
          }
          
          // Apply supplier filter (empty array means "All Warehouses" - no filtering)
          if (filterValues.supplier) {
            if (Array.isArray(filterValues.supplier) && filterValues.supplier.length > 0) {
              filtered = filtered.filter(product => 
                (product.allPrices || product.bestPrices).some(price => {
                  const priceSupplierWithWarehouse = price.warehouse && price.entityName 
                    ? `${price.entityName} | ${price.warehouse}`
                    : price.supplier;
                  return filterValues.supplier.includes(priceSupplierWithWarehouse);
                })
              );
            } else if (typeof filterValues.supplier === 'string' && filterValues.supplier !== '') {
              filtered = filtered.filter(product => 
                (product.allPrices || product.bestPrices).some(price => {
                  const priceSupplierWithWarehouse = price.warehouse && price.entityName 
                    ? `${price.entityName} | ${price.warehouse}`
                    : price.supplier;
                  return priceSupplierWithWarehouse === filterValues.supplier;
                })
              );
            }
            // If supplier is an empty array, don't filter (show all)
          }
          
          // Apply stock filter
          if (filterValues.onlyAvailableStock) {
            filtered = filtered.filter(product => {
              const totalStock = product.bestPrices.reduce((sum, price) => sum + (price.stock || 0), 0);
              return totalStock > 0;
            });
          }
          
          // Apply sorting if needed
          if (sortBy && sortDirection) {
            filtered = applySorting(filtered, sortBy, sortDirection);
          }
          
          resolve(filtered);
        } catch (error) {
          console.error('❌ Initial filtering error:', error);
          resolve(productsList); // Return original on error
        }
      }, 10);
    });
  };
  
  // Apply client-side filters to products (ASYNC - NON-BLOCKING)
  const applyClientFilters = useCallback(async (productsList: ProductWithQuantity[]) => {
    setFilteringLoading(true);
    
    return new Promise<void>((resolve) => {
      // Use setTimeout to make operation non-blocking
      setTimeout(() => {
        try {
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
          
          // Apply category filter - now supporting multi-selection based on MINSAN first digit (empty array means "All Categories" - no filtering)
          if (filterValues.category) {
            if (Array.isArray(filterValues.category) && filterValues.category.length > 0) {
              const categories = filterValues.category as string[];
              filtered = filtered.filter(product => {
                const firstDigit = product.minsan.charAt(0);
                return categories.some((cat: string) => {
                  const expectedDigit = getDigitFromCategoryName(cat);
                  return firstDigit === expectedDigit;
                });
              });
            } else if (typeof filterValues.category === 'string' && filterValues.category !== '') {
              // Backward compatibility for single selection
              const expectedDigit = getDigitFromCategoryName(filterValues.category);
              filtered = filtered.filter(product => {
                const firstDigit = product.minsan.charAt(0);
                return firstDigit === expectedDigit;
              });
            }
            // If category is an empty array, don't filter (show all)
          }
          
          // Apply manufacturer filter - now supporting multi-selection (empty array means "All Manufacturers" - no filtering)
          if (filterValues.manufacturer) {
            if (Array.isArray(filterValues.manufacturer) && filterValues.manufacturer.length > 0) {
              filtered = filtered.filter(product => 
                filterValues.manufacturer.includes(product.manufacturer)
              );
            } else if (typeof filterValues.manufacturer === 'string' && filterValues.manufacturer !== '') {
              // Backward compatibility for single selection
              filtered = filtered.filter(product => product.manufacturer === filterValues.manufacturer);
            }
            // If manufacturer is an empty array, don't filter (show all)
          }
          
          // Apply supplier filter - now supporting warehouse format "Entity | Warehouse" (empty array means "All Warehouses" - no filtering)
          if (filterValues.supplier) {
            if (Array.isArray(filterValues.supplier) && filterValues.supplier.length > 0) {
              filtered = filtered.filter(product => 
                (product.allPrices || product.bestPrices).some(price => {
                  // Create the same format as in the dropdown: "Entity | Warehouse"
                  const priceSupplierWithWarehouse = price.warehouse && price.entityName 
                    ? `${price.entityName} | ${price.warehouse}`
                    : price.supplier;
                  return filterValues.supplier.includes(priceSupplierWithWarehouse);
                })
              );
            } else if (typeof filterValues.supplier === 'string' && filterValues.supplier !== '') {
              // Backward compatibility for single selection
              filtered = filtered.filter(product => 
                (product.allPrices || product.bestPrices).some(price => {
                  // Create the same format as in the dropdown: "Entity | Warehouse"
                  const priceSupplierWithWarehouse = price.warehouse && price.entityName 
                    ? `${price.entityName} | ${price.warehouse}`
                    : price.supplier;
                  return priceSupplierWithWarehouse === filterValues.supplier;
                })
              );
            }
            // If supplier is an empty array, don't filter (show all)
          }
          
          // Apply stock filter - show only products with stock > 0 (if enabled)
          if (filterValues.onlyAvailableStock) {
            filtered = filtered.filter(product => {
              const totalStock = product.bestPrices.reduce((sum, price) => sum + (price.stock || 0), 0);
              return totalStock > 0;
            });
            
          }
          
          // Apply sorting if needed
          if (sortBy && sortDirection) {
            filtered = applySorting(filtered, sortBy, sortDirection);
          }
          
          setFilteredProducts(filtered);
          setFilteringLoading(false);
          
          resolve();
        } catch (error) {
          console.error('❌ Filtering error:', error);
          setFilteringLoading(false);
          resolve();
        }
      }, 10); // Small delay to prevent UI blocking
    });
  }, [filterValues, sortBy, sortDirection]);
  
  // Function to handle sorting (SYNCHRONOUS - used internally)
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

  // Function to handle sorting (ASYNC - NON-BLOCKING)
  const applySortingAsync = useCallback(async (products: ProductWithQuantity[], column: string, direction: SortDirection) => {
    setSortingLoading(true);
    
    return new Promise<ProductWithQuantity[]>((resolve) => {
      setTimeout(() => {
        try {
          const sorted = applySorting(products, column, direction);
          setSortingLoading(false);
          resolve(sorted);
          } catch (error) {
            console.error('❌ Sorting error:', error);
            setSortingLoading(false);
            resolve(products); // Return original if error
          }
      }, 10); // Small delay to prevent UI blocking
    });
  }, []);
  
  // Handle quantity change for a product
  const handleQuantityChange = (id: string, quantity: number) => {
    // Update both products and filteredProducts in a single batch
    setProducts(prevProducts => prevProducts.map(product => {
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
    }));
    
    setFilteredProducts(prevFiltered => prevFiltered.map(product => {
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
    }));
    
    // If quantity is set to 0, unselect the product
    if (quantity === 0) {
      setSelected(prev => prev.filter(selectedId => selectedId !== id));
    }
  };
  
  // No longer needed - we do all filtering client-side now
  // const debouncedApplyFilters = ... (removed)
  
  // Debounced filter application to prevent excessive filtering
  const debouncedApplyFilters = useCallback(
    debounce(async (productsList: ProductWithQuantity[]) => {
      if (productsList.length > 0) {
        await applyClientFilters(productsList);
      }
    }, 300), // 300ms delay to prevent excessive filtering during typing
    [applyClientFilters]
  );

  // Track previous filter values to detect actual filter changes
  const prevFilterValuesRef = useRef(filterValues);
  
  // Re-filter when filters change (client-side only, no more API calls)
  useEffect(() => {
    // Skip if this is the initial load (filtering already done in loadProducts)
    if (!hasLoadedOnceRef.current) {
      return;
    }
    
    // Check if filterValues actually changed
    const filterChanged = JSON.stringify(filterValues) !== JSON.stringify(prevFilterValuesRef.current);
    
    // Only apply filters if filter values actually changed
    if (products.length > 0 && filterChanged) {
      prevFilterValuesRef.current = filterValues;
      // Use debounced version to prevent excessive filtering
      debouncedApplyFilters(products);
    }
    
    // Cleanup debounce on unmount
    return () => {
      debouncedApplyFilters.cancel();
    };
  }, [products.length, filterValues, debouncedApplyFilters]);
  
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
  
  // Select/deselect handlers
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
            stock: price.stock,
            suppliers: price.suppliers,
            originalPrices: price.originalPrices?.map(orig => ({
              supplier: orig.supplier,
              stock: orig.stock
            }))
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
    
    showToast('Order submitted successfully', 'success');
    
    // Clear the selection and reset quantities (client-side only)
    setSelected([]);
    handleCloseError();
    // Reset quantities for all products
    resetProductQuantities();
  };
  
  // Handle saving order as draft
  const handleSaveOrderAsDraft = () => {
    showToast('Order saved as draft', 'success');
    
    // Clear the selection and reset quantities (client-side only)
    setSelected([]);
    handleCloseError();
    // Reset quantities for all products
    resetProductQuantities();
  };

  // Helper function to reset all product quantities without API call
  const resetProductQuantities = () => {
    setProducts(prevProducts => 
      prevProducts.map(product => ({
        ...product,
        quantity: 0,
        targetPrice: null
      }))
    );
    setFilteredProducts(prevFiltered => 
      prevFiltered.map(product => ({
        ...product,
        quantity: 0,
        targetPrice: null
      }))
    );
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleRefresh = async () => {
    // Set loading state
    setLoading(true);
    setError(null);
    
    try {
      // Reset hasLoadedOnce flag so initial filtering happens again
      hasLoadedOnceRef.current = false;
      
      // Reset filter values to default state
      setFilterValues({
        searchTerm: '',
        category: [], // Empty array means "All Categories"
        manufacturer: [], // Empty array means "All Manufacturers"
        supplier: [], // Empty array means "All Warehouses"
        onlyAvailableStock: true // Keep ON BY DEFAULT even after refresh
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
      
      // Reset "Selected Only" filter
      setShowSelectedOnly(false);
      
      // Reload products from API with forceReload flag
      await loadProducts(true, true);
      
      // Show confirmation toast
      showToast('Prodotti aggiornati e filtri resettati', 'success');
    } catch (error) {
      showToast('Errore durante l\'aggiornamento dei prodotti', 'error');
    } finally {
      setLoading(false);
    }
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
            
            try {
              const workbook = XLSX.read(csvData, { type: 'string' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              parsedData = XLSX.utils.sheet_to_json(worksheet);
            } catch(xlsxError) {
              
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
              } catch(fallbackError) {
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
    
    // The matching logic starts here
    const matchedProductIds = new Set<string>();
    
    // Try to match each row from the uploaded file
    data.forEach((row, index) => {
      
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
      
      // First attempt exact code matches
      let matchedProduct: ProductWithQuantity | null = null;
      if (ean) {
        matchedProduct = products.find(p => p.ean.trim() === ean) || null;
        if (matchedProduct) {
        }
      }
      
      if (!matchedProduct && minsan) {
        matchedProduct = products.find(p => p.minsan.trim() === minsan) || null;
        if (matchedProduct) {
        }
      }
      
      // Try partial code matches if exact match failed
      if (!matchedProduct && ean) {
        matchedProduct = products.find(p => 
          p.ean.includes(ean) || ean.includes(p.ean)
        ) || null;
        if (matchedProduct) {
        }
      }
      
      if (!matchedProduct && minsan) {
        matchedProduct = products.find(p => 
          p.minsan.includes(minsan) || minsan.includes(p.minsan)
        ) || null;
        if (matchedProduct) {
        }
      }
      
      // Try exact name match
      if (!matchedProduct && name) {
        const normalizedName = name.toLowerCase();
        matchedProduct = products.find(p => p.name.toLowerCase() === normalizedName) || null;
        if (matchedProduct) {
        }
      }
      
      // Try partial name match
      if (!matchedProduct && name) {
        const normalizedName = name.toLowerCase();
        matchedProduct = products.find(p => 
          p.name.toLowerCase().includes(normalizedName) || normalizedName.includes(p.name.toLowerCase())
        ) || null;
        if (matchedProduct) {
        }
      }
      
      // Try word-by-word matching as last resort
      if (!matchedProduct && name && name.split(/\s+/).length > 1) {
        const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        
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
            matchedProduct = foundProduct;
          }
        }
      }
      
      // If product is matched, update it
      if (matchedProduct) {
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
      }
    });
    
    // Update the products state
    setProducts([...products]);
    
    // Filter the table to show only matched products and select them
    if (matchedProductIds.size > 0) {
      const matchedProducts = products.filter(p => matchedProductIds.has(p.id));
      setFilteredProducts(matchedProducts);
      
      // Select ALL matched products (regardless of quantity)
      const productsToSelect = matchedProducts.map(p => p.id);
      
      setSelected(productsToSelect);
      
      // Enable "Selected Only" filter and disable "In Stock Only" to show all matched products
      setShowSelectedOnly(true);
      setFilterValues(prev => ({
        ...prev,
        onlyAvailableStock: false
      }));
      
      // Reset pagination to show all matched products
      setPage(0);
      
      showToast(`Found and updated ${matchedProductIds.size} products from your file`, 'success');
    } else {
      throw new Error('No matching products found. Please check product codes or names in your file.');
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

  // Funzioni per il modal Supplier Stock Upload
  const handleOpenSupplierStockModal = () => {
    setIsSupplierStockModalOpen(true);
  };

  const handleCloseSupplierStockModal = () => {
    setIsSupplierStockModalOpen(false);
  };

  // Funzioni per il modal Admin Stock Management
  const handleOpenAdminStockModal = () => {
    setIsAdminStockModalOpen(true);
  };

  const handleCloseAdminStockModal = () => {
    setIsAdminStockModalOpen(false);
  };

  const handleOpenActiveUploadsModal = () => {
    setIsActiveUploadsModalOpen(true);
  };

  const handleCloseActiveUploadsModal = () => {
    setIsActiveUploadsModalOpen(false);
  };

  // Handle successful stock upload - refresh products
  const handleStockUploadSuccess = () => {
    showToast('Stock data uploaded successfully!', 'success');
    // Reset hasLoadedOnce flag so initial filtering happens again
    hasLoadedOnceRef.current = false;
    // Refresh products to show updated stock levels (force reload)
    loadProducts(true, true);
  };

  // Funzione per aggiungere un nuovo prodotto
  const handleAddProduct = (productData: ProductFormData) => {
    // Crea un nuovo prodotto con i dati del form
    const newProduct: ProductWithQuantity = {
      id: uuid(),
      ean: productData.ean,
      minsan: productData.sku,  // Use SKU as MINSAN
      name: productData.name,
      publicPrice: productData.price,
      vat: productData.vat,
      category: productData.category || 'Manually added',
      manufacturer: productData.producer,
      description: productData.description || 'Product added manually',
      bestPrices: [
        {
          supplier: 'Internal Stock',
          price: productData.price,
          stock: 100  // Default stock quantity
        }
      ],
      inStock: true,
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
      `Product "${productData.name}" successfully added!`,
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
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-md flex items-start">
            <div className="flex-grow">
              <div className="text-yellow-800 dark:text-yellow-200 font-medium">{error}</div>
            </div>
            <button 
              className="ml-2 text-yellow-400 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-100"
              onClick={handleCloseError}
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )}
      
      {uploadError && (
        <div className="fixed top-4 right-4 z-[10100] w-96 shadow-lg">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-md flex items-start">
            <div className="flex-grow">
              <div className="text-red-800 dark:text-red-200 font-medium">{uploadError}</div>
            </div>
            <button 
              className="ml-2 text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-100"
              onClick={() => setUploadError(null)}
            >
              <ClearIcon />
            </button>
          </div>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="fixed top-4 right-4 z-[10100] w-96 shadow-lg">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 p-4 rounded-md flex items-start">
            <div className="flex-grow">
              <div className="text-green-800 dark:text-green-200 font-medium">File processed successfully</div>
            </div>
            <button 
              className="ml-2 text-green-400 dark:text-green-300 hover:text-green-600 dark:hover:text-green-100"
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
          <h1 className="text-2xl font-medium text-gray-900 dark:text-dark-text-primary">Dashboard</h1>
          <p className="text-gray-500 dark:text-dark-text-muted text-sm">
            Welcome back! Here's what's happening with your pharmacy business today.
          </p>
        </div>
      </div>

      {/* Search and filter controls converted to Tailwind */}
      <div className="mb-6 bg-gray-50 dark:bg-dark-bg-secondary p-4 rounded-lg border dark:border-dark-border-primary">
        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500 dark:text-dark-text-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search products by name, code, EAN..." 
              className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
              value={filterValues.searchTerm || ''}
              onChange={(e) => handleFilterChange({...filterValues, searchTerm: e.target.value})}
            />
          </div>

          <div>
            <MultiSelectDropdown
              options={categories.map(cat => ({ value: cat, label: cat }))}
              selectedValues={Array.isArray(filterValues.category) ? filterValues.category : (filterValues.category ? [filterValues.category] : [])}
              onChange={(values) => handleFilterChange({...filterValues, category: values})}
              placeholder="Category"
              allOptionsLabel="All Categories"
            />
          </div>

          <div>
            <MultiSelectDropdown
              options={manufacturers.map(man => ({ value: man, label: man }))}
              selectedValues={Array.isArray(filterValues.manufacturer) ? filterValues.manufacturer : (filterValues.manufacturer ? [filterValues.manufacturer] : [])}
              onChange={(values) => handleFilterChange({...filterValues, manufacturer: values})}
              placeholder="Manufacturer"
              allOptionsLabel="All Manufacturers"
            />
          </div>

          {isAdmin && (
            <div>
              <MultiSelectDropdown
                options={suppliers}
                selectedValues={Array.isArray(filterValues.supplier) ? filterValues.supplier : (filterValues.supplier ? [filterValues.supplier] : [])}
                onChange={(values) => handleFilterChange({...filterValues, supplier: values})}
                placeholder="Warehouses"
                allOptionsLabel="All Warehouses"
              />
            </div>
          )}
        </div>
      </div>

      {/* ProductTable component or API Error Message */}
      {error === 'API_ERROR' ? (
        <ApiErrorMessage
          title="Servizio Prodotti Non Disponibile"
          description="Il sistema di gestione prodotti non è attualmente raggiungibile. Questo impedisce la visualizzazione e la gestione del catalogo prodotti."
          endpoint="/products/fetch"
          className="min-h-[400px]"
        />
      ) : (
        <ProductTable
          products={filteredProducts}
          selected={selected}
          onSelect={(id) => handleSelectClick({} as any, id)}
          onSelectAll={(ids, checked) => {
            if (checked) {
              // Add all visible ids - use Set for better performance
              const selectedSet = new Set(selected);
              ids.forEach(id => selectedSet.add(id));
              setSelected(Array.from(selectedSet));
            } else {
              // Remove all visible ids - use Set for better performance
              const idsToRemove = new Set(ids);
              setSelected(prev => prev.filter(id => !idsToRemove.has(id)));
            }
          }}
          onQuantityChange={handleQuantityChange}
          onTargetPriceChange={handleTargetPriceChange}
          isSelected={isSelected}
          onToggleAllPrices={handleToggleAllPrices}
          onSelectionWithProblemsChange={handleSelectionWithProblemsChange}
          userRole={userRole}
          resetFilters={resetFilters}
          loading={loading}
          filteringLoading={filteringLoading}
          sortingLoading={sortingLoading}
          fileUploading={fileUploading}
          onAddProduct={handleOpenAddProductModal}
          onUploadProduct={handleUploadButtonClick}
          onUploadStock={handleOpenSupplierStockModal}
          onManageStock={handleOpenAdminStockModal}
          onViewActiveUploads={handleOpenActiveUploadsModal}
          onRefresh={handleRefresh}
          filterValues={filterValues}
          onFilterChange={setFilterValues}
          showSelectedOnly={showSelectedOnly}
          onShowSelectedOnlyChange={setShowSelectedOnly}
        />
      )}
      
      {/* Add the ActionBar component outside the Card - only show when no errors */}
      {error !== 'API_ERROR' && (
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
      )}

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

      {/* Supplier Stock Upload Modal */}
      <SupplierStockUploadModal
        open={isSupplierStockModalOpen}
        onClose={handleCloseSupplierStockModal}
        onSuccess={handleStockUploadSuccess}
      />

      {/* Admin Stock Management Modal */}
      <AdminStockManagementModal
        open={isAdminStockModalOpen}
        onClose={handleCloseAdminStockModal}
        onSuccess={handleStockUploadSuccess}
      />

      {/* Active Uploads Modal */}
      <ActiveUploadsModal
        open={isActiveUploadsModalOpen}
        onClose={handleCloseActiveUploadsModal}
      />
    </div>
  );
};

export default Dashboard; 