import ExcelJS from 'exceljs';
import { ExportConfig, ExportProgressCallback } from './exportUtils';

// Get Excel number format string based on config
export const getExcelCurrencyFormat = (config: ExportConfig): string => {
  // Build base number format based on separators
  let numFormat: string;
  
  if (config.decimalSeparator === ',' && config.thousandsSeparator === '.') {
    // European format: 1.234,56
    numFormat = '#.##0,00';
  } else if (config.decimalSeparator === '.' && config.thousandsSeparator === ',') {
    // US format: 1,234.56
    numFormat = '#,##0.00';
  } else if (config.decimalSeparator === '.' && config.thousandsSeparator === ' ') {
    // Space separator: 1 234.56
    numFormat = '# ##0.00';
  } else if (config.decimalSeparator === ',' && config.thousandsSeparator === ' ') {
    // Space separator: 1 234,56
    numFormat = '# ##0,00';
  } else if (config.thousandsSeparator === 'none') {
    // No thousands separator
    numFormat = config.decimalSeparator === ',' ? '##0,00' : '##0.00';
  } else {
    // Default to US format
    numFormat = '#,##0.00';
  }
  
  // Add currency symbol
  if (config.currencySymbol && config.currencySymbol !== 'none') {
    const space = config.currencySpace ? ' ' : '';
    const symbol = `"${config.currencySymbol}"`;
    
    if (config.currencyPosition === 'before') {
      numFormat = `${symbol}${space}${numFormat}`;
    } else {
      numFormat = `${numFormat}${space}${symbol}`;
    }
  }
  
  return numFormat;
};

