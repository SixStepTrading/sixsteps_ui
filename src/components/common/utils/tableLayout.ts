/**
 * Table layout utility functions for consistent positioning and styling
 */

/**
 * Default cell positions for the product table
 */
export const tableCellPositions = {
  checkbox: 0,
  index: 50,
  codes: 90,
  name: 250,
  publicPrice: 450,
  quantity: 550,
  averagePrice: 670,
  targetPrice: 770
};

/**
 * Default cell widths for the product table
 */
export const tableCellWidths = {
  checkbox: 50,
  index: 40,
  codes: 160,
  name: 200,
  publicPrice: 100,
  quantity: 120,
  averagePrice: 110,
  targetPrice: 120,
  supplierPrice: 120
};

/**
 * Background colors for supplier price columns
 */
export const supplierPriceColors = {
  first: '#e8f5e9',
  second: '#e3f2fd',
  third: '#f3e5f5',
  others: '#f8f8f8'
};

/**
 * Background colors for rows based on status
 */
export const getRowBackgroundColor = (isSelected: boolean, isStockExceeded: boolean): string => {
  if (isStockExceeded) {
    return isSelected ? '#ffe0b2' : '#fff3e0';
  }
  return isSelected ? '#e3f2fd' : 'white';
};

/**
 * Get hover colors for rows based on status
 */
export const getRowHoverStyles = (isStockExceeded: boolean) => {
  return {
    cursor: isStockExceeded ? 'not-allowed' : 'pointer',
    bgcolor: isStockExceeded ? '#fff3e0' : 'inherit',
    '&.Mui-selected': {
      bgcolor: isStockExceeded ? '#ffe0b2' : '#e3f2fd'
    },
    '&.Mui-selected:hover': {
      bgcolor: isStockExceeded ? '#ffcc80' : '#dbeafe'
    },
    '&:hover': {
      bgcolor: isStockExceeded ? '#fff8e1' : 'rgba(0, 0, 0, 0.04)'
    }
  };
}; 