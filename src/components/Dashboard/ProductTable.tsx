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
  
  const isAdmin = userRole === 'Admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-800">All Prices for {product.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} gap-3 text-xs uppercase font-semibold text-slate-500 mb-2 border-b pb-2`}>
          <div>Price</div>
          <div>Stock</div>
          <div className={isAdmin ? 'col-span-2' : 'col-span-2'}>Discount</div>
          {isAdmin && <div>Supplier</div>}
        </div>

        {product.bestPrices.map((price, idx) => {
          // Calcola sia sconto lordo che netto
          const grossDiscount = product.publicPrice - price.price;
          const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
          
          // Prezzo pubblico al netto dell'IVA
          const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
          
          // Sconto netto
          const netDiscount = netPublicPrice - price.price;
          const netDiscountPercent = (netDiscount / netPublicPrice) * 100;
          
          const grossDiscountTooltip = `${grossDiscountPercent.toFixed(1)}% off public price`;
          const netDiscountTooltip = `${netDiscountPercent.toFixed(1)}% off net price (VAT excl.)`;
          
          return (
            <div key={idx} className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} gap-3 py-2 ${idx !== product.bestPrices.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="font-medium text-sm text-slate-800">€{price.price.toFixed(2)}</div>
              <div className="text-sm text-slate-700">{price.stock} units</div>
              <div className={`${isAdmin ? 'col-span-2' : 'col-span-2'} text-sm`}>
                <div className="flex items-center">
                  <Tooltip text={grossDiscountTooltip} position="left">
                    <span className="text-red-600 cursor-help hover:font-medium">Gross: €{grossDiscount.toFixed(2)} ({grossDiscountPercent.toFixed(1)}%)</span>
                  </Tooltip>
                </div>
                <div className="flex items-center mt-1">
                  <Tooltip text={netDiscountTooltip} position="left">
                    <span className="text-orange-600 cursor-help hover:font-medium">Net: €{netDiscount.toFixed(2)} ({netDiscountPercent.toFixed(1)}%)</span>
                  </Tooltip>
                  <span className="text-xs text-slate-500 ml-1">(VAT excluded)</span>
                </div>
              </div>
              {isAdmin && <div className="text-sm text-slate-600">{price.supplier}</div>}
            </div>
          );
        })}
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
}) => {
  const [modalProduct, setModalProduct] = useState<ProductWithQuantity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDrawerCollapsed } = useContext(SidebarContext);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Determina se ci sono prodotti selezionati con problemi
  const selectionWithProblems = selected.some(id => {
    const product = products.find(p => p.id === id);
    return product && isStockExceeded(product.quantity, product.bestPrices);
  });

  // Get the selected products
  const selectedProducts = products.filter(p => selected.includes(p.id));

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

  const totalProductCount = products.length;

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
  const sortedProducts = [...products].sort((a, b) => {
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

  return (
    <div className="w-full flex flex-col gap-1 mb-8">
      {/* Header superiore con indicatore numero prodotti a sinistra e ExportButton a destra */}
      <div className="flex items-center justify-between mb-1 px-2">
        <div className="text-xs text-slate-600 bg-blue-50 px-3 py-1 rounded flex items-center">
          <span className="font-medium">Total Products:</span>
          <span className="ml-1 font-semibold text-blue-600">{totalProductCount}</span>
        </div>
        
        <ExportButton 
          selectedProducts={selectedProducts}
          isVisible={true}
        />
      </div>
      
      {/* Table container with horizontal scroll only, no extra spacing */}
      <div className="overflow-x-auto w-full">
        <div className={`${isDrawerCollapsed ? 'min-w-[1000px]' : 'min-w-[1200px]'}`}>
          {/* Header columns - sortable */}
          <div className="flex items-center px-3 py-3 text-xs uppercase text-slate-500 font-semibold tracking-wider bg-gray-50 rounded-t-lg rounded-xl my-1.5 border-b border-gray-200">
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
            <div className={`${isDrawerCollapsed ? 'w-[7.5%]' : 'w-[8%]'} text-center cursor-pointer select-none flex items-center justify-center`} onClick={() => {
              if (sortBy === 'qty') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('qty'); setSortDirection('asc'); }
            }}>
              Qty {renderSortIcon('qty')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[9.5%]' : 'w-[10%]'} text-center cursor-pointer select-none flex items-center justify-center`} onClick={() => {
              if (sortBy === 'targetPrice') setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              else { setSortBy('targetPrice'); setSortDirection('asc'); }
            }}>
              Target Price {renderSortIcon('targetPrice')}
            </div>
            <div className={`${isDrawerCollapsed ? 'w-[21%]' : 'w-[22%]'} text-right cursor-pointer select-none flex items-center justify-end`} onClick={() => {
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
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl shadow border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700">No products found</h3>
              <p className="text-gray-500 mt-1 max-w-md">Try adjusting your search or filter criteria to find products.</p>
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
                    flex items-center px-3 py-3 bg-white border border-gray-100
                    ${idx === products.length - 1 ? 'rounded-b-lg' : ''}
                    ${isProductSelected ? 'bg-blue-50' : ''}
                    ${isExceeded ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''}
                    hover:bg-blue-50 cursor-pointer
                    relative
                    rounded-xl my-1
                  `}
                  onClick={() => {
                    onSelect(product.id);
                  }}
                >
                  {/* Row number and Checkbox combined */}
                  <div className={`${isDrawerCollapsed ? 'w-[3.5%]' : 'w-[4%]'} flex items-center`}>
                    <div className="flex items-center">
                      <span className="w-5 text-xs text-gray-600 font-medium text-center">{idx + 1}</span>
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
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
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
                  <div className={`${isDrawerCollapsed ? 'w-[12%]' : 'w-[13%]'} flex flex-col text-xs text-slate-500`}>
                    <div className="flex">
                      <span className="font-semibold text-slate-700 w-14">EAN:</span> {product.ean}
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-slate-700 w-14">Minsan:</span> {product.minsan}
                    </div>
                  </div>

                  {/* Product Image - Add a small thumbnail */}
                  <div className="w-[3%] flex justify-center items-center mr-2">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-[40px] h-[40px] object-cover rounded-md shadow-sm border border-gray-200 hover:scale-150 transition-transform duration-200"
                        onError={(e) => {
                          // If image fails to load, use a fallback
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=N/A';
                        }}
                      />
                    ) : (
                      <div className="w-[40px] h-[40px] flex items-center justify-center bg-gray-100 rounded-md border border-gray-200 text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className={`${isDrawerCollapsed ? 'w-[19%]' : 'w-[20%]'} flex flex-col`}>
                    <span className="font-medium text-sm text-slate-800 truncate">{product.name}</span>
                    <span className="text-xs text-slate-400">{product.manufacturer}</span>
                  </div>

                  {/* Price */}
                  <div className={`${isDrawerCollapsed ? 'w-[11%]' : 'w-[12%]'} text-right`}>
                    <span className="font-semibold text-sm text-slate-700">€{product.publicPrice.toFixed(2)}</span>
                    <div className="text-xs text-slate-400">VAT {product.vat}%</div>
                  </div>

                  {/* Quantity */}
                  <div className={`${isDrawerCollapsed ? 'w-[7.5%]' : 'w-[8%]'} flex justify-center`} onClick={e => e.stopPropagation()}>
                    <div className="relative w-full max-w-[70px]">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={product.quantity || ''}
                        onChange={e => {
                          const value = parseInt(e.target.value);
                          onQuantityChange(product.id, isNaN(value) ? 0 : value);
                        }}
                        className={`w-full h-9 text-sm px-2 py-1 text-center rounded border ${
                          isExceeded ? 'border-amber-500 bg-amber-50 text-amber-700' : 
                          (isProductSelected && !product.quantity) ? 'border-red-300 bg-red-50 text-red-700' :
                          'border-gray-300 bg-white'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm`}
                      />
                      {isExceeded && (
                        <Tooltip text={errorMessage} position="top">
                          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">!</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Target price + avg */}
                  <div className={`${isDrawerCollapsed ? 'w-[9.5%]' : 'w-[10%]'} flex justify-center`} onClick={e => e.stopPropagation()}>
                    <div className="w-full max-w-[80px]">
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-xs text-slate-400">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Target"
                          value={product.targetPrice !== null ? product.targetPrice : ''}
                          onChange={e => onTargetPriceChange(product.id, e.target.value)}
                          className={`w-full h-9 text-sm pl-6 pr-2 py-1 text-right rounded border bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm
                            ${product.quantity > 0 && product.averagePrice !== null && product.targetPrice !== null
                              ? product.averagePrice <= product.targetPrice
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-300'}`}
                        />
                      </div>
                      {/* Avg price */}
                      {product.quantity > 0 && product.averagePrice !== null ? (
                        <div className="mt-1 text-xs">
                          <div className={`font-semibold flex items-center justify-between ${
                            isExceeded
                              ? 'text-amber-500'
                              : product.targetPrice !== null
                              ? product.averagePrice <= product.targetPrice
                                ? 'text-green-600'
                                : 'text-red-600'
                              : 'text-slate-600'
                          }`}>
                            <span>Avg:</span> 
                            <span>€{product.averagePrice.toFixed(2)}
                            {product.targetPrice !== null && product.averagePrice <= product.targetPrice && (
                              <span className="ml-1 text-green-500">✓</span>
                            )}</span>
                          </div>
                          <div className="text-slate-500 flex items-center justify-between">
                            <span>Tot:</span>
                            <span>€{(product.averagePrice * product.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-1 text-center">--</div>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className={`${isDrawerCollapsed ? 'w-[21%]' : 'w-[22%]'} flex flex-wrap justify-end gap-1`}>
                    {product.bestPrices.slice(0, 3).map((price, i) => {
                      const { grossDiscountPercent, netDiscountPercent } = calculateDiscounts(
                        product.publicPrice, 
                        price.price, 
                        product.vat
                      );
                      const priceLabels = ["Best price", "Second best price", "Third best price"];
                      // Tooltip unico con tutte le info
                      const tooltipContent = `
                        <div><strong>${priceLabels[i]}</strong></div>
                        <div>Gross discount: <span style='color:#ef4444'>${grossDiscountPercent.toFixed(0)}%</span></div>
                        <div>Net discount: <span style='color:#f59e42'>${netDiscountPercent.toFixed(0)}%</span></div>
                        <div>Stock: <span style='color:#2563eb'>${price.stock}</span></div>
                        ${userRole === 'Admin' && price.supplier ? `<div>Supplier: <span style='color:#047857'>${price.supplier}</span></div>` : ''}
                      `;
                      return (
                        <Tooltip text={tooltipContent} position="left" html>
                          <div key={i} className={`rounded px-2 py-1 text-xs transition-all duration-150 hover:shadow-md
                            ${i === 0 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 
                              i === 1 ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 
                              'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                          >
                            <div className="font-semibold text-sm cursor-help">€{price.price.toFixed(2)}</div>
                            <div className="text-xs flex gap-1 items-center">
                              <span className="text-red-500" title="Gross discount">{grossDiscountPercent.toFixed(0)}%</span>
                              <span className="text-slate-400">|</span>
                              <span className="text-orange-500" title="Net discount">{netDiscountPercent.toFixed(0)}%</span>
                            </div>
                            <div className="text-xs">Stock: {price.stock}</div>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                  
                  {/* Total Stock + Show more prices */}
                  <div 
                    className={`${isDrawerCollapsed ? 'w-[7.5%]' : 'w-[8%]'} flex flex-col items-end text-xs cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors`}
                    onClick={e => {
                      e.stopPropagation();
                      openPriceModal(product);
                    }}
                  >
                    <div className="text-slate-600 whitespace-nowrap">
                      Stock: <span className="font-medium text-blue-600">{totalProductStock}</span>
                    </div>
                    
                    {product.bestPrices.length > 3 && (
                      <div className="text-blue-500 text-xs flex items-center mt-1 whitespace-nowrap">
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