// Excel Export using ExcelJS
export const exportAsExcel = async (
  products: any[],
  config: ExportConfig,
  isAdmin: boolean,
  onProgress?: ExportProgressCallback
): Promise<void> => {
  onProgress?.(10, 'Building Excel data...');

  // Check if any product has quantity or targetPrice
  const hasQuantity = products.some(p => p.quantity !== undefined);
  const hasTargetPrice = products.some(p => p.targetPrice !== undefined && p.targetPrice !== null);

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Selected Products');

  // Build headers
  const headers = [
    'EAN',
    'MINSAN',
    'PRODUCT NAME',
    'MANUFACTURER',
  ];
  
  if (hasQuantity) {
    headers.push('QUANTITY');
  }
  if (hasTargetPrice) {
    headers.push('TARGET PRICE');
  }
  
  headers.push(
    'PUBLIC PRICE (VAT INCL.)',
    'PUBLIC PRICE (VAT EXCL.)',
    'VAT %'
  );

  // Add dynamic headers for prices
  const maxPrices = Math.max(...products.map(p => p.bestPrices.length));
  for (let i = 1; i <= maxPrices; i++) {
    headers.push(
      `PRICE ${i}`,
      `STOCK ${i}`,
      `GROSS DISCOUNT ${i} (€)`,
      `GROSS DISCOUNT ${i} (%)`,
      `NET DISCOUNT ${i} (€)`,
      `NET DISCOUNT ${i} (%)`
    );
    if (isAdmin) {
      headers.push(`SUPPLIER ${i}`, `WAREHOUSE ${i}`);
    }
  }

  // Add header row
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Add data rows
  products.forEach((product, index) => {
    if (index % 500 === 0) {
      const progress = Math.round((index / products.length) * 70) + 10;
      onProgress?.(progress, `Processing ${index}/${products.length} products...`);
    }

    const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
    const row = [
      product.ean || '',
      product.minsan || '',
      product.name,
      product.manufacturer,
    ];

    if (hasQuantity) {
      row.push(product.quantity !== undefined ? product.quantity : 0);
    }
    if (hasTargetPrice) {
      row.push(product.targetPrice !== undefined && product.targetPrice !== null ? product.targetPrice : 0);
    }

    row.push(
      product.publicPrice,
      netPublicPrice,
      product.vat
    );

    const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
    sortedPrices.forEach((pricePoint) => {
      const grossDiscount = product.publicPrice - pricePoint.price;
      const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
      const netDiscount = netPublicPrice - pricePoint.price;
      const netDiscountPercent = (netDiscount / netPublicPrice) * 100;

      row.push(
        pricePoint.price,
        pricePoint.stock,
        grossDiscount,
        grossDiscountPercent / 100, // ExcelJS usa 0.5 per 50%
        netDiscount,
        netDiscountPercent / 100
      );

      if (isAdmin) {
        row.push(pricePoint.supplier || '', pricePoint.warehouse || '');
      }
    });

    worksheet.addRow(row);
  });

  onProgress?.(85, 'Applying formatting...');

  // Apply number formatting
  const currencyFormat = getExcelCurrencyFormat(config);
  const percentFormat = '0.00%';

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      
      if (header.includes('PRICE') || (header.includes('DISCOUNT') && header.includes('(€)'))) {
        if (typeof cell.value === 'number' && !isNaN(cell.value)) {
          cell.numFmt = currencyFormat;
        }
      } else if (header.includes('(%)')) {
        if (typeof cell.value === 'number' && !isNaN(cell.value)) {
          cell.numFmt = percentFormat;
        }
      }
    });
  });

  // Auto-size columns
  worksheet.columns.forEach((column, index) => {
    const header = headers[index];
    if (header === 'PRODUCT NAME' || header === 'MANUFACTURER') {
      column.width = 25;
    } else {
      let maxLength = header.length;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Add autofilter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  // Freeze first row
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];

  onProgress?.(95, 'Saving file...');

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const filename = `selected_products_${date}.xlsx`;

  // Write to browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  onProgress?.(100, 'Export complete!');
};

// Excel Export for orders
export const exportOrderSummaryExcel = async (
  orderName: string,
  products: any[],
  config: ExportConfig,
  isAdmin: boolean,
  onProgress?: ExportProgressCallback
): Promise<void> => {
  onProgress?.(10, 'Building Excel data...');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Order Summary');

  // Build headers
  const headers = ['PRODUCT CODE', 'PRODUCT NAME', 'TOTAL QUANTITY', 'SELECTED UNIT PRICE', 'TOTAL PRICE'];
  
  if (products.some(p => p.averagePrice)) {
    headers.push('AVERAGE PRICE', 'TOTAL AT AVG PRICE', 'SAVINGS VS AVG');
  }
  
  if (products.some(p => p.publicPrice)) {
    headers.push(
      'PUBLIC PRICE (VAT INCL.)',
      'PUBLIC PRICE (VAT EXCL.)',
      'VAT %',
      'GROSS DISCOUNT (€)',
      'GROSS DISCOUNT (%)',
      'NET DISCOUNT (€)',
      'NET DISCOUNT (%)'
    );
  }

  const maxTiers = Math.max(...products.map(p => p.priceBreakdowns?.length || 0));
  for (let i = 1; i <= maxTiers; i++) {
    headers.push(`TIER ${i} QTY`, `TIER ${i} PRICE`, `TIER ${i} STOCK`);
    if (isAdmin) {
      headers.push(`TIER ${i} SUPPLIER`, `TIER ${i} WAREHOUSE`);
    }
  }

  // Add header row
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Add data rows
  products.forEach((product, index) => {
    if (index % 100 === 0) {
      const progress = Math.round((index / products.length) * 70) + 10;
      onProgress?.(progress, `Processing ${index}/${products.length} items...`);
    }

    const totalPrice = product.quantity * product.unitPrice;
    const row = [product.code, product.name, product.quantity, product.unitPrice, totalPrice];

    if (products.some(p => p.averagePrice)) {
      row.push(
        product.averagePrice || '',
        product.averagePrice ? product.averagePrice * product.quantity : '',
        product.averagePrice ? totalPrice - (product.averagePrice * product.quantity) : ''
      );
    }

    if (product.publicPrice && product.vat) {
      const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
      const grossDiscount = product.publicPrice - product.unitPrice;
      const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
      const netDiscount = netPublicPrice - product.unitPrice;
      const netDiscountPercent = (netDiscount / netPublicPrice) * 100;

      row.push(
        product.publicPrice,
        netPublicPrice,
        product.vat,
        grossDiscount,
        grossDiscountPercent / 100,
        netDiscount,
        netDiscountPercent / 100
      );
    }

    if (product.priceBreakdowns) {
      product.priceBreakdowns.forEach((breakdown: any) => {
        row.push(breakdown.quantity, breakdown.unitPrice, breakdown.stock);
        if (isAdmin) {
          row.push(breakdown.supplier, breakdown.warehouse || '');
        }
      });
    }

    worksheet.addRow(row);
  });

  // Add summary row
  const totalOrderValue = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0);
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
  const summaryRow = ['SUMMARY', `${orderName} - Order Summary`, totalQuantity, '--', totalOrderValue];
  worksheet.addRow(summaryRow);

  onProgress?.(85, 'Applying formatting...');

  // Apply formatting
  const currencyFormat = getExcelCurrencyFormat(config);
  const percentFormat = '0.00%';

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    headers.forEach((header, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      
      if (header.includes('PRICE') || (header.includes('DISCOUNT') && header.includes('(€)')) || header.includes('SAVINGS')) {
        if (typeof cell.value === 'number' && !isNaN(cell.value)) {
          cell.numFmt = currencyFormat;
        }
      } else if (header.includes('(%)')) {
        if (typeof cell.value === 'number' && !isNaN(cell.value)) {
          cell.numFmt = percentFormat;
        }
      }
    });
  });

  // Auto-size columns
  worksheet.columns.forEach((column, index) => {
    const header = headers[index];
    if (header === 'PRODUCT NAME') {
      column.width = 25;
    } else {
      let maxLength = header.length;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Add autofilter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  // Freeze first row
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];

  onProgress?.(95, 'Saving file...');

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const sanitizedOrderName = orderName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `order_${sanitizedOrderName}_${date}.xlsx`;

  // Write to browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  onProgress?.(100, 'Export complete!');
};

