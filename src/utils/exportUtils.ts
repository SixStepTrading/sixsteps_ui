import * as XLSX from 'xlsx';
import { exportAsExcel, exportOrderSummaryExcel } from './exportUtilsExcel';

// Export configuration interface
export interface ExportConfig {
  format: 'csv' | 'xlsx';
  fieldSeparator: ',' | ';' | '\t' | '|';
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | 'none';
  encoding: 'utf-8' | 'utf-8-bom' | 'windows-1252' | 'iso-8859-1';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
  currencySymbol: '€' | '$' | '£' | 'none';
  currencyPosition: 'before' | 'after';
  currencySpace: boolean;
  includeHeader: boolean;
  includeSupplierNames: boolean;
  chunkSize: number;
}

// Default Italian config
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'xlsx',
  fieldSeparator: ';',
  decimalSeparator: ',',
  thousandsSeparator: '.',
  encoding: 'utf-8-bom',
  dateFormat: 'DD/MM/YYYY',
  currencySymbol: '€',
  currencyPosition: 'after',
  currencySpace: true,
  includeHeader: true,
  includeSupplierNames: true,
  chunkSize: 1000,
};

// Format number according to config - WITHOUT rounding, keeps all decimals
const formatNumber = (num: number, config: ExportConfig, decimals?: number): string => {
  // Convert to string without rounding - keeps all original decimals
  let numStr = num.toString();
  
  // Split into integer and decimal parts
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Apply thousands separator to integer part
  let formattedInteger = integerPart;
  if (config.thousandsSeparator !== 'none') {
    formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
  }
  
  // Combine with decimal part (if exists) using configured decimal separator
  let formatted = formattedInteger;
  if (decimalPart.length > 0) {
    formatted = formattedInteger + config.decimalSeparator + decimalPart;
  }
  
  return formatted;
};

// Format currency according to config - WITHOUT rounding
const formatCurrency = (num: number, config: ExportConfig): string => {
  const formatted = formatNumber(num, config);
  
  if (config.currencySymbol === 'none') {
    return formatted;
  }
  
  const space = config.currencySpace ? ' ' : '';
  return config.currencyPosition === 'before'
    ? `${config.currencySymbol}${space}${formatted}`
    : `${formatted}${space}${config.currencySymbol}`;
};

// Format date according to config
const formatDate = (date: Date, config: ExportConfig): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  
  return config.dateFormat
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
};

