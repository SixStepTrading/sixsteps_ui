import React, { useState, useEffect, useContext } from "react";
import { isStockExceeded } from '../common/utils/priceCalculations';
import { Product } from '../../data/mockProducts';
import { SidebarContext } from '../../contexts/SidebarContext';
import ExportButton from '../common/molecules/ExportButton';

export interface ProductWithQuantity extends Product {
  quantity: number;
  averagePrice: number | null;
  showAllPrices: boolean;
  targetPrice: number | null;
}

type ProductTableProps = {
  products: ProductWithQuantity[];
  selected: string[];
  onSelect: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onTargetPriceChange: (id: string, price: string) => void;
  isSelected: (id: string) => boolean;
  onToggleAllPrices: (id: string) => void;
  onSelectionWithProblemsChange?: (hasProblems: boolean) => void;
  userRole?: string;
  resetFilters?: number; // Trigger to reset filters
  // New props for buttons
  loading?: boolean;
  fileUploading?: boolean;
  onAddProduct?: () => void;
  onUploadProduct?: () => void;
  onRefresh?: () => void;
};

interface PriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithQuantity | null;
  userRole?: string;
}

// Modal per mostrare tutti i prezzi
const PriceModal: React.FC<PriceModalProps> = ({ isOpen, onClose, product, userRole = 'Buyer' }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">Price Details - {product.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-dark-text-muted">Public Price:</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">€{product.publicPrice.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-dark-text-muted">VAT:</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{product.vat}%</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-dark-text-primary mb-3">Available Suppliers</h4>
            <div className="space-y-2">
              {product.bestPrices.map((price, index) => (
                <div key={index} className="flex justify-between items-center p-3 border dark:border-dark-border-primary rounded-lg bg-white dark:bg-dark-bg-secondary">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-dark-text-primary">€{price.price.toFixed(2)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        index === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        index === 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                      }`}>
                        {index === 0 ? 'Best Price' : index === 1 ? '2nd Best' : '3rd Best'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-600 dark:text-dark-text-muted">Stock: {price.stock}</span>
                      {userRole === 'Admin' && (
                        <span className="text-gray-600 dark:text-dark-text-muted">Supplier: {price.supplier}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente tooltip riutilizzabile
const Tooltip: React.FC<{text: string, children: React.ReactNode, position?: 'top' | 'left', html?: boolean}> = ({
  text, 
  children, 
  position = 'top',
  html = false
}) => {
  return (
    <div className="group relative inline-block">
      {children}
      {position === 'top' ? (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md whitespace-normal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-90 group-hover:scale-100 pointer-events-none shadow-lg w-max max-w-[200px]">
          {html ? <div dangerouslySetInnerHTML={{ __html: text }} /> : text}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      ) : (
        <div className="absolute z-50 right-full top-0 mr-2 px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md whitespace-normal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-90 group-hover:scale-100 pointer-events-none shadow-lg w-max max-w-[200px]">
          {html ? <div dangerouslySetInnerHTML={{ __html: text }} /> : text}
          <div className="absolute top-2 -right-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selected,
  onSelect,
  onQuantityChange,
  onTargetPriceChange,
  isSelected,
  onToggleAllPrices,
  onSelectionWithProblemsChange,
  userRole = 'Buyer',
  resetFilters,
  loading = false,
  fileUploading = false,
  onAddProduct,
  onUploadProduct,
  onRefresh,
}) => {
  const [modalProduct, setModalProduct] = useState<ProductWithQuantity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Medicine placeholder images array
  const medicineImages = [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop&crop=center', // Pills
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop&crop=center', // Medicine bottles
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=100&h=100&fit=crop&crop=center', // Capsules
    'https://images.unsplash.com/photo-1576671081837-49000212a370?w=100&h=100&fit=crop&crop=center', // Tablets
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=100&h=100&fit=crop&crop=center', // Medicine packaging
    'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=100&h=100&fit=crop&crop=center', // Pills in blister pack
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&h=100&fit=crop&crop=center', // Medicine vials
    'https://images.unsplash.com/photo-1550572017-edd951b55104?w=100&h=100&fit=crop&crop=center', // Pharmacy bottles
  ];

  // Function to get medicine image for a product
  const getMedicineImage = (productId: string) => {
    const index = productId.charCodeAt(0) % medicineImages.length;
    return medicineImages[index];
  };

  // Filter products based on selection
  const filteredProducts = showSelectedOnly 
    ? products.filter(product => selected.includes(product.id))
    : products;

  // Determina se ci sono prodotti selezionati con problemi
  const selectionWithProblems = selected.some(id => {
    const product = products.find(p => p.id === id);
    return product && isStockExceeded(product.quantity, product.bestPrices);
  });

  // Get the selected products
  const selectedProducts = products.filter(p => selected.includes(p.id));

  // Check if there are any selected products to enable the filter
  const hasSelectedProducts = selected.length > 0;

  // Effetto per notificare quando cambia lo stato dei problemi nella selezione
  useEffect(() => {
    if (onSelectionWithProblemsChange) {
      onSelectionWithProblemsChange(selectionWithProblems);
    }
  }, [selectionWithProblems, onSelectionWithProblemsChange]);
  
  const openPriceModal = (product: ProductWithQuantity) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const totalProductCount = filteredProducts.length;

  const calculateDiscounts = (publicPrice: number, supplierPrice: number, vatPercentage: number) => {
    const grossDiscount = publicPrice - supplierPrice;
    const grossDiscountPercent = (grossDiscount / publicPrice) * 100;
    
    const netPublicPrice = publicPrice / (1 + vatPercentage / 100);
    
    const netDiscount = netPublicPrice - supplierPrice;
    const netDiscountPercent = (netDiscount / netPublicPrice) * 100;
    
    return {
      grossDiscount,
      grossDiscountPercent,
      netDiscount,
      netDiscountPercent
    };
  };

  // Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'codes': // EAN
        comparison = a.ean.localeCompare(b.ean);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'publicPrice':
        comparison = a.publicPrice - b.publicPrice;
        break;
      case 'qty':
        comparison = (a.quantity || 0) - (b.quantity || 0);
        break;
      case 'targetPrice':
        comparison = (a.targetPrice || 0) - (b.targetPrice || 0);
        break;
      case 'stock':
        const stockA = a.bestPrices.reduce((sum, p) => sum + p.stock, 0);
        const stockB = b.bestPrices.reduce((sum, p) => sum + p.stock, 0);
        comparison = stockA - stockB;
        break;
      case 'prices':
        // Best Price: il più basso tra i bestPrices
        const bestA = a.bestPrices.length > 0 ? Math.min(...a.bestPrices.map(p => p.price)) : Infinity;
        const bestB = b.bestPrices.length > 0 ? Math.min(...b.bestPrices.map(p => p.price)) : Infinity;
        comparison = bestA - bestB;
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Sorting icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-300">↕</span>;
    return sortDirection === 'asc'
      ? <span className="ml-1 text-blue-600">↑</span>
      : <span className="ml-1 text-blue-600">↓</span>;
  };

  // Reset showSelectedOnly filter when resetFilters prop is triggered
  useEffect(() => {
    if (resetFilters) {
      setShowSelectedOnly(false);
    }
  }, [resetFilters]);

  return (
    <div className="w-full flex flex-col gap-1 mb-8">
      {/* Filters section - Migliorato layout e allineamento con reset button */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border dark:border-dark-border-primary">
        <div className="flex items-center gap-4">
          {/* Show selected only filter */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showSelectedOnly"
              checked={showSelectedOnly}
              onChange={(e) => setShowSelectedOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-dark-bg-tertiary border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              disabled={!hasSelectedProducts}
            />
            <label
              htmlFor="showSelectedOnly"
              className={`ml-2 text-xs font-medium ${
                hasSelectedProducts ? 'text-slate-700 dark:text-dark-text-secondary cursor-pointer' : 'text-slate-400 dark:text-dark-text-disabled cursor-not-allowed'
              }`}
            >
              Show selected only ({selected.length})
            </label>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ExportButton 
            selectedProducts={selectedProducts}
            isVisible={true}
            userRole={userRole}
          />
          
          {/* Action buttons moved from Dashboard */}
          {userRole === 'Admin' && onAddProduct && (
            <button
              className="flex items-center gap-1 bg-blue-600 dark:bg-blue-700 text-white text-sm py-1 px-3 rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              onClick={onAddProduct}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Product
            </button>
          )}
          
          {onUploadProduct && (
            <button
              className={`flex items-center gap-1 border text-sm py-1 px-3 rounded 
                ${loading || fileUploading 
                  ? 'border-gray-300 dark:border-dark-border-primary text-gray-400 dark:text-dark-text-disabled cursor-not-allowed' 
                  : 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors'}
              `}
              onClick={onUploadProduct}
              disabled={loading || fileUploading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              {fileUploading ? 'Processing...' : 'Upload Products'}
            </button>
          )}
          
          {onRefresh && (
            <button 
              className={`flex items-center gap-1 border text-sm py-1 px-3 rounded 
                ${loading || fileUploading 
                  ? 'border-gray-300 dark:border-dark-border-primary text-gray-400 dark:text-dark-text-disabled cursor-not-allowed' 
                  : 'border-gray-500 dark:border-dark-border-secondary text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors'}
              `}
              onClick={onRefresh}
              disabled={loading || fileUploading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
          )}
        </div>
      </div>
      
      {/* Table container with horizontal scroll only, no extra spacing */}
      <div className="overflow-x-auto overflow-y-hidden w-full overscroll-x-contain">
        <div 
          className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'}`}
          style={{ 
            overscrollBehaviorX: 'contain'
          }}
        >
          {/* Header columns - sortable */}
          <div className="flex items-center px-3 py-2 text-xs uppercase text-slate-500 dark:text-dark-text-muted font-semibold tracking-wider bg-gray-50 dark:bg-dark-bg-tertiary rounded-t-lg rounded-xl my-1.5 border-b border-gray-200 dark:border-dark-border-primary">
            <div className={`${isDrawerCollapsed ? 'w-[3.5%]' : 'w-[4%]'} text-center`}>#</div>
            <div className={`${isDrawerCollapsed ? 'w-[12%]' : 'w-[13%]'} cursor-pointer select-none flex items-center`} onClick={() => {
              if (sortBy === 'codes') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('codes'); setSortDirection('asc'); }
            }}>
              Codes {renderSortIcon('codes')}
            </div>
            <div className="w-[3%]"></div>
            <div className={`${isDrawerCollapsed ? 'w-[19%]' : 'w-[20%]'} cursor-pointer select-none flex items-center`} onClick={() => {
              if (sortBy === 'name') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('name'); setSortDirection('asc'); }
            }}>
              Product Name {renderSortIcon('name')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[11%]' : 'w-[12%]'} text-right cursor-pointer select-none flex items-center justify-end`} onClick={() => {
              if (sortBy === 'publicPrice') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('publicPrice'); setSortDirection('asc'); }
            }}>
              Public Price {renderSortIcon('publicPrice')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[9%]' : 'w-[10%]'} text-right cursor-pointer select-none flex items-center justify-end`} onClick={() => {
              if (sortBy === 'qty') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('qty'); setSortDirection('asc'); }
            }}>
              Qty {renderSortIcon('qty')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[9%]' : 'w-[9%]'} text-center cursor-pointer select-none flex items-center justify-center`} onClick={() => {
              if (sortBy === 'targetPrice') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('targetPrice'); setSortDirection('asc'); }
            }}>
              Target Price {renderSortIcon('targetPrice')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[20%]' : 'w-[21%]'} text-right cursor-pointer select-none flex items-center justify-end`} onClick={() => {
              if (sortBy === 'prices') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('prices'); setSortDirection('asc'); }
            }}>
              Prices {renderSortIcon('prices')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[7.5%]' : 'w-[8%]'} text-right cursor-pointer select-none flex items-center justify-end`} onClick={() => {
              if (sortBy === 'stock') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('stock'); setSortDirection('asc'); }
            }}>
              Stock {renderSortIcon('stock')}
            </div>
          </div>

          {/* Rows - simplified with no extra bottom margins */}
          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-bg-secondary rounded-xl shadow border border-slate-100 dark:border-dark-border-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 dark:text-dark-text-disabled mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-dark-text-primary">No products found</h3>
              <p className="text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">Try adjusting your search or filter criteria to find products.</p>
            </div>
          ) : (
            sortedProducts.map((product, idx) => {
              const isProductSelected = isSelected(product.id);
              const isExceeded = isStockExceeded(product.quantity, product.bestPrices);
              // Calcolo dello stock totale del prodotto
              const totalProductStock = product.bestPrices.reduce((sum, price) => sum + price.stock, 0);
              
              // Messaggio di errore per il tooltip
              const errorMessage = isExceeded ? 
                `Insufficient stock: You requested ${product.quantity} units, but only ${totalProductStock} are available. Please reduce the quantity or select another product.` : '';
                
              return (
                <div
                  key={product.id}
                  className={`
                    flex items-center px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border-primary
                    ${idx === products.length - 1 ? 'rounded-b-lg' : ''}
                    ${isProductSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    ${isExceeded ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500 dark:border-l-amber-400' : ''}
                    hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer
                    relative
                    rounded-xl my-1
                    min-h-[60px]
                  `}
                  onClick={() => {
                      onSelect(product.id);
                  }}
                >
                  {/* Row number and Checkbox combined */}
                  <div className={`${isDrawerCollapsed ? 'w-[3.5%]' : 'w-[4%]'} flex items-start pt-1`}>
                    <div className="flex items-center">
                      <span className="w-5 text-xs text-gray-600 dark:text-dark-text-muted font-medium text-center">{idx + 1}</span>
                      {isExceeded ? (
                        <Tooltip text={errorMessage} position="top">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                            !
                          </div>
                        </Tooltip>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isProductSelected}
                          className="w-4 h-4 rounded border-gray-300 dark:border-dark-border-primary text-blue-600 dark:text-blue-400 bg-white dark:bg-dark-bg-tertiary"
                          onChange={e => e.stopPropagation()}
                          onClick={e => {
                            e.stopPropagation();
                              onSelect(product.id);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Codes */}
                  <div className={`${isDrawerCollapsed ? 'w-[12%]' : 'w-[13%]'} flex flex-col text-xs text-slate-500 dark:text-dark-text-muted pt-1`}>
                    <div className="flex mb-1">
                      <span className="font-semibold text-slate-700 dark:text-dark-text-secondary w-14">EAN:</span> {product.ean}
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-slate-700 dark:text-dark-text-secondary w-14">Minsan:</span> {product.minsan}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="w-[3%] flex justify-center items-start pt-1 mr-2">
                    <img 
                      src={product.image || getMedicineImage(product.id)} 
                      alt={product.name}
                      className="w-[40px] h-[40px] object-cover rounded-md shadow-sm border border-gray-200 dark:border-dark-border-primary hover:scale-110 transition-transform duration-200"
                      onError={(e) => {
                        // If image fails to load, use a different medicine placeholder
                        const fallbackIndex = (product.id.charCodeAt(1) || 0) % medicineImages.length;
                        (e.target as HTMLImageElement).src = medicineImages[fallbackIndex];
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div className={`${isDrawerCollapsed ? 'w-[19%]' : 'w-[20%]'} flex flex-col pt-1`}>
                    <span className="font-medium text-sm text-slate-800 dark:text-dark-text-primary truncate">{product.name}</span>
                    <span className="text-xs text-slate-400 dark:text-dark-text-muted mt-1">{product.manufacturer}</span>
                  </div>

                  {/* Price */}
                  <div className={`${isDrawerCollapsed ? 'w-[11%]' : 'w-[12%]'} text-right pt-1 pr-4`}>
                    <span className="font-semibold text-sm text-slate-700 dark:text-dark-text-primary">€{product.publicPrice.toFixed(2)}</span>
                    <div className="text-xs text-slate-400 dark:text-dark-text-muted mt-1">VAT {product.vat}%</div>
                  </div>

                  {/* Quantity with compact layout aligned right */}
                  <div className={`${isDrawerCollapsed ? 'w-[9%]' : 'w-[10%]'} flex flex-col justify-start items-end pl-2 pr-2`} onClick={e => e.stopPropagation()}>
                    <div className="relative w-full max-w-[60px] ml-auto">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={product.quantity || ''}
                        onChange={e => {
                          const value = parseInt(e.target.value);
                          onQuantityChange(product.id, isNaN(value) ? 0 : value);
                        }}
                        className={`w-full h-7 text-xs px-2 py-1 text-center rounded border ${
                          isExceeded ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 
                          (isProductSelected && !product.quantity) ? 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                          'border-gray-300 dark:border-dark-border-primary bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm`}
                      />
                      {isExceeded && (
                        <Tooltip text={errorMessage} position="top">
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">!</span>
                        </Tooltip>
                      )}
                    </div>
                    
                    {/* Average Price and Total with compact spacing aligned right */}
                    {product.quantity > 0 && product.averagePrice !== null ? (
                      <div className="mt-1 text-xs w-full text-right">
                        <Tooltip 
                          text={`
                            <div><strong>Price Analysis</strong></div>
                            <div>Avg: Average purchase price from historical data</div>
                            <div>Tot: Total cost based on average price</div>
                            <div>Used for budget planning and price comparison</div>
                          `} 
                          position="top" 
                          html
                        >
                          <div className={`font-semibold cursor-help text-xs ${
                            isExceeded
                              ? 'text-amber-500 dark:text-amber-400'
                              : product.targetPrice !== null
                              ? product.averagePrice <= product.targetPrice
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                              : 'text-slate-600 dark:text-dark-text-secondary'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span>Avg:</span>
                              <span>€{product.averagePrice.toFixed(2)}
                              {product.targetPrice !== null && product.averagePrice <= product.targetPrice && (
                                <span className="ml-1 text-green-500 dark:text-green-400">✓</span>
                              )}</span>
                            </div>
                          </div>
                          <div className="text-slate-500 dark:text-dark-text-muted cursor-help text-xs">
                            <div className="flex items-center justify-between">
                              <span>Tot:</span>
                              <span>€{(product.averagePrice * product.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 dark:text-dark-text-muted mt-1 text-right">--</div>
                    )}
                  </div>

                  {/* Target price with compact layout */}
                  <div className={`${isDrawerCollapsed ? 'w-[9%]' : 'w-[9%]'} flex flex-col justify-start items-center pl-2`} onClick={e => e.stopPropagation()}>
                    <div className="w-full max-w-[70px]">
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-xs text-slate-400 dark:text-dark-text-muted">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Target"
                          value={product.targetPrice !== null ? product.targetPrice : ''}
                          onChange={e => onTargetPriceChange(product.id, e.target.value)}
                          className={`w-full h-7 text-xs pl-5 pr-2 py-1 text-right rounded border bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm
                            ${product.quantity > 0 && product.averagePrice !== null && product.targetPrice !== null
                              ? product.averagePrice <= product.targetPrice
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                              : 'border-gray-300 dark:border-dark-border-primary'}`}
                        />
                      </div>
                      
                      {/* Discount calculations with compact spacing */}
                      {product.targetPrice !== null && product.targetPrice > 0 ? (
                        <div className="mt-1 text-xs">
                          <Tooltip 
                            text={`
                              <div><strong>Discount Analysis</strong></div>
                              <div>Gross: Discount vs public price (VAT included)</div>
                              <div>Net: Discount vs public price (VAT excluded)</div>
                              <div>Based on your target price input</div>
                            `} 
                            position="top" 
                            html
                          >
                            {(() => {
                              const { grossDiscountPercent, netDiscountPercent } = calculateDiscounts(
                                product.publicPrice, 
                                product.targetPrice, 
                                product.vat
                              );
                              return (
                                <>
                                  <div className={`font-semibold flex items-center justify-between cursor-help text-xs ${
                                    grossDiscountPercent > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    <span>Gross:</span> 
                                    <span>{grossDiscountPercent > 0 ? '+' : ''}{grossDiscountPercent.toFixed(1)}%</span>
                                  </div>
                                  <div className={`flex items-center justify-between cursor-help text-xs ${
                                    netDiscountPercent > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    <span>Net:</span>
                                    <span>{netDiscountPercent > 0 ? '+' : ''}{netDiscountPercent.toFixed(1)}%</span>
                                  </div>
                                </>
                              );
                            })()}
                          </Tooltip>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 dark:text-dark-text-muted mt-1 text-center">--</div>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className={`${isDrawerCollapsed ? 'w-[20%]' : 'w-[21%]'} flex flex-wrap justify-end gap-1 pt-1 pl-3`}>
                    {product.bestPrices.slice(0, 3).map((price, i) => {
                      const { grossDiscountPercent, netDiscountPercent } = calculateDiscounts(
                        product.publicPrice, 
                        price.price, 
                        product.vat
                      );
                      const priceLabels = ["Best price", "Second best price", "Third best price"];
                      const tooltipContent = `
                        <div><strong>${priceLabels[i]}</strong></div>
                        <div>Gross discount: <span style='color:#ef4444'>${grossDiscountPercent.toFixed(0)}%</span></div>
                        <div>Net discount: <span style='color:#f59e42'>${netDiscountPercent.toFixed(0)}%</span></div>
                        <div>Stock: <span style='color:#2563eb'>${price.stock}</span></div>
                        ${userRole === 'Admin' && price.supplier ? `<div>Supplier: <span style='color:#047857'>${price.supplier}</span></div>` : ''}
                      `;
                      return (
                        <Tooltip text={tooltipContent} position="left" html>
                          <div key={i} className={`rounded px-2 py-1 text-xs transition-all duration-150 hover:shadow-md dark:hover:shadow-dark-md
                            ${i === 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50' : 
                              i === 1 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50' : 
                              'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'}`}
                          >
                            <div className="font-semibold text-sm cursor-help">€{price.price.toFixed(2)}</div>
                            <div className="text-xs flex gap-1 items-center">
                              <span className="text-red-500 dark:text-red-400" title="Gross discount">{grossDiscountPercent.toFixed(0)}%</span>
                              <span className="text-slate-400 dark:text-slate-500">|</span>
                              <span className="text-orange-500 dark:text-orange-400" title="Net discount">{netDiscountPercent.toFixed(0)}%</span>
                            </div>
                            <div className="text-xs">Stock: {price.stock}</div>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                  
                  {/* Total Stock + Show more prices */}
                  <div 
                    className={`${isDrawerCollapsed ? 'w-[7.5%]' : 'w-[8%]'} flex flex-col items-end text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-hover p-1 rounded transition-colors pt-1`}
                    onClick={e => {
                      e.stopPropagation();
                      openPriceModal(product);
                    }}
                  >
                    <div className="text-slate-600 dark:text-dark-text-secondary whitespace-nowrap">
                      Stock: <span className="font-medium text-blue-600 dark:text-blue-400">{totalProductStock}</span>
                    </div>
                    
                    {product.bestPrices.length > 3 && (
                      <div className="text-blue-500 dark:text-blue-400 text-xs flex items-center mt-1 whitespace-nowrap">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                        </svg>
                        Show more
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Modal per i dettagli prezzi */}
      <PriceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={modalProduct}
        userRole={userRole}
      />
    </div>
  );
};

// Re-export the Tooltip component since it's used in PurchaseOrders
export { Tooltip };

export default ProductTable;