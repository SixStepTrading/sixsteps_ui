import React from 'react';
import PriceDisplay from './PriceDisplay';
import StockAvailability from './StockAvailability';
import { isStockExceeded } from '../utils/priceCalculations';

interface ProductRowProps {
  product: {
    id: string;
    ean: string;
    minsan: string;
    name: string;
    manufacturer: string;
    inStock: boolean;
    publicPrice: number;
    vat: number;
    quantity: number;
    averagePrice: number | null;
    showAllPrices: boolean;
    targetPrice: number | null;
    bestPrices: Array<{ price: number; stock: number; supplier?: string }>;
  };
  index: number;
  isSelected: boolean;
  page: number;
  rowsPerPage: number;
  onSelectClick: (event: React.MouseEvent<unknown>, id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onTargetPriceChange: (id: string, value: string) => void;
  onToggleAllPrices: (id: string) => void;
  usingMockData: boolean;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  index,
  isSelected,
  page,
  rowsPerPage,
  onSelectClick,
  onQuantityChange,
  onTargetPriceChange,
  onToggleAllPrices,
  usingMockData
}) => {
  const stockExceeded = isStockExceeded(product.quantity, product.bestPrices);

  const getBgColor = (isSelected: boolean, stockExceeded: boolean) => {
    if (stockExceeded) {
      return isSelected ? 'bg-amber-100' : 'bg-amber-50';
    }
    return isSelected ? 'bg-blue-50' : 'bg-white';
  };

  const bgColorClass = getBgColor(isSelected, stockExceeded);

  return (
    <tr 
      className={`hover:bg-gray-50 ${bgColorClass} ${stockExceeded ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={(event) => {
        // Click handling only for selection checkbox
        if ((event.target as HTMLElement).closest('button') === null &&
            !(event.target as HTMLElement).closest('input[type="number"]') &&
            !stockExceeded) {
          onSelectClick(event, product.id);
        }
      }}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={-1}
    >
      {/* Checkbox cell */}
      <td 
        className={`sticky left-0 ${bgColorClass} z-50 border-r border-gray-200 shadow-sm p-1 w-[30px]`}
      >
        {stockExceeded ? (
          <div className="group relative">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[0.7rem]">
              !
            </div>
            <div className="absolute left-6 bottom-0 hidden group-hover:block bg-white p-2 rounded shadow-lg text-xs w-60 z-50">
              Attenzione: La quantità richiesta ({product.quantity}) supera lo stock disponibile ({product.bestPrices.reduce((total, supplier) => total + supplier.stock, 0)}). Non è possibile selezionare questo prodotto.
            </div>
          </div>
        ) : (
          <input 
            type="checkbox" 
            checked={isSelected} 
            disabled={product.quantity === 0}
            className="w-4 h-4"
            readOnly
          />
        )}
      </td>

      {/* Index cell */}
      <td 
        className={`sticky left-[30px] ${bgColorClass} z-50 border-r border-gray-200 p-1 text-[0.7rem] w-[30px]`}
      >
        {usingMockData ? page * rowsPerPage + index + 1 : index + 1}
      </td>

      {/* Combined EAN and Minsan cell */}
      <td
        className={`sticky left-[60px] ${bgColorClass} z-50 border-r border-gray-200 min-w-[120px] p-2`}
      >
        <div>
          <p className="font-medium text-[0.75rem]">
            EAN: {product.ean}
          </p>
          <p className="text-gray-500 text-[0.65rem]">
            Minsan: {product.minsan}
          </p>
        </div>
      </td>

      {/* Product name cell */}
      <td
        className={`sticky left-[180px] ${bgColorClass} z-50 border-r border-gray-200 p-2 max-w-[200px]`}
      >
        <div>
          <p className="font-medium text-[0.75rem] whitespace-nowrap overflow-hidden text-ellipsis">
            {product.name}
          </p>
          <p className="text-gray-500 text-[0.65rem]">
            {product.manufacturer} • {product.inStock ? 'In Stock' : 'Out of Stock'}
          </p>
        </div>
      </td>

      {/* Public price cell */}
      <td
        className={`sticky left-[380px] ${bgColorClass} z-50 border-r border-gray-200 p-2 w-[70px]`}
      >
        <p className="font-medium text-[0.75rem]">
          €{product.publicPrice.toFixed(2)}
        </p>
        <p className="text-gray-500 text-[0.65rem]">
          VAT {product.vat}%
        </p>
      </td>

      {/* Quantity input cell */}
      <td
        className={`sticky left-[450px] ${bgColorClass} z-50 border-r border-gray-200 p-2 w-[70px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          <input
            type="number"
            min="0"
            step="1"
            value={product.quantity || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onQuantityChange(product.id, isNaN(value) ? 0 : value);
            }}
            className={`w-[60px] h-[26px] text-[0.75rem] px-1 py-0.5 text-center rounded border ${
              stockExceeded 
                ? 'border-amber-500 border-2' 
                : 'border-gray-300'
            } focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </td>

      {/* Target Price and Avg. Price cell */}
      <td
        className={`sticky left-[520px] ${bgColorClass} z-50 border-r border-gray-200 shadow-md p-2 w-[100px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {/* Target Price Input */}
          <div className="flex items-center">
            <div className="relative">
              <span className="absolute left-2 top-1 text-[0.75rem]">€</span>
              <input
              type="number"
                min="0"
                step="0.01"
                placeholder="Target"
              value={product.targetPrice !== null ? product.targetPrice : ''}
              onChange={(e) => onTargetPriceChange(product.id, e.target.value)}
                className={`w-[80px] h-[26px] text-[0.75rem] pl-5 pr-2 py-0.5 text-right rounded border ${
                  product.quantity > 0 && product.averagePrice !== null && product.targetPrice !== null
                    ? (product.averagePrice <= product.targetPrice ? 'border-green-500 border-2' : 'border-red-500 border-2')
                    : 'border-gray-300'
                } focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white`}
              onClick={(e) => e.stopPropagation()}
            />
            </div>
          </div>
          
          {/* Average Price Display */}
          {product.quantity > 0 && product.averagePrice !== null ? (
            <div className="ml-1 -mt-1">
              <div className="flex items-center gap-1">
                <p className={`text-[0.65rem] ${
                  stockExceeded ? 'text-amber-500' : (
                    product.targetPrice !== null ? (
                      product.averagePrice <= product.targetPrice ? 'text-green-500' : 'text-red-500'
                    ) : 'text-gray-500'
                  )
                }`}>
                  Avg: €{product.averagePrice.toFixed(2)}
                  {product.targetPrice !== null && product.averagePrice <= product.targetPrice && (
                    <span className="ml-1 text-green-500">✓</span>
                  )}
                  {product.targetPrice !== null && product.averagePrice > product.targetPrice && (
                    <span className="ml-1 text-red-500">(+{(product.averagePrice - product.targetPrice).toFixed(2)})</span>
                  )}
                </p>
                
                {stockExceeded && (
                  <div className="group relative">
                    <div className="inline-flex text-amber-500 text-[0.65rem]">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                      </svg>
                    </div>
                    <div className="absolute left-0 bottom-5 hidden group-hover:block bg-white p-2 rounded shadow-lg text-xs w-60 z-50">
                      Il prezzo medio potrebbe essere impreciso a causa di stock insufficiente
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-[0.65rem] -mt-0.5 ${stockExceeded ? 'text-amber-500' : 'text-gray-500'}`}>
                Total: €{(product.averagePrice * product.quantity).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-[0.65rem] ml-1 -mt-1">
              No avg. price
            </p>
          )}
        </div>
      </td>

      {/* Combine all price columns into one */}
      <td className="p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
      {/* Best price 1 */}
      {product.bestPrices.length > 0 ? (
            <div className="bg-green-50 p-1 rounded mr-1">
              <p className="font-bold text-[0.65rem]">Best Price</p>
          <PriceDisplay
            publicPrice={product.publicPrice}
            supplierPrice={product.bestPrices[0].price}
            vatRate={product.vat}
            stock={product.bestPrices[0].stock}
            backgroundColor="#e8f5e9"
            compact
          />
            </div>
      ) : (
            <div className="bg-green-50 p-1 rounded mr-1">
              <p className="font-bold text-[0.65rem]">Best Price</p>
              <p className="text-gray-500 text-[0.75rem]">
            No supplier
              </p>
            </div>
      )}

      {/* Best price 2 */}
      {product.bestPrices.length > 1 ? (
            <div className="bg-blue-50 p-1 rounded mr-1">
              <p className="font-bold text-[0.65rem]">2nd Best</p>
          <PriceDisplay
            publicPrice={product.publicPrice}
            supplierPrice={product.bestPrices[1].price}
            vatRate={product.vat}
            stock={product.bestPrices[1].stock}
            backgroundColor="#e3f2fd"
            compact
          />
            </div>
      ) : (
            <div className="bg-blue-50 p-1 rounded mr-1">
              <p className="font-bold text-[0.65rem]">2nd Best</p>
              <p className="text-gray-500 text-[0.75rem]">
            No supplier
              </p>
            </div>
      )}

      {/* Best price 3 */}
      {product.bestPrices.length > 2 ? (
            <div className="bg-purple-50 p-1 rounded mr-1">
              <p className="font-bold text-[0.65rem]">3rd Best</p>
          <PriceDisplay
            publicPrice={product.publicPrice}
            supplierPrice={product.bestPrices[2].price}
            vatRate={product.vat}
            stock={product.bestPrices[2].stock}
            backgroundColor="#f3e5f5"
            compact
          />
            </div>
      ) : (
            <div className="bg-purple-50 p-1 rounded mr-1">
              <p className="font-bold text-[0.65rem]">3rd Best</p>
              <p className="text-gray-500 text-[0.75rem]">
            No supplier
              </p>
            </div>
      )}

      {/* Other prices toggle */}
          {product.bestPrices.length > 3 && (
            <div className="col-span-1 md:col-span-3 mt-1">
              <button 
                className="text-blue-500 text-[0.7rem] py-0.5 px-1 min-w-0 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAllPrices(product.id);
              }}
            >
                {product.showAllPrices ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                  </svg>
        ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4 mr-1">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                )}
                {product.showAllPrices ? 'Hide' : `Show ${product.bestPrices.length - 3} more prices`}
              </button>
              
              <StockAvailability bestPrices={product.bestPrices} compact />
            </div>
        )}

          {/* Additional price items that show when "Show More" is clicked */}
      {product.showAllPrices && product.bestPrices.length > 3 && 
        product.bestPrices.slice(3).map((priceInfo, idx) => (
              <div className="bg-gray-50 p-1 rounded mr-1 mt-1" key={idx}>
                <p className="font-bold text-[0.65rem]">Price {idx + 4}</p>
            <PriceDisplay
              publicPrice={product.publicPrice}
              supplierPrice={priceInfo.price}
              vatRate={product.vat}
              stock={priceInfo.stock}
              backgroundColor="#f8f8f8"
              compact
            />
              </div>
        ))
      }
        </div>
      </td>
    </tr>
  );
};

export default ProductRow; 