import * as XLSX from 'xlsx';

/**
 * Exports selected products to a CSV or Excel file
 * 
 * @param products - Array of products to export
 * @param format - Export format ('csv' or 'xlsx')
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
  format: 'csv' | 'xlsx' = 'xlsx'
): void => {
  try {
    if (products.length === 0) {
      console.error('No products to export');
      return;
    }

    // Create the data to export
    const exportData = products.map(product => {
      // Base product data
      const baseData: Record<string, any> = {
        'EAN': product.ean || '',
        'MINSAN': product.minsan || '',
        'Product Name': product.name,
        'Manufacturer': product.manufacturer,
        'Public Price': product.publicPrice.toFixed(2),
      };
      
      // Add all price and stock points
      // Sort prices from lowest to highest
      const sortedPrices = [...product.bestPrices].sort((a, b) => a.price - b.price);
      
      // Add each price point and its corresponding stock
      sortedPrices.forEach((pricePoint, index) => {
        baseData[`Price ${index + 1}`] = pricePoint.price.toFixed(2);
        baseData[`Stock ${index + 1}`] = pricePoint.stock;
        if (pricePoint.supplier) {
          baseData[`Supplier ${index + 1}`] = pricePoint.supplier;
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