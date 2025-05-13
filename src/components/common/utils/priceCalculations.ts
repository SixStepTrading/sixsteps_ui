/**
 * Price calculation utilities for the pharmacy application
 */

/**
 * Calculates the percentage difference between public price and supplier price
 * @param publicPrice - The public price
 * @param supplierPrice - The supplier price
 * @returns The percentage difference as a positive value (discount percentage)
 */
export const calculatePriceDifferencePercent = (
  publicPrice: number, 
  supplierPrice: number
): number => {
  if (publicPrice === 0) return 0;
  // Return absolute value to ensure it's a positive discount percentage
  return Math.abs(((publicPrice - supplierPrice) / publicPrice) * 100);
};

/**
 * Calculates the percentage difference between public price and supplier price,
 * after removing VAT ONLY from the public price (not from the supplier price)
 * @param publicPrice - The public price
 * @param supplierPrice - The supplier price (already without VAT)
 * @param vatRate - The VAT rate (e.g., 10 for 10%)
 * @returns The percentage difference as a positive value (discount percentage)
 */
export const calculatePriceDifferencePercentNetVAT = (
  publicPrice: number, 
  supplierPrice: number, 
  vatRate: number
): number => {
  if (publicPrice === 0) return 0;
  
  // Calculate public price without VAT
  const netPublicPrice = publicPrice / (1 + vatRate / 100);
  
  // The supplier price already doesn't include VAT, so we use it directly
  
  // Calculate percentage difference and return absolute value
  return Math.abs(((netPublicPrice - supplierPrice) / netPublicPrice) * 100);
};

/**
 * Calculates the average price based on required quantity and available supplier stocks
 * @param bestPrices - Array of supplier prices with stock information
 * @param quantity - Required quantity
 * @param publicPrice - The public price (fallback if suppliers can't fulfill)
 * @returns The average price or null if quantity is 0
 */
export const calculateAveragePrice = (
  bestPrices: Array<{ price: number; stock: number }>, 
  quantity: number, 
  publicPrice: number
): number | null => {
  if (quantity <= 0) return null;
  
  // Sort prices from lowest to highest
  const sortedPrices = [...bestPrices].sort((a, b) => a.price - b.price);
  if (sortedPrices.length === 0) return publicPrice;
  
  let remainingQuantity = quantity;
  let totalCost = 0;
  
  // Try to fulfill the required quantity starting from the best price
  for (const pricePoint of sortedPrices) {
    if (remainingQuantity <= 0) break;
    
    const quantityFromThisSupplier = Math.min(remainingQuantity, pricePoint.stock);
    totalCost += quantityFromThisSupplier * pricePoint.price;
    remainingQuantity -= quantityFromThisSupplier;
  }
  
  // If we still have remaining quantity, use public price
  if (remainingQuantity > 0) {
    totalCost += remainingQuantity * publicPrice;
  }
  
  // Calculate average price
  return totalCost / quantity;
};

/**
 * Gets the total available stock across all suppliers
 * @param bestPrices - Array of supplier prices with stock information
 * @returns The total available stock
 */
export const getTotalAvailableStock = (
  bestPrices: Array<{ price: number; stock: number }>
): number => {
  return bestPrices.reduce((total, supplier) => total + supplier.stock, 0);
};

/**
 * Checks if the requested quantity exceeds available stock
 * @param quantity - The requested quantity
 * @param bestPrices - Array of supplier prices with stock information
 * @returns True if quantity exceeds available stock
 */
export const isStockExceeded = (
  quantity: number, 
  bestPrices: Array<{ price: number; stock: number }>
): boolean => {
  return quantity > getTotalAvailableStock(bestPrices);
}; 