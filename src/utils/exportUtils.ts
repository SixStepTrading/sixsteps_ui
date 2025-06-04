import * as XLSX from 'xlsx';

/**
 * Exports selected products to a CSV or Excel file
 * 
 * @param products - Array of products to export
 * @param format - Export format ('csv' or 'xlsx')
 * @param userRole - User role to determine supplier visibility ('Admin' or 'Buyer')
 */
export const exportSelectedProducts = (
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
  format: 'csv' | 'xlsx' = 'xlsx',
  userRole: string = 'Buyer'
): void => {
  try {
    if (products.length === 0) {
      console.error('No products to export');
      return;
    }

    const isAdmin = userRole === 'Admin';

    // Create the data to export
    const exportData = products.map(product => {
      // Calculate VAT values
      const netPublicPrice = product.publicPrice / (1 + product.vat / 100);

      // Base product data
      const baseData: Record<string, any> = {
        'EAN': product.ean || '',
        'MINSAN': product.minsan || '',
        'Product Name': product.name,
        'Manufacturer': product.manufacturer,
        'Public Price (VAT incl.)': product.publicPrice.toFixed(2),
        'Public Price (VAT excl.)': netPublicPrice.toFixed(2),
        'VAT %': product.vat,
      };
      
      // Sort prices from lowest to highest
      const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
      
      // Add each price point and its corresponding data
      sortedPrices.forEach((pricePoint, index) => {
        const priceNumber = index + 1;
        
        // Calculate discounts
        const grossDiscount = product.publicPrice - pricePoint.price;
        const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
        
        const netDiscount = netPublicPrice - pricePoint.price;
        const netDiscountPercent = (netDiscount / netPublicPrice) * 100;
        
        // Price and stock
        baseData[`Price ${priceNumber}`] = pricePoint.price.toFixed(2);
        baseData[`Stock ${priceNumber}`] = pricePoint.stock;
        
        // Discounts
        baseData[`Gross Discount ${priceNumber} (€)`] = grossDiscount.toFixed(2);
        baseData[`Gross Discount ${priceNumber} (%)`] = grossDiscountPercent.toFixed(1);
        baseData[`Net Discount ${priceNumber} (€)`] = netDiscount.toFixed(2);
        baseData[`Net Discount ${priceNumber} (%)`] = netDiscountPercent.toFixed(1);
        
        // Supplier name - conditional on user role
        if (isAdmin && pricePoint.supplier) {
          baseData[`Supplier ${priceNumber}`] = pricePoint.supplier;
        } else {
          baseData[`Supplier ${priceNumber}`] = `Supplier ${priceNumber}`;
        }
      });
      
      return baseData;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Products');
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `selected_products_${date}.${format}`;
    
    // Write and download the file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting products:', error);
  }
};

/**
 * Exports order summary with optimized price selection and detailed breakdown
 * 
 * @param orderName - Name of the order
 * @param products - Array of products in the order with price breakdowns
 * @param format - Export format ('csv' or 'xlsx')
 * @param userRole - User role to determine supplier visibility ('Admin' or 'Buyer')
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

export const exportOrderSummary = (
  orderName: string,
  products: OrderExportProduct[],
  format: 'csv' | 'xlsx' = 'xlsx',
  userRole: string = 'Buyer'
): void => {
  try {
    if (products.length === 0) {
      console.error('No products to export');
      return;
    }

    const isAdmin = userRole === 'Admin';

    // Create the data to export
    const exportData = products.map(product => {
      const totalPrice = product.quantity * product.unitPrice;
      
      // Base product data
      const baseData: Record<string, any> = {
        'Product Code': product.code,
        'Product Name': product.name,
        'Total Quantity': product.quantity,
        'Selected Unit Price': product.unitPrice.toFixed(2),
        'Total Price': totalPrice.toFixed(2),
      };

      // Add average price if available
      if (product.averagePrice) {
        baseData['Average Price'] = product.averagePrice.toFixed(2);
        baseData['Total at Avg Price'] = (product.averagePrice * product.quantity).toFixed(2);
        
        const savings = totalPrice - (product.averagePrice * product.quantity);
        baseData['Savings vs Avg'] = savings.toFixed(2);
      }

      // Add VAT information if available
      if (product.publicPrice && product.vat) {
        const netPublicPrice = product.publicPrice / (1 + product.vat / 100);
        const grossDiscount = product.publicPrice - product.unitPrice;
        const grossDiscountPercent = (grossDiscount / product.publicPrice) * 100;
        const netDiscount = netPublicPrice - product.unitPrice;
        const netDiscountPercent = (netDiscount / netPublicPrice) * 100;

        baseData['Public Price (VAT incl.)'] = product.publicPrice.toFixed(2);
        baseData['Public Price (VAT excl.)'] = netPublicPrice.toFixed(2);
        baseData['VAT %'] = product.vat;
        baseData['Gross Discount (€)'] = grossDiscount.toFixed(2);
        baseData['Gross Discount (%)'] = grossDiscountPercent.toFixed(1);
        baseData['Net Discount (€)'] = netDiscount.toFixed(2);
        baseData['Net Discount (%)'] = netDiscountPercent.toFixed(1);
      }

      // Add price breakdown details if available
      if (product.priceBreakdowns && product.priceBreakdowns.length > 0) {
        product.priceBreakdowns.forEach((breakdown, index) => {
          const tierNumber = index + 1;
          baseData[`Tier ${tierNumber} Qty`] = breakdown.quantity;
          baseData[`Tier ${tierNumber} Price`] = breakdown.unitPrice.toFixed(2);
          baseData[`Tier ${tierNumber} Stock`] = breakdown.stock;
          
          // Supplier name - conditional on user role
          if (isAdmin) {
            baseData[`Tier ${tierNumber} Supplier`] = breakdown.supplier;
          } else {
            baseData[`Tier ${tierNumber} Supplier`] = `Supplier ${tierNumber}`;
          }
        });
      }
      
      return baseData;
    });

    // Add summary totals
    const totalOrderValue = products.reduce((sum, product) => sum + (product.quantity * product.unitPrice), 0);
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
    const uniqueSuppliers = new Set(products.flatMap(p => p.priceBreakdowns?.map(pb => pb.supplier) || [])).size;

    // Add summary row
    const summaryRow: Record<string, any> = {
      'Product Code': 'SUMMARY',
      'Product Name': `${orderName} - Order Summary`,
      'Total Quantity': totalQuantity,
      'Selected Unit Price': '--',
      'Total Price': totalOrderValue.toFixed(2),
    };

    if (products.some(p => p.averagePrice)) {
      const totalAvgPrice = products.reduce((sum, product) => 
        sum + (product.averagePrice ? product.averagePrice * product.quantity : 0), 0);
      summaryRow['Average Price'] = '--';
      summaryRow['Total at Avg Price'] = totalAvgPrice.toFixed(2);
      summaryRow['Savings vs Avg'] = (totalOrderValue - totalAvgPrice).toFixed(2);
    }

    summaryRow['Unique Suppliers'] = uniqueSuppliers;
    
    exportData.push(summaryRow);

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Order Summary');
    
    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const sanitizedOrderName = orderName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `order_${sanitizedOrderName}_${date}.${format}`;
    
    // Write and download the file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting order summary:', error);
  }
}; 