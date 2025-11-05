import * as XLSX from 'xlsx';

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

// Format number according to config
const formatNumber = (num: number, config: ExportConfig, decimals: number = 2): string => {
  let formatted = num.toFixed(decimals);
  
  // Replace decimal separator
  formatted = formatted.replace('.', config.decimalSeparator);
  
  // Add thousands separator
  if (config.thousandsSeparator !== 'none') {
    const parts = formatted.split(config.decimalSeparator);
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    formatted = parts.join(config.decimalSeparator);
  }
  
  return formatted;
};

// Format currency according to config
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
    const headers = [
      'EAN',
      'MINSAN',
      'Product Name',
      'Manufacturer',
      'Public Price (VAT incl.)',
      'Public Price (VAT excl.)',
      'VAT %',
    ];
    
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
      }
    }
    
    csvContent += headers.map(h => escapeCSVField(h, separator)).join(separator) + '\n';
  }

  // Process products in chunks
  const chunkSize = config.chunkSize || 1000;
  const totalChunks = Math.ceil(products.length / chunkSize);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, products.length);
    const chunk = products.slice(start, end);

    // Process chunk
    for (const product of chunk) {
      const row = buildProductRow(product, config, isAdmin);
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

// Excel Export (uses XLSX library)
const exportAsExcel = async (
  products: any[],
  config: ExportConfig,
  isAdmin: boolean,
  onProgress?: ExportProgressCallback
): Promise<void> => {
  onProgress?.(10, 'Building Excel data...');

  const exportData = products.map((product, index) => {
    if (index % 500 === 0) {
      const progress = Math.round((index / products.length) * 80) + 10;
      onProgress?.(progress, `Processing ${index}/${products.length} products...`);
    }
    
    const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
    const baseData: Record<string, any> = {
      'EAN': product.ean || '',
      'MINSAN': product.minsan || '',
      'Product Name': product.name,
      'Manufacturer': product.manufacturer,
      'Public Price (VAT incl.)': formatCurrency(product.publicPrice, config),
      'Public Price (VAT excl.)': formatCurrency(netPublicPrice, config),
      'VAT %': product.vat,
    };
    
    const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
    
    sortedPrices.forEach((pricePoint, index) => {
      const priceNumber = index + 1;
      const grossDiscount = product.publicPrice - pricePoint.price;
      const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
      const netDiscount = netPublicPrice - pricePoint.price;
      const netDiscountPercent = (netDiscount / netPublicPrice) * 100;
      
      baseData[`Price ${priceNumber}`] = formatCurrency(pricePoint.price, config);
      baseData[`Stock ${priceNumber}`] = pricePoint.stock;
      baseData[`Gross Discount ${priceNumber} (€)`] = formatCurrency(grossDiscount, config);
      baseData[`Gross Discount ${priceNumber} (%)`] = formatNumber(grossDiscountPercent, config, 1);
      baseData[`Net Discount ${priceNumber} (€)`] = formatCurrency(netDiscount, config);
      baseData[`Net Discount ${priceNumber} (%)`] = formatNumber(netDiscountPercent, config, 1);
      
      if (isAdmin && pricePoint.supplier) {
        baseData[`Supplier ${priceNumber}`] = pricePoint.supplier;
      }
    });
    
    return baseData;
  });

  onProgress?.(90, 'Creating Excel file...');
  
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Selected Products');
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `selected_products_${date}.xlsx`;
  
  XLSX.writeFile(wb, filename);
};

// Build a single product row for CSV
const buildProductRow = (product: any, config: ExportConfig, isAdmin: boolean): string[] => {
  const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
  
  const row: string[] = [
    product.ean || '',
    product.minsan || '',
    product.name,
    product.manufacturer,
    formatCurrency(product.publicPrice, config),
    formatCurrency(netPublicPrice, config),
    product.vat.toString(),
  ];
  
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
    onProgress?.(10, 'Preparing order export...');

    const exportData = products.map((product, index) => {
      if (index % 100 === 0) {
        const progress = Math.round((index / products.length) * 70) + 10;
        onProgress?.(progress, `Processing ${index}/${products.length} items...`);
      }
      
      const totalPrice = product.quantity * product.unitPrice;
      
      const baseData: Record<string, any> = {
        'Product Code': product.code,
        'Product Name': product.name,
        'Total Quantity': product.quantity,
        'Selected Unit Price': formatCurrency(product.unitPrice, config),
        'Total Price': formatCurrency(totalPrice, config),
      };

      if (product.averagePrice) {
        baseData['Average Price'] = formatCurrency(product.averagePrice, config);
        baseData['Total at Avg Price'] = formatCurrency(product.averagePrice * product.quantity, config);
        
        const savings = totalPrice - (product.averagePrice * product.quantity);
        baseData['Savings vs Avg'] = formatCurrency(savings, config);
      }

      if (product.publicPrice && product.vat) {
        const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
        const grossDiscount = product.publicPrice - product.unitPrice;
        const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
        const netDiscount = netPublicPrice - product.unitPrice;
        const netDiscountPercent = (netDiscount / netPublicPrice) * 100;

        baseData['Public Price (VAT incl.)'] = formatCurrency(product.publicPrice, config);
        baseData['Public Price (VAT excl.)'] = formatCurrency(netPublicPrice, config);
        baseData['VAT %'] = product.vat;
        baseData['Gross Discount (€)'] = formatCurrency(grossDiscount, config);
        baseData['Gross Discount (%)'] = formatNumber(grossDiscountPercent, config, 1);
        baseData['Net Discount (€)'] = formatCurrency(netDiscount, config);
        baseData['Net Discount (%)'] = formatNumber(netDiscountPercent, config, 1);
      }

      if (product.priceBreakdowns && product.priceBreakdowns.length > 0) {
        product.priceBreakdowns.forEach((breakdown, index) => {
          const tierNumber = index + 1;
          baseData[`Tier ${tierNumber} Qty`] = breakdown.quantity;
          baseData[`Tier ${tierNumber} Price`] = formatCurrency(breakdown.unitPrice, config);
          baseData[`Tier ${tierNumber} Stock`] = breakdown.stock;
          
          if (isAdmin) {
            baseData[`Tier ${tierNumber} Supplier`] = breakdown.supplier;
          }
        });
      }
      
      return baseData;
    });

    const totalOrderValue = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0);
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
    const uniqueSuppliers = new Set(products.flatMap(p => p.priceBreakdowns?.map(pb => pb.supplier) || [])).size;

    const summaryRow: Record<string, any> = {
      'Product Code': 'SUMMARY',
      'Product Name': `${orderName} - Order Summary`,
      'Total Quantity': totalQuantity,
      'Selected Unit Price': '--',
      'Total Price': formatCurrency(totalOrderValue, config),
    };

    if (products.some(p => p.averagePrice)) {
      const totalAvgPrice = products.reduce((sum, product) => 
        sum + (product.averagePrice ? product.averagePrice * product.quantity : 0), 0);
      summaryRow['Average Price'] = '--';
      summaryRow['Total at Avg Price'] = formatCurrency(totalAvgPrice, config);
      summaryRow['Savings vs Avg'] = formatCurrency(totalOrderValue - totalAvgPrice, config);
    }

    summaryRow['Unique Suppliers'] = uniqueSuppliers;
    exportData.push(summaryRow);

    onProgress?.(85, 'Creating file...');
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order Summary');
    
    const date = new Date().toISOString().split('T')[0];
    const sanitizedOrderName = orderName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `order_${sanitizedOrderName}_${date}.${config.format === 'csv' ? 'csv' : 'xlsx'}`;
    
    if (config.format === 'csv') {
      // Export as CSV for orders
      const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: config.fieldSeparator });
      downloadCSV(csvContent, config);
    } else {
      XLSX.writeFile(wb, filename);
    }
    
    onProgress?.(100, 'Export complete!');
  } catch (error) {
    console.error('Order export error:', error);
    throw error;
  }
}; 