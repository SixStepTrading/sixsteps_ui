import React from 'react';
import { 
  TableRow, 
  TableCell, 
  Checkbox, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Tooltip
} from '@mui/material';
import { 
  KeyboardArrowUp as KeyboardArrowUpIcon, 
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Info as InfoIcon
} from '@mui/icons-material';
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
      return isSelected ? '#ffe0b2' : '#fff3e0';
    }
    return isSelected ? '#e3f2fd' : 'white';
  };

  const bgColor = getBgColor(isSelected, stockExceeded);

  return (
    <TableRow 
      hover
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
      selected={isSelected}
      sx={{ 
        height: 'auto',
        cursor: stockExceeded ? 'not-allowed' : 'pointer',
        bgcolor: stockExceeded ? '#fff3e0' : 'inherit',
        '&.Mui-selected': {
          bgcolor: stockExceeded ? '#ffe0b2' : '#e3f2fd'
        },
        '&.Mui-selected:hover': {
          bgcolor: stockExceeded ? '#ffcc80' : '#dbeafe'
        },
        '&:hover': {
          bgcolor: stockExceeded ? '#fff8e1' : 'rgba(0, 0, 0, 0.04)'
        }
      }}
    >
      {/* Checkbox cell */}
      <TableCell 
        padding="checkbox" 
        sx={{ 
          position: 'sticky', 
          left: 0, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)'
        }}
      >
        {stockExceeded ? (
          <Tooltip title={`Attenzione: La quantità richiesta (${product.quantity}) supera lo stock disponibile (${product.bestPrices.reduce((total, supplier) => total + supplier.stock, 0)}). Non è possibile selezionare questo prodotto.`}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: '#ff9800',
              color: 'white',
              fontWeight: 'bold'
            }}>
              !
            </Box>
          </Tooltip>
        ) : (
          <Checkbox 
            checked={isSelected} 
            size="small"
            disabled={product.quantity === 0}
          />
        )}
      </TableCell>

      {/* Index cell */}
      <TableCell 
        sx={{ 
          position: 'sticky', 
          left: 50, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)'
        }}
      >
        {usingMockData ? page * rowsPerPage + index + 1 : index + 1}
      </TableCell>

      {/* Combined EAN and Minsan cell */}
      <TableCell
        sx={{ 
          position: 'sticky', 
          left: 90, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)',
          minWidth: 160
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
            EAN: {product.ean}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            Minsan: {product.minsan}
          </Typography>
        </Box>
      </TableCell>

      {/* Product name cell */}
      <TableCell
        sx={{ 
          position: 'sticky', 
          left: 250, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)'
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

      {/* Public price cell */}
      <TableCell
        sx={{ 
          position: 'sticky', 
          left: 450, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)'
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.875rem' }}>
          €{product.publicPrice.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          VAT {product.vat}%
        </Typography>
      </TableCell>

      {/* Quantity input cell */}
      <TableCell
        sx={{ 
          position: 'sticky', 
          left: 550, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)',
          minWidth: 120,
          padding: '6px 8px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            type="number"
            size="small" 
            InputProps={{ 
              inputProps: { min: 0, step: 1 },
              sx: { 
                height: '30px', 
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: stockExceeded ? '#ff9800' : 'rgba(0, 0, 0, 0.12)',
                  borderWidth: stockExceeded ? '2px' : '1px'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: stockExceeded ? '#ff9800' : 'rgba(0, 0, 0, 0.23)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: stockExceeded ? '#ff9800' : '#1976d2'
                }
              }
            }}
            value={product.quantity || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onQuantityChange(product.id, isNaN(value) ? 0 : value);
            }}
            sx={{ 
              width: 100,
              '& input': {
                padding: '6px 8px',
                textAlign: 'center'
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                backgroundColor: 'white'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      </TableCell>

      {/* Average price cell */}
      <TableCell
        sx={{ 
          position: 'sticky', 
          left: 670, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)'
        }}
      >
        {product.quantity > 0 && product.averagePrice !== null ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 'medium', 
                fontSize: '0.875rem',
                color: stockExceeded ? '#ff9800' : 'inherit'
              }}>
                €{product.averagePrice.toFixed(2)}
              </Typography>
              
              {stockExceeded && (
                <Tooltip title="Il prezzo medio potrebbe essere impreciso a causa di stock insufficiente">
                  <Box sx={{ 
                    display: 'inline-flex',
                    color: '#ff9800', 
                    fontSize: '1rem' 
                  }}>
                    <InfoIcon fontSize="small" />
                  </Box>
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" 
              color={stockExceeded ? '#ff9800' : 'text.secondary'} 
              sx={{ fontSize: '0.75rem' }}
            >
              Total: €{(product.averagePrice * product.quantity).toFixed(2)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            --
          </Typography>
        )}
      </TableCell>

      {/* Target price cell */}
      <TableCell
        sx={{ 
          position: 'sticky', 
          left: 770, 
          bgcolor: bgColor,
          zIndex: 2,
          borderRight: '1px solid rgba(224, 224, 224, 0.7)',
          minWidth: 120,
          padding: '6px 8px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            type="number"
            size="small"
            placeholder="€ Target"
            InputProps={{ 
              inputProps: { 
                min: 0, 
                step: 0.01 
              },
              startAdornment: <span style={{ fontSize: '0.875rem', marginRight: 4 }}>€</span>,
              sx: { 
                height: '30px', 
                fontSize: '0.875rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  borderWidth: '1px'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2'
                }
              }
            }}
            value={product.targetPrice !== null ? product.targetPrice : ''}
            onChange={(e) => onTargetPriceChange(product.id, e.target.value)}
            sx={{ 
              width: 100,
              '& input': {
                padding: '6px 8px',
                textAlign: 'right'
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '4px',
                backgroundColor: 'white'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      </TableCell>

      {/* Best price 1 */}
      {product.bestPrices.length > 0 ? (
        <TableCell sx={{ bgcolor: '#e8f5e9' }}>
          <PriceDisplay
            publicPrice={product.publicPrice}
            supplierPrice={product.bestPrices[0].price}
            vatRate={product.vat}
            stock={product.bestPrices[0].stock}
            backgroundColor="#e8f5e9"
          />
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
          <PriceDisplay
            publicPrice={product.publicPrice}
            supplierPrice={product.bestPrices[1].price}
            vatRate={product.vat}
            stock={product.bestPrices[1].stock}
            backgroundColor="#e3f2fd"
          />
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
          <PriceDisplay
            publicPrice={product.publicPrice}
            supplierPrice={product.bestPrices[2].price}
            vatRate={product.vat}
            stock={product.bestPrices[2].stock}
            backgroundColor="#f3e5f5"
          />
        </TableCell>
      ) : (
        <TableCell sx={{ bgcolor: '#f3e5f5' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            No supplier
          </Typography>
        </TableCell>
      )}

      {/* Other prices toggle */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        {product.bestPrices.length > 3 ? (
          <>
            <Button 
              variant="text"
              color="primary"
              size="small" 
              startIcon={product.showAllPrices ? <KeyboardArrowUpIcon /> : <KeyboardArrowRightIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onToggleAllPrices(product.id);
              }}
              sx={{ fontSize: '0.8rem', padding: '4px 8px' }}
            >
              {product.showAllPrices ? 'Hide' : `Show ${product.bestPrices.length - 3} more`}
            </Button>
            
            <StockAvailability bestPrices={product.bestPrices} />
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              None
            </Typography>
            
            {product.bestPrices.length > 0 && (
              <StockAvailability bestPrices={product.bestPrices} />
            )}
          </>
        )}
      </TableCell>

      {/* Additional price columns that show when "Show More" is clicked */}
      {product.showAllPrices && product.bestPrices.length > 3 && 
        product.bestPrices.slice(3).map((priceInfo, idx) => (
          <TableCell key={idx} sx={{ bgcolor: '#f8f8f8' }}>
            <PriceDisplay
              publicPrice={product.publicPrice}
              supplierPrice={priceInfo.price}
              vatRate={product.vat}
              stock={priceInfo.stock}
              backgroundColor="#f8f8f8"
            />
          </TableCell>
        ))
      }
    </TableRow>
  );
};

export default ProductRow; 