// Escape CSV field if needed
const escapeCSVField = (value: string, separator: string): string => {
  if (value.includes(separator) || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Progress callback type
export type ExportProgressCallback = (progress: number, message: string) => void;

/**
 * Exports selected products to a CSV or Excel file with chunking and custom config
 * 
 * @param products - Array of products to export
 * @param config - Export configuration
 * @param userRole - User role to determine supplier visibility ('Admin' or 'Buyer')
 * @param onProgress - Optional progress callback
 */
export const exportSelectedProducts = async (
  products: Array<{
    id: string;
    ean: string;
    minsan: string;
    name: string;
    manufacturer: string;
    publicPrice: number;
    bestPrices: Array<{ price: number; stock: number; supplier?: string }>;
    vat: number;
    quantity?: number;
    targetPrice?: number | null;
  }>,
  config: ExportConfig = DEFAULT_EXPORT_CONFIG,
  userRole: string = 'Buyer',
  onProgress?: ExportProgressCallback
): Promise<void> => {
  try {
    if (products.length === 0) {
      return;
    }

    const isAdmin = userRole === 'Admin' && config.includeSupplierNames;
    const chunkSize = config.chunkSize || Math.max(500, Math.floor(products.length / 10));

    onProgress?.(0, 'Preparing export...');

    if (config.format === 'csv') {
      // CSV Export with chunking
      await exportAsCSVChunked(products, config, isAdmin, onProgress);
    } else {
      // Excel Export
      await exportAsExcel(products, config, isAdmin, onProgress);
    }

    onProgress?.(100, 'Export complete!');
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// CSV Export with chunking (memory efficient)
const exportAsCSVChunked = async (
  products: any[],
  config: ExportConfig,
  isAdmin: boolean,
  onProgress?: ExportProgressCallback
): Promise<void> => {
  const separator = config.fieldSeparator;
  let csvContent = '';

  // Build header
  if (config.includeHeader) {
    // Check if any product has quantity or targetPrice
    const hasQuantity = products.some(p => p.quantity !== undefined);
    const hasTargetPrice = products.some(p => p.targetPrice !== undefined && p.targetPrice !== null);
    
    const headers = [
      'EAN',
      'MINSAN',
      'Product Name',
      'Manufacturer',
    ];
    
    // Add quantity and target price columns if present in data
    if (hasQuantity) {
      headers.push('Quantity');
    }
    if (hasTargetPrice) {
      headers.push('Target Price');
    }
    
    headers.push(
      'Public Price (VAT incl.)',
      'Public Price (VAT excl.)',
      'VAT %',
    );
    
    // Add dynamic headers for prices
    const maxPrices = Math.max(...products.map(p => p.bestPrices.length));
    for (let i = 1; i <= maxPrices; i++) {
      headers.push(`Price ${i}`);
      headers.push(`Stock ${i}`);
      headers.push(`Gross Discount ${i} (€)`);
      headers.push(`Gross Discount ${i} (%)`);
      headers.push(`Net Discount ${i} (€)`);
      headers.push(`Net Discount ${i} (%)`);
      if (isAdmin) {
        headers.push(`Supplier ${i}`);
        headers.push(`Warehouse ${i}`);
      }
    }
    
    // Convert headers to uppercase
    csvContent += headers.map(h => escapeCSVField(h.toUpperCase(), separator)).join(separator) + '\n';
  }

  // Check if any product has quantity or targetPrice
  const hasQuantity = products.some(p => p.quantity !== undefined);
  const hasTargetPrice = products.some(p => p.targetPrice !== undefined && p.targetPrice !== null);

  // Process products in chunks
  const chunkSize = config.chunkSize || 1000;
  const totalChunks = Math.ceil(products.length / chunkSize);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, products.length);
    const chunk = products.slice(start, end);

    // Process chunk
    for (const product of chunk) {
      const row = buildProductRow(product, config, isAdmin, hasQuantity, hasTargetPrice);
      csvContent += row.join(separator) + '\n';
    }

    // Update progress
    const progress = Math.round(((chunkIndex + 1) / totalChunks) * 90);
    onProgress?.(progress, `Processing ${end}/${products.length} products...`);

    // Yield to browser to prevent UI freeze
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Download file
  onProgress?.(95, 'Creating file...');
  downloadCSV(csvContent, config);
};

// Removed old exportAsExcel - now using ExcelJS version from exportUtilsExcel.ts

// Build a single product row for CSV
const buildProductRow = (
  product: any, 
  config: ExportConfig, 
  isAdmin: boolean, 
  hasQuantity: boolean, 
  hasTargetPrice: boolean
): string[] => {
  const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
  
  const row: string[] = [
    product.ean || '',
    product.minsan || '',
    product.name,
    product.manufacturer,
  ];
  
  // Add quantity and target price if present
  if (hasQuantity) {
    row.push(product.quantity !== undefined ? product.quantity.toString() : '0');
  }
  if (hasTargetPrice) {
    row.push(product.targetPrice !== undefined && product.targetPrice !== null 
      ? formatCurrency(product.targetPrice, config) 
      : formatCurrency(0, config));
  }
  
  row.push(
    formatCurrency(product.publicPrice, config),
    formatCurrency(netPublicPrice, config),
    product.vat.toString(),
  );
  
  const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
  
  sortedPrices.forEach((pricePoint) => {
    const grossDiscount = product.publicPrice - pricePoint.price;
    const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
    const netDiscount = netPublicPrice - pricePoint.price;
    const netDiscountPercent = (netDiscount / netPublicPrice) * 100;
    
    row.push(
      formatCurrency(pricePoint.price, config),
      pricePoint.stock.toString(),
      formatCurrency(grossDiscount, config),
      formatNumber(grossDiscountPercent, config, 1),
      formatCurrency(netDiscount, config),
      formatNumber(netDiscountPercent, config, 1)
    );
    
    if (isAdmin) {
      row.push(pricePoint.supplier || `Supplier`);
      row.push(pricePoint.warehouse || '');
    }
  });
  
  return row.map(field => escapeCSVField(String(field), config.fieldSeparator));
};

// Download CSV with proper encoding
const downloadCSV = (content: string, config: ExportConfig): void => {
  let blob: Blob;
  const date = new Date().toISOString().split('T')[0];
  const filename = `selected_products_${date}.csv`;
  
  // Add BOM for UTF-8 if needed (helps Excel recognize UTF-8)
  if (config.encoding === 'utf-8-bom') {
    const BOM = '\uFEFF';
    blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' });
  } else if (config.encoding === 'windows-1252') {
    // Note: Modern browsers use UTF-8, so this is best-effort
    blob = new Blob([content], { type: 'text/csv;charset=windows-1252' });
  } else {
    blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports order summary with optimized price selection and detailed breakdown
 * 
 * @param orderName - Name of the order
 * @param products - Array of products in the order with price breakdowns
 * @param config - Export configuration
 * @param userRole - User role to determine supplier visibility ('Admin' or 'Buyer')
 * @param onProgress - Optional progress callback
 */
export interface OrderExportProduct {
  id: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  averagePrice?: number;
  priceBreakdowns?: Array<{
    quantity: number;
    unitPrice: number;
    supplier: string;
    stock: number;
    warehouse?: string;
  }>;
  publicPrice?: number;
  vat?: number;
}

export const exportOrderSummary = async (
  orderName: string,
  products: OrderExportProduct[],
  config: ExportConfig = DEFAULT_EXPORT_CONFIG,
  userRole: string = 'Buyer',
  onProgress?: ExportProgressCallback
): Promise<void> => {
  try {
    if (products.length === 0) {
      return;
    }

    const isAdmin = userRole === 'Admin' && config.includeSupplierNames;

    if (config.format === 'xlsx') {
      // Use ExcelJS for Excel export
      await exportOrderSummaryExcel(orderName, products, config, isAdmin, onProgress);
    } else {
      // CSV export - use XLSX for simple conversion
      onProgress?.(10, 'Preparing CSV export...');
      
      const exportData = products.map((product, index) => {
        if (index % 100 === 0) {
          const progress = Math.round((index / products.length) * 70) + 10;
          onProgress?.(progress, `Processing ${index}/${products.length} items...`);
        }
        
        const totalPrice = product.quantity * product.unitPrice;
        const baseData: Record<string, any> = {
          'PRODUCT CODE': product.code,
          'PRODUCT NAME': product.name,
          'TOTAL QUANTITY': product.quantity,
          'SELECTED UNIT PRICE': formatCurrency(product.unitPrice, config),
          'TOTAL PRICE': formatCurrency(totalPrice, config),
        };

        if (product.averagePrice) {
          baseData['AVERAGE PRICE'] = formatCurrency(product.averagePrice, config);
          baseData['TOTAL AT AVG PRICE'] = formatCurrency(product.averagePrice * product.quantity, config);
          const savings = totalPrice - (product.averagePrice * product.quantity);
          baseData['SAVINGS VS AVG'] = formatCurrency(savings, config);
        }

        if (product.publicPrice && product.vat) {
          const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
          const grossDiscount = product.publicPrice - product.unitPrice;
          const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
          const netDiscount = netPublicPrice - product.unitPrice;
          const netDiscountPercent = (netDiscount / netPublicPrice) * 100;

          baseData['PUBLIC PRICE (VAT INCL.)'] = formatCurrency(product.publicPrice, config);
          baseData['PUBLIC PRICE (VAT EXCL.)'] = formatCurrency(netPublicPrice, config);
          baseData['VAT %'] = product.vat;
          baseData['GROSS DISCOUNT (€)'] = formatCurrency(grossDiscount, config);
          baseData['GROSS DISCOUNT (%)'] = formatNumber(grossDiscountPercent, config, 1);
          baseData['NET DISCOUNT (€)'] = formatCurrency(netDiscount, config);
          baseData['NET DISCOUNT (%)'] = formatNumber(netDiscountPercent, config, 1);
        }

        if (product.priceBreakdowns && product.priceBreakdowns.length > 0) {
          product.priceBreakdowns.forEach((breakdown, index) => {
            const tierNumber = index + 1;
            baseData[`TIER ${tierNumber} QTY`] = breakdown.quantity;
            baseData[`TIER ${tierNumber} PRICE`] = formatCurrency(breakdown.unitPrice, config);
            baseData[`TIER ${tierNumber} STOCK`] = breakdown.stock;
            
            if (isAdmin) {
              baseData[`TIER ${tierNumber} SUPPLIER`] = breakdown.supplier;
              baseData[`TIER ${tierNumber} WAREHOUSE`] = breakdown.warehouse || '';
            }
          });
        }
        
        return baseData;
      });

      onProgress?.(85, 'Creating CSV file...');

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: config.fieldSeparator });
      downloadCSV(csvContent, config);
      
      onProgress?.(100, 'Export complete!');
    }
  } catch (error) {
    console.error('Order export error:', error);
    throw error;
  }
}